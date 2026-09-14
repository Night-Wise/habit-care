Write-Host "========== SYSTEM =========="

node -v
npm -v

Write-Host ""
Write-Host "========== JAVA =========="

java -version
javac -version
Write-Host "JAVA_HOME:"
$env:JAVA_HOME

Write-Host ""
Write-Host "========== ANDROID =========="

Write-Host "ANDROID_HOME:"
$env:ANDROID_HOME

adb --version

Write-Host ""
Write-Host "========== ADB DEVICES =========="

adb devices

Write-Host ""
Write-Host "========== EXPO =========="

npx expo --version

Write-Host ""
Write-Host "========== EXPO DOCTOR =========="

npx expo-doctor

Write-Host ""
Write-Host "========== GRADLE =========="

if (Test-Path ".\android\gradlew.bat") {
    .\android\gradlew.bat --version
} else {
    Write-Host "Gradle wrapper not found - android folder may not exist yet."
}

Write-Host ""
Write-Host "========== DONE =========="