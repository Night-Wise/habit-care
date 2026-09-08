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

console.log(`\n🚀 Starting ${target.toUpperCase()} APK build...\n`);

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
try {
  execSync(`${gradleCmd} ${gradleTask} -PnewArchEnabled=true`, {
    cwd: androidDir,
    stdio: 'inherit',
    env: process.env,
  });
} catch (err) {
  console.error(`\n❌ Gradle build failed.`);
  process.exit(1);
}

// 3. Copy built APK to build-apk/ directory
if (fs.existsSync(outputApkPath)) {
  fs.copyFileSync(outputApkPath, destApkPath);
  console.log(`\n✅ Successfully built ${apkFilename} and saved to build-apk/${apkFilename}\n`);
} else {
  console.error(`\n❌ Error: Output APK not found at ${outputApkPath}`);
  process.exit(1);
}
