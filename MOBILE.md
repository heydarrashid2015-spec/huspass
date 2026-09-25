# HusPass mobile build

HusPass is prepared for Android and iOS with Capacitor while the production web app remains at https://huspass.dk.

## Current mobile identity
- App name: HusPass
- App ID: dk.huspass.app
- Production URL: https://huspass.dk
- Cleartext HTTP: disabled

## Android local build
1. Install Node.js and Android Studio.
2. Run `npm install`.
3. Run `npx cap add android` once.
4. Run `npm run cap:sync`.
5. Run `npm run cap:android`.

This creates/opens the native Android project for local testing without a Google Play account.

## iOS local build
A Mac with Xcode is required.
1. Run `npm install`.
2. Run `npx cap add ios` once.
3. Run `npm run cap:sync`.
4. Run `npm run cap:ios`.

App Store publication is intentionally not enabled. No paid store service is required for the current preparation stage.
