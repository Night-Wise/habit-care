"""HabitCare dev helper.

Usage:
    python app.py          # interactive menu
    python app.py <1-4>    # run an option directly
"""

import os
import shutil
import subprocess
import sys
import time
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
ANDROID_DIR = ROOT_DIR / "android"
RELEASE_DIR = ROOT_DIR / "release"
IS_WINDOWS = os.name == "nt"

BUILDS = {
    "apk": {
        "gradle_task": "assembleRelease",
        "output": ANDROID_DIR / "app" / "build" / "outputs" / "apk" / "release" / "app-release.apk",
        "dest": RELEASE_DIR / "app-release.apk",
    },
    "aab": {
        "gradle_task": "bundleRelease",
        "output": ANDROID_DIR / "app" / "build" / "outputs" / "bundle" / "release" / "app-release.aab",
        "dest": RELEASE_DIR / "app-release.aab",
    },
}


class CommandError(Exception):
    pass


def find_tool(name, sdk_subdir=None):
    path = shutil.which(name)
    if path:
        return path
    sdk = os.environ.get("ANDROID_HOME") or os.environ.get("ANDROID_SDK_ROOT")
    if sdk and sdk_subdir:
        candidate = Path(sdk) / sdk_subdir / (name + (".exe" if IS_WINDOWS else ""))
        if candidate.exists():
            return str(candidate)
    raise CommandError(f"'{name}' not found. Make sure it is installed and on PATH (or ANDROID_HOME is set).")


def run(cmd, cwd=ROOT_DIR):
    print(f"\n> {' '.join(str(c) for c in cmd)}\n", flush=True)
    result = subprocess.run([str(c) for c in cmd], cwd=cwd)
    if result.returncode != 0:
        raise CommandError(f"Command failed with exit code {result.returncode}: {' '.join(str(c) for c in cmd)}")


def npx():
    return find_tool("npx")


def adb_output(adb, *args):
    result = subprocess.run([adb, *args], capture_output=True, text=True)
    return result.stdout.strip()


def running_emulators(adb):
    lines = adb_output(adb, "devices").splitlines()[1:]
    return [line.split()[0] for line in lines if line.startswith("emulator-") and line.split()[-1] == "device"]


def pick_avd(emulator):
    avds = [line.strip() for line in subprocess.run(
        [emulator, "-list-avds"], capture_output=True, text=True
    ).stdout.splitlines() if line.strip() and not line.startswith("INFO")]
    if not avds:
        raise CommandError("No Android Virtual Devices found. Create one in Android Studio > Device Manager.")
    if len(avds) == 1:
        return avds[0]
    print("\nAvailable emulators:")
    for i, avd in enumerate(avds, 1):
        print(f"  {i}. {avd}")
    while True:
        choice = input("Pick an emulator: ").strip()
        if choice.isdigit() and 1 <= int(choice) <= len(avds):
            return avds[int(choice) - 1]


def ensure_emulator_running():
    adb = find_tool("adb", "platform-tools")
    if running_emulators(adb):
        print("Emulator already running.")
        return

    emulator = find_tool("emulator", "emulator")
    avd = pick_avd(emulator)
    print(f"Booting emulator '{avd}'...")
    flags = subprocess.CREATE_NEW_PROCESS_GROUP | subprocess.DETACHED_PROCESS if IS_WINDOWS else 0
    subprocess.Popen(
        [emulator, "-avd", avd],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        creationflags=flags,
        start_new_session=not IS_WINDOWS,
    )

    deadline = time.time() + 300
    while time.time() < deadline:
        for serial in running_emulators(adb):
            if adb_output(adb, "-s", serial, "shell", "getprop", "sys.boot_completed") == "1":
                print("Emulator booted.")
                return
        time.sleep(3)
    raise CommandError("Timed out waiting for the emulator to boot.")


def run_expo():
    run([npx(), "expo", "start"])


def run_emulator():
    ensure_emulator_running()
    run([npx(), "expo", "run:android"])


def build_release(kind):
    build = BUILDS[kind]
    if not ANDROID_DIR.exists():
        raise CommandError("android/ folder not found. Run 'npx expo prebuild -p android' first.")

    run(["node", "scripts/build-apk.js", "preflight", "release"])
    run([find_tool("npm"), "install"])

    gradlew = ANDROID_DIR / ("gradlew.bat" if IS_WINDOWS else "gradlew")
    started = time.time()
    run([gradlew, build["gradle_task"]], cwd=ANDROID_DIR)
    minutes = (time.time() - started) / 60

    if not build["output"].exists():
        raise CommandError(f"Gradle finished but the file was not found at {build['output']}")

    RELEASE_DIR.mkdir(exist_ok=True)
    shutil.copy2(build["output"], build["dest"])
    size_mb = build["dest"].stat().st_size / 1024 / 1024
    print(f"\nBuilt {build['dest'].name} in {minutes:.1f} min -> {build['dest'].relative_to(ROOT_DIR)} ({size_mb:.2f} MB)")


OPTIONS = {
    "1": ("Run the app in Expo (npx expo start)", run_expo),
    "2": ("Run the app in emulator (npx expo run:android)", run_emulator),
    "3": ("Build release .apk and copy to release/", lambda: build_release("apk")),
    "4": ("Build release .aab and copy to release/", lambda: build_release("aab")),
}


def run_option(key):
    label, action = OPTIONS[key]
    print(f"\n=== {label} ===")
    try:
        action()
        return True
    except CommandError as error:
        print(f"\nERROR: {error}")
    except KeyboardInterrupt:
        print("\nStopped.")
    return False


def menu():
    while True:
        print("\n========== HabitCare ==========")
        for key, (label, _) in OPTIONS.items():
            print(f"  {key}. {label}")
        print("  0. Exit")
        try:
            choice = input("\nChoose an option: ").strip()
        except (KeyboardInterrupt, EOFError):
            print()
            return
        if choice in ("0", "q", "exit"):
            return
        if choice in OPTIONS:
            run_option(choice)
        else:
            print("Invalid option.")


if __name__ == "__main__":
    if len(sys.argv) > 1:
        if sys.argv[1] not in OPTIONS:
            sys.exit(f"Unknown option '{sys.argv[1]}'. Use 1-4.")
        sys.exit(0 if run_option(sys.argv[1]) else 1)
    menu()
