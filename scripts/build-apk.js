const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const target = process.argv[2] === 'debug' ? 'debug' : 'release';
const isRelease = target === 'release';

const gradleTask = isRelease ? 'assembleRelease' : 'assembleDebug';
const apkFilename = isRelease ? 'app-release.apk' : 'app-debug.apk';

const rootDir = path.resolve(__dirname, '..');
const androidDir = path.join(rootDir, 'android');
const outputApkPath = path.join(
  androidDir,
  'app',
  'build',
  'outputs',
  'apk',
  target,
  apkFilename
);
const buildApkDir = path.join(rootDir, 'build-apk');
const destApkPath = path.join(buildApkDir, apkFilename);

const packageJsonPath = path.join(rootDir, 'package.json');

const BUILD_REANIMATED_VERSION = '4.5.1';
const ORIGINAL_REANIMATED_VERSION = '3.19.5';

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function setReanimatedVersionInPackageJson(version) {
  if (fs.existsSync(packageJsonPath)) {
    let content = fs.readFileSync(packageJsonPath, 'utf8');
    content = content.replace(
      /"react-native-reanimated":\s*"[^"]+"/,
      `"react-native-reanimated": "${version}"`
    );
    fs.writeFileSync(packageJsonPath, content, 'utf8');
  }
}

function runNpmInstall() {
  console.log(`\n📥 Running npm install to sync dependencies...\n`);
  execSync(`${npmCmd} install`, {
    cwd: rootDir,
    stdio: 'inherit',
    env: process.env,
  });
}

function revertAndRestore() {
  console.log(`\n🔄 Reverting react-native-reanimated version back to ${ORIGINAL_REANIMATED_VERSION}...`);
  setReanimatedVersionInPackageJson(ORIGINAL_REANIMATED_VERSION);
  runNpmInstall();
}

// Signal handlers to ensure revert on interrupt
process.on('SIGINT', () => {
  console.log(`\n\n⚠️ Interrupted.`);
  revertAndRestore();
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('\n❌ Uncaught Exception:', err);
  revertAndRestore();
  process.exit(1);
});

console.log(`\n🚀 Starting ${target.toUpperCase()} APK build...\n`);

// Temporarily set reanimated version to 4.5.5 and install
console.log(`📦 Temporarily setting react-native-reanimated version to ${BUILD_REANIMATED_VERSION} for build...`);
setReanimatedVersionInPackageJson(BUILD_REANIMATED_VERSION);
runNpmInstall();

let buildError = null;

try {
  // 1. Ensure target build-apk directory exists safely without errors
  if (!fs.existsSync(buildApkDir)) {
    fs.mkdirSync(buildApkDir, { recursive: true });
  }

  // 2. Clean stale CXX build cache if Paper/Fabric mismatch exists
  try {
    fs.rmSync(path.join(androidDir, 'app', '.cxx'), { recursive: true, force: true });
    fs.rmSync(path.join(rootDir, 'node_modules', 'react-native-reanimated', 'android', '.cxx'), { recursive: true, force: true });
  } catch (_) {}

  // 3. Execute Gradle build with New Architecture enabled
  const gradleCmd = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
  execSync(`${gradleCmd} ${gradleTask} -PnewArchEnabled=true`, {
    cwd: androidDir,
    stdio: 'inherit',
    env: process.env,
  });

  // 4. Copy built APK to build-apk/ directory
  if (fs.existsSync(outputApkPath)) {
    fs.copyFileSync(outputApkPath, destApkPath);
    console.log(`\n✅ Successfully built ${apkFilename} and saved to build-apk/${apkFilename}\n`);
  } else {
    throw new Error(`Output APK not found at ${outputApkPath}`);
  }
} catch (err) {
  buildError = err;
} finally {
  // Always revert reanimated version back to 3.19.5 and reinstall
  revertAndRestore();
}

if (buildError) {
  console.error(`\n❌ APK build failed.`);
  process.exit(1);
}


