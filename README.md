# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

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

### Copy Release APK to `build-apk`

To copy the generated release APK from the Android build output folder to `habit-app\build-apk\app-release.apk`:

**PowerShell (Windows):**
```powershell
mkdir -Force build-apk; Copy-Item android\app\build\outputs\apk\release\app-release.apk build-apk\app-release.apk
```

**CMD (Windows):**
```cmd
if not exist build-apk mkdir build-apk && copy android\app\build\outputs\apk\release\app-release.apk build-apk\app-release.apk
```

**Bash (macOS/Linux):**
```bash
mkdir -p build-apk && cp android/app/build/outputs/apk/release/app-release.apk build-apk/app-release.apk
```

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
