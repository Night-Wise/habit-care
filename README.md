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
