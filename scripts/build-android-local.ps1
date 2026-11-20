param(
    [Parameter(Mandatory = $true)][string]$SdkRoot,
    [string]$GradleCache = 'E:\projects\in work\UniHubBuild\gradle',
    [string]$Architecture = 'armeabi-v7a',
    [string]$NdkVersion = '27.2.12479018',
    [string]$GradleExecutable,
    [switch]$VerboseBuild,
    [string]$DeviceSerial
)
$ErrorActionPreference = 'Stop'
$taskBuildCiValue = [Environment]::GetEnvironmentVariable('CI', 'Process')
$projectRoot = Split-Path -Parent $PSScriptRoot
Push-Location -LiteralPath $projectRoot
try {
    if (!(Test-Path -LiteralPath (Join-Path $SdkRoot 'platforms\android-36\android.jar'))) {
        throw 'Install Android SDK platform 36 in SdkRoot first.'
    }
    if (!(Test-Path -LiteralPath 'android\gradlew.bat')) {
        & npx expo prebuild --platform android --no-install
        if ($LASTEXITCODE -ne 0) { throw 'Native Android project generation failed.' }
    }
    $env:ANDROID_HOME = $SdkRoot
    $env:ANDROID_SDK_ROOT = $SdkRoot
    $env:GRADLE_USER_HOME = $GradleCache
    $sdkProperty = $SdkRoot.Replace('\', '/')
    Set-Content -LiteralPath 'android\local.properties' -Value "sdk.dir=$sdkProperty" -Encoding utf8
    $rootGradle = Get-Content -LiteralPath 'android\build.gradle' -Raw
    $ndkSetting = "rootProject.ext.ndkVersion = `"$NdkVersion`""
    if ($rootGradle -match 'rootProject\.ext\.ndkVersion\s*=\s*"[^"]+"') {
        $rootGradle = $rootGradle -replace 'rootProject\.ext\.ndkVersion\s*=\s*"[^"]+"', $ndkSetting
    } else {
        $rootGradle = $rootGradle.Replace('apply plugin: "expo-root-project"', "$ndkSetting`n`napply plugin: `"expo-root-project`"")
    }
    $localBuildSettings = 'apply from: new File(rootDir.parentFile, "scripts/android-local.gradle")'
    $rootGradle = $rootGradle.Replace("$localBuildSettings`r`n`r`n", '').Replace("$localBuildSettings`n`n", '').Replace($localBuildSettings, '')
    $rootGradle = $rootGradle.Replace('apply plugin: "expo-root-project"', "$localBuildSettings`n`napply plugin: `"expo-root-project`"")
    Set-Content -LiteralPath 'android\build.gradle' -Value ($rootGradle.TrimEnd() + "`n") -Encoding utf8 -NoNewline
    $wrapperSettings = Get-Content -LiteralPath 'android\gradle\wrapper\gradle-wrapper.properties' -Raw
    $wrapperVersion = [regex]::Match($wrapperSettings, 'gradle-([0-9.]+)-bin\.zip').Groups[1].Value
    $verifiedLocalGradle = Join-Path (Split-Path -Parent $GradleCache) "tools\gradle-$wrapperVersion\bin\gradle.bat"
    $gradleCommand = if ($GradleExecutable) { $GradleExecutable } elseif (Test-Path -LiteralPath $verifiedLocalGradle) { $verifiedLocalGradle } else { '.\android\gradlew.bat' }
    $gradleArguments = @('-p', 'android', ':app:packageRelease', "-PreactNativeArchitectures=$Architecture", '-Pexpo.useLegacyPackaging=true', '-Pandroid.enableMinifyInReleaseBuilds=true', '-Pandroid.enableShrinkResourcesInReleaseBuilds=true', '--max-workers=2', '--console=plain')
    if ($VerboseBuild) { $gradleArguments += '--info' }
    # Expo disables Metro cache reset in CI, which can retain old inlined public config.
    Remove-Item Env:CI -ErrorAction SilentlyContinue
    & $gradleCommand @gradleArguments
    if ($LASTEXITCODE -ne 0) { throw 'Android build failed. Inspect the Gradle output.' }
    New-Item -ItemType Directory -Path 'artifacts' -Force | Out-Null
    $apk = Join-Path $projectRoot 'artifacts\UniHub-android-test.apk'
    Copy-Item -LiteralPath 'android\app\build\outputs\apk\release\app-release.apk' -Destination $apk -Force
    Write-Output "Test APK: $apk"
    if ($DeviceSerial) {
        $adb = Join-Path $SdkRoot 'platform-tools\adb.exe'
        & $adb -s $DeviceSerial install -r $apk
        if ($LASTEXITCODE -ne 0) { throw 'APK installation failed.' }
        & $adb -s $DeviceSerial shell am start -n 'app.unihub.mobile/.MainActivity'
        if ($LASTEXITCODE -ne 0) { throw 'App was installed, but could not be launched.' }
    }
} finally {
    [Environment]::SetEnvironmentVariable('CI', $taskBuildCiValue, 'Process')
    Pop-Location
}
