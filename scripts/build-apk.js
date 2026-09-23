const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const target = process.argv[2] === 'debug' ? 'debug' : 'release';
const gradleTask = target === 'release' ? 'assembleRelease' : 'assembleDebug';
const apkFilename = target === 'release' ? 'app-release.apk' : 'app-debug.apk';

const rootDir = path.resolve(__dirname, '..');
const androidDir = path.join(rootDir, 'android');
const releaseDir = path.join(rootDir, 'release');
const outputApkPath = path.join(
  androidDir,
  'app',
  'build',
  'outputs',
  'apk',
  target,
  apkFilename
);
const destApkPath = path.join(releaseDir, apkFilename);

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const gradleCmd = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';

console.log(`\n🚀 Starting ${target.toUpperCase()} APK build...\n`);

console.log('📥 Running npm install...\n');
execSync(`${npmCmd} install`, {
  cwd: rootDir,
  stdio: 'inherit',
  env: process.env,
});

if (!fs.existsSync(androidDir)) {
  throw new Error(`Android folder not found at ${androidDir}. Run "npx expo prebuild --platform android" first.`);
}

if (!fs.existsSync(releaseDir)) {
  fs.mkdirSync(releaseDir, { recursive: true });
}

console.log(`\n🛠 Running Gradle ${gradleTask}...\n`);
execSync(`${gradleCmd} ${gradleTask}`, {
  cwd: androidDir,
  stdio: 'inherit',
  env: process.env,
});

if (!fs.existsSync(outputApkPath)) {
  throw new Error(`Output APK not found at ${outputApkPath}`);
}

fs.copyFileSync(outputApkPath, destApkPath);
console.log(`\n✅ Built ${apkFilename} and saved to release/${apkFilename}\n`);
