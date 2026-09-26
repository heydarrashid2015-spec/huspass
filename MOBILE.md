# HusPass mobile build

HusPass is prepared for Android and iOS with Capacitor while the production web app remains at https://huspass.dk.

## Current mobile identity
- App name: HusPass
- App ID: dk.huspass.app
- Production URL: https://www.huspass.dk
- Cleartext HTTP: disabled
- HusPass domains stay inside the native app.

## Android build status
GitHub Actions now produces:
- A debug APK for private device testing.
- An unsigned release AAB for Google Play preparation.

The release AAB must NOT be published until it is signed with a permanent private upload key.

## Secure Google Play signing plan
Never commit a keystore, passwords, service-account JSON, or other secrets to this repository.

When a Google Play developer account is activated, create one permanent Android upload key and store it privately. GitHub Actions secrets can then be used for the signing material. Keep an offline backup of the upload key and its passwords.

Recommended secret names:
- ANDROID_KEYSTORE_BASE64
- ANDROID_KEYSTORE_PASSWORD
- ANDROID_KEY_ALIAS
- ANDROID_KEY_PASSWORD

The public repository must contain only the workflow logic, never the secret values.

## Android local build
1. Install Node.js and Android Studio.
2. Run `npm install`.
3. Run `npx cap add android` once.
4. Run `npm run cap:sync`.
5. Run `npm run cap:android`.

## iOS local build
A Mac with Xcode is required.
1. Run `npm install`.
2. Run `npx cap add ios` once.
3. Run `npm run cap:sync`.
4. Run `npm run cap:ios`.

App Store and Google Play paid publication are intentionally not activated. No paid store service is required for the current preparation stage.


## Signing-key safety gate
Repository scan confirmed that no Android keystore, private-key, key-properties, Google service-account, or Google Services credential file is currently tracked in the public repository.

Before creating the permanent upload key:
1. Generate it only in a private environment.
2. Keep at least one encrypted/offline backup controlled by the app owner.
3. Store CI values only as private GitHub Actions secrets.
4. Never paste the keystore, passwords, service-account JSON, or private keys into source files, issues, logs, screenshots, or public documentation.
5. Build the first signed release only after the secret names and signing workflow have been verified.
