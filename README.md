# HabitCare

An [Expo](https://expo.dev) habit tracking app.

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Google login and cloud sync

Google login is optional. Without signing in, habits continue to be stored locally. Signed-in users can choose to merge local habits with cloud data, replace cloud data with local habits, or use cloud data only.

### Configure Supabase

1. Create or open your project at the [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to **Your Project > Connect** and copy the **Project URL**.
3. Go to **Project > Settings > API Keys** and copy the **Publishable key**. It starts with `sb_publishable_`.
4. Copy `.env.example` to `.env` and add the values:

   ```text
   EXPO_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_************************
   ```

   `EXPO_PUBLIC_SUPABASE_ANON_KEY` is the existing environment-variable name used by this app. Put the newer Supabase **Publishable key** in that variable. Do not use a secret or service-role key in the app.
5. Follow [SUPABASE_SETUP.md](SUPABASE_SETUP.md) to create the database table and enable Google OAuth. Do not add `GOOGLE_CLIENT_ID` to `.env` for this implementation; Supabase reads the Google OAuth client credentials from its provider settings.

### Configure Google OAuth

1. In [Google Cloud Console](https://console.cloud.google.com/), create or select a project.
2. Configure **APIs & Services > OAuth consent screen** and add your Google account as a test user when the app is in testing.
3. Under **APIs & Services > Credentials**, create a **Web application** OAuth client ID.
4. In Supabase, open **Authentication > Providers > Google** and copy its callback URL. Add that URL to Google Cloud under **Authorized redirect URIs**. The URL normally looks like `https://your-project-ref.supabase.co/auth/v1/callback`.
5. Paste the Google client ID and client secret into the Supabase Google provider and enable it.
6. In Supabase **Authentication > URL Configuration**, add `habitapp://auth/callback` to the allowed Redirect URLs. For Expo Go, also allow the generated `exp://.../--/auth/callback` URL, or use `exp://**/--/auth/callback` if wildcard redirects are supported. For web testing, add the exact browser origin with `/auth/callback`, such as `http://localhost:8081/auth/callback` or `http://localhost:3000/auth/callback`.

The Google client secret and Supabase secret/service-role key must remain in Supabase or on a server. Do not put either one in `.env` or the app.

### Run backend and frontend

There is no separate backend process in this repository. Supabase is the hosted backend for authentication and cloud habit storage. Configure it using [SUPABASE_SETUP.md](SUPABASE_SETUP.md), then run the Expo frontend:

```bash
npm install
npx expo start --clear
```

Use the Expo terminal shortcuts to open Android, iOS, or web. Native Google OAuth requires a development build or release APK because the app uses the `habitapp://auth/callback` scheme.

## Building Android APKs

### Prerequisites

Install and configure the following tools before building an APK:

- **Node.js** (LTS recommended) and npm
- **Java JDK 17**; set `JAVA_HOME` to the JDK 17 installation directory
- **Android Studio**, including the Android SDK and SDK Platform Tools
- Android SDK packages required by this project:
   - Android SDK Platform 36
   - Android SDK Build-Tools 36.0.0
   - Android SDK Command-line Tools
   - Android NDK 27.1.12297006

After installing Android Studio, complete its first-run setup so the Android SDK is downloaded. Configure the SDK location using either the `ANDROID_HOME` environment variable or the `android/local.properties` file:

```properties
sdk.dir=C:\\Users\\<username>\\AppData\\Local\\Android\\Sdk
```

Verify that Java and the Android SDK are available before building:

```bash
java -version
adb --version
```

The project uses the Gradle wrapper included in the repository, so a separate Gradle installation is not required.

If the project does not have an `android` folder, the APK build script automatically runs:

```bash
npx expo prebuild --platform android
```

You can also run this command manually before building an APK.

### Build Debug APK with npm

```bash
npm run test-apk
```

The debug APK is saved to `build-apk/app-debug.apk`.

### Build Release APK with npm

```bash
npm run release-apk
```

The release APK is saved to `build-apk/app-release.apk`.

Both `release-apk` and `test-apk` first run pre-flight checks (Android project, Java, Android SDK, `.env` Supabase keys, and for release the upload keystore, alias, and passwords) and stop before Gradle starts if anything is wrong. To run only the checks:

```bash
npm run preflight-apk
```

Pass `--skip-preflight` to `scripts/build-apk.js` to bypass them.

### Build Debug APK

```bash
cd android
.\gradlew assembleDebug
```
*(On macOS/Linux, use `./gradlew assembleDebug`)*

### Build Release APK

```bash
cd android
.\gradlew assembleRelease
```
*(On macOS/Linux, use `./gradlew assembleRelease`)*

### Copy Debug APK, Release APK, and Release Bundle

After building, copy the debug APK, release APK, and release AAB from the Android output folders into both `build-apk` and `release`:

| Artifact | Source |
| --- | --- |
| Debug APK | `android/app/build/outputs/apk/debug/app-debug.apk` |
| Release APK | `android/app/build/outputs/apk/release/app-release.apk` |
| Release AAB | `android/app/build/outputs/bundle/release/app-release.aab` |

**PowerShell (Windows):**
```powershell
mkdir -Force build-apk, release
Copy-Item android\app\build\outputs\apk\debug\app-debug.apk build-apk\app-debug.apk
Copy-Item android\app\build\outputs\apk\debug\app-debug.apk release\app-debug.apk
Copy-Item android\app\build\outputs\apk\release\app-release.apk build-apk\app-release.apk
Copy-Item android\app\build\outputs\apk\release\app-release.apk release\app-release.apk
Copy-Item android\app\build\outputs\bundle\release\app-release.aab build-apk\app-release.aab
Copy-Item android\app\build\outputs\bundle\release\app-release.aab release\app-release.aab
```

**CMD (Windows):**
```cmd
if not exist build-apk mkdir build-apk
if not exist release mkdir release
copy android\app\build\outputs\apk\debug\app-debug.apk build-apk\app-debug.apk
copy android\app\build\outputs\apk\debug\app-debug.apk release\app-debug.apk
copy android\app\build\outputs\apk\release\app-release.apk build-apk\app-release.apk
copy android\app\build\outputs\apk\release\app-release.apk release\app-release.apk
copy android\app\build\outputs\bundle\release\app-release.aab build-apk\app-release.aab
copy android\app\build\outputs\bundle\release\app-release.aab release\app-release.aab
```

**Bash (macOS/Linux):**
```bash
mkdir -p build-apk release
cp android/app/build/outputs/apk/debug/app-debug.apk build-apk/app-debug.apk
cp android/app/build/outputs/apk/debug/app-debug.apk release/app-debug.apk
cp android/app/build/outputs/apk/release/app-release.apk build-apk/app-release.apk
cp android/app/build/outputs/apk/release/app-release.apk release/app-release.apk
cp android/app/build/outputs/bundle/release/app-release.aab build-apk/app-release.aab
cp android/app/build/outputs/bundle/release/app-release.aab release/app-release.aab
```

## Building Android App Bundle (.aab)

Use an `.aab` (Android App Bundle) when uploading HabitCare to the Google Play Console. Prerequisites are the same as for APK builds above. Make sure the `android` folder exists (`npx expo prebuild --platform android` if needed).

### Build Release AAB with Gradle

```bash
cd android
.\gradlew bundleRelease
```
*(On macOS/Linux, use `./gradlew bundleRelease`)*

The release AAB is written to:

```text
android/app/build/outputs/bundle/release/app-release.aab
```

You can also use the fully qualified task name:

```bash
cd android
.\gradlew app:bundleRelease
```
*(On macOS/Linux, use `./gradlew app:bundleRelease`)*

After `bundleRelease`, use the [Copy Debug APK, Release APK, and Release Bundle](#copy-debug-apk-release-apk-and-release-bundle) commands above to copy `app-release.aab` into `build-apk` and `release`.

### Signing for Play Store

Play Console rejects bundles signed with the debug keystore (`CN=Android Debug`). Release builds must be signed with the **upload key**.

HabitCare uses **Play App Signing**, so there are two keys:

| Key | Who holds it | Purpose |
| --- | --- | --- |
| App signing key | Google Play | Signs the APKs users download from Play. Never leaves Google. |
| Upload key | You (`habitcare-upload.keystore`) | Signs the AAB you upload, so Play knows it came from you. |

Because Google holds the app signing key, losing the upload key does **not** lose the app. It can be reset (see [If the upload key is lost](#if-the-upload-key-is-lost)).

#### Signing files

All signing files live **outside the repo** in `~/.android-keys/` (on Windows: `C:\Users\<you>\.android-keys\`).

| File | Secret? | What it is |
| --- | --- | --- |
| `~/.android-keys/habitcare-upload.keystore` | **Yes, private** | PKCS12 keystore holding the upload key (alias `my-key-alias`). Required for every release build. |
| `~/.android-keys/upload_certificate.pem` | No, public | Upload certificate exported from the keystore. Only needed to register or reset the upload key in Play Console. |
| `~/.gradle/gradle.properties` | **Yes, contains passwords** | Tells Gradle where the keystore is and how to open it (`MYAPP_UPLOAD_*` variables). |

Current upload key fingerprint (compare with Play Console → App integrity → App signing → Upload key certificate):

```text
SHA-1:   AE:83:A4:6F:73:CB:E3:60:84:FE:E1:69:60:E2:BD:78:1A:98:CF:74
SHA-256: 69:2D:67:9A:FE:59:FA:0E:EB:C9:79:12:F7:A6:70:13:AA:52:68:AE:83:BD:9B:18:B4:D5:D3:52:D3:08:F7:10
```

History: the original upload key (SHA-1 `A2:CF:17:24:D7:95:3F:1A:B9:F7:61:CB:0D:0C:4A:B7:0E:02:70:85`, used for `release/app-releasev1.aab`) was stored in `android/app/`, was deleted when the `android/` folder was regenerated, and was replaced with the key above via an upload key reset (Sep 2026).

Never keep the keystore in `android/`. That folder is generated and gitignored, and `npx expo prebuild --clean` deletes it along with anything inside. `.gitignore` already excludes `*.keystore`, `*.jks`, `*.p12`, and `*.pem`; never force-add them.

#### 1. Create the upload keystore

Only do this for a brand-new app, or when resetting a lost upload key. `keytool` ships with the JDK (`$JAVA_HOME/bin`).

**Git Bash / macOS / Linux:**

```bash
mkdir -p ~/.android-keys
keytool -genkeypair -v -storetype PKCS12 \
  -keystore ~/.android-keys/habitcare-upload.keystore \
  -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000 \
  -dname "CN=HabitCare, OU=Mobile, O=HabitCare, L=Unknown, ST=Unknown, C=US"
```

**PowerShell:**

```powershell
New-Item -ItemType Directory -Force "$HOME\.android-keys" | Out-Null
& "$env:JAVA_HOME\bin\keytool" -genkeypair -v -storetype PKCS12 `
  -keystore "$HOME\.android-keys\habitcare-upload.keystore" `
  -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000 `
  -dname "CN=HabitCare, OU=Mobile, O=HabitCare, L=Unknown, ST=Unknown, C=US"
```

`keytool` prompts for a keystore password (at least 6 characters). PKCS12 keystores use the same password for the key, so you only choose one password.

#### 2. Export the upload certificate (`upload_certificate.pem`)

```bash
keytool -export -rfc \
  -keystore ~/.android-keys/habitcare-upload.keystore \
  -alias my-key-alias \
  -file ~/.android-keys/upload_certificate.pem
```

This file contains only the public certificate. Upload it to Play Console when registering or resetting the upload key.

#### 3. Add Gradle signing variables (do not commit these)

Gradle reads four variables. The keystore can live anywhere, as long as `MYAPP_UPLOAD_STORE_FILE` points to it.

| Variable | Value |
| --- | --- |
| `MYAPP_UPLOAD_STORE_FILE` | Path to the keystore. Use an absolute path with forward slashes. A relative path is resolved against `android/app/`. |
| `MYAPP_UPLOAD_KEY_ALIAS` | `my-key-alias` |
| `MYAPP_UPLOAD_STORE_PASSWORD` | Keystore password |
| `MYAPP_UPLOAD_KEY_PASSWORD` | Same as the keystore password (PKCS12) |

**Option A: user Gradle properties (recommended for this machine).** Create or edit `~/.gradle/gradle.properties` (on Windows: `C:\Users\<you>\.gradle\gradle.properties`):

```properties
MYAPP_UPLOAD_STORE_FILE=C:/Users/<you>/.android-keys/habitcare-upload.keystore
MYAPP_UPLOAD_KEY_ALIAS=my-key-alias
MYAPP_UPLOAD_STORE_PASSWORD=*****
MYAPP_UPLOAD_KEY_PASSWORD=*****
```

Use forward slashes: backslashes are escape characters in `.properties` files. Never put these in `android/gradle.properties` (it is regenerated by prebuild) or any committed file.

**Option B: environment variables (CI, or keeping secrets somewhere else).** Gradle also reads any variable named `ORG_GRADLE_PROJECT_<name>`, and these override `gradle.properties`:

```bash
# Git Bash / macOS / Linux
export ORG_GRADLE_PROJECT_MYAPP_UPLOAD_STORE_FILE="/path/to/habitcare-upload.keystore"
export ORG_GRADLE_PROJECT_MYAPP_UPLOAD_KEY_ALIAS="my-key-alias"
export ORG_GRADLE_PROJECT_MYAPP_UPLOAD_STORE_PASSWORD="*****"
export ORG_GRADLE_PROJECT_MYAPP_UPLOAD_KEY_PASSWORD="*****"
```

```powershell
# PowerShell (current session)
$env:ORG_GRADLE_PROJECT_MYAPP_UPLOAD_STORE_FILE = "D:/secure/habitcare-upload.keystore"
$env:ORG_GRADLE_PROJECT_MYAPP_UPLOAD_KEY_ALIAS = "my-key-alias"
$env:ORG_GRADLE_PROJECT_MYAPP_UPLOAD_STORE_PASSWORD = "*****"
$env:ORG_GRADLE_PROJECT_MYAPP_UPLOAD_KEY_PASSWORD = "*****"
```

To move the whole Gradle user folder (including `gradle.properties`) elsewhere, set `GRADLE_USER_HOME` to the new folder.

#### 4. Back up the keystore and passwords

Right after creating the keystore, store copies in at least two places that are not this laptop:

1. A password manager entry (Bitwarden, 1Password, etc.) containing the keystore password, alias `my-key-alias`, and `habitcare-upload.keystore` as an attachment.
2. An encrypted cloud drive or USB drive holding `habitcare-upload.keystore` and `upload_certificate.pem`.

The keystore is useless without its password, and the password is useless without the keystore, so back up both together.

#### 5. Verify the setup

Run the pre-flight checks. They confirm the keystore exists, the password opens it, the alias exists, and the key password works, without starting Gradle:

```bash
npm run preflight-apk
```

To see the fingerprint and compare it with Play Console:

```bash
keytool -list -v -keystore ~/.android-keys/habitcare-upload.keystore -alias my-key-alias
```

#### 6. Confirm release signing is wired up

`android/app/build.gradle` must use `signingConfigs.release` when `MYAPP_UPLOAD_STORE_FILE` is set. This repo includes `./plugins/withAndroidReleaseSigning.js` so that survives `npx expo prebuild`. If you regenerate native projects, run prebuild again before building.

#### 7. Rebuild and verify the certificate

Do **not** run `./gradlew clean` before a release build. On React Native New Architecture, Gradle’s native clean re-runs CMake against codegen JNI folders that were already deleted, which fails with `add_subdirectory ... codegen/jni which is not an existing directory`.

Instead, delete the stale native cache, then build:

```bash
# From the project root (Git Bash / macOS / Linux)
rm -rf android/app/.cxx
cd android
./gradlew app:bundleRelease
```

*(On Windows PowerShell, from the project root:)*

```powershell
Remove-Item -Recurse -Force .\android\app\.cxx -ErrorAction SilentlyContinue
cd android
.\gradlew app:bundleRelease
```

Copy the new AAB into `release/` (see copy commands above), then confirm it is **not** debug-signed:

```bash
keytool -printcert -jarfile release/app-release.aab
```

The owner must **not** be `CN=Android Debug`, and the SHA-1 must match the upload key certificate in Play Console. Upload that AAB to Play Console.

#### If the upload key is lost

Symptoms: `npm run preflight-apk` reports `Keystore not found`, or Play Console rejects an upload because it is signed with the wrong key.

1. **Search before resetting.** Look for any copy of the keystore (backups, Downloads, old project folders):

   ```bash
   find ~ -type f \( -iname "*.keystore" -o -iname "*.jks" -o -iname "*.p12" \) -not -path "*/node_modules/*" 2>/dev/null
   ```

   For each candidate, compare `keytool -list -v -keystore <file>` against the upload key SHA-1 in Play Console. If one matches, copy it to `~/.android-keys/habitcare-upload.keystore` and you are done.

   The SHA-1 of the key used for a previous build can be read from that build: `keytool -printcert -jarfile release/app-releasev1.aab`.

2. **Confirm it is the upload key.** In Play Console → your app → Test and release → App integrity → App signing, check that the lost key's SHA-1 is listed as the **Upload key certificate**, not the app signing key.

3. **Create a new keystore and certificate** with [step 1](#1-create-the-upload-keystore) and [step 2](#2-export-the-upload-certificate-upload_certificatepem). Keeping the same alias and password means only `MYAPP_UPLOAD_STORE_FILE` may need to change.

4. **Request the reset.** On the App signing page, choose **Request upload key reset**, select "I lost my upload key", and upload `~/.android-keys/upload_certificate.pem`.

5. **Wait for Google.** Play Console shows the date the new upload key becomes active (usually within a couple of days). Until then, Play rejects AABs signed with the new key. Local debug and release APKs still build and install normally.

6. **After activation,** confirm the Upload key certificate in Play Console shows the new SHA-1, update the fingerprint in [Signing files](#signing-files), and [back up](#4-back-up-the-keystore-and-passwords) the new keystore.

Users who installed from Play are not affected by an upload key reset: Google keeps signing their updates with the same app signing key.

See also [Expo: Create a release build locally](https://docs.expo.dev/guides/local-app-production/).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
