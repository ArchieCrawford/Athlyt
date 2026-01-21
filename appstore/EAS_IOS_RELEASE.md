# EAS iOS Release (Tayp)

## Preflight
1) `cd frontend`
2) `npm run verify:icons`
3) Confirm `frontend/app.json`:
   - `expo.version` is correct
   - `expo.ios.buildNumber` incremented
   - `expo.icon` and `expo.ios.icon` set to `./assets/icon.png`

## Build (iOS)
```bash
cd frontend
eas build -p ios --profile production
```
Expected output:
- EAS build ID and a build URL in the terminal
- Build status updates in the EAS dashboard

## Submit to App Store Connect
```bash
cd frontend
eas submit -p ios --profile production --latest
```
Expected output:
- Submission ID and status (processing/uploaded)
- App Store Connect should show the build under TestFlight after processing

## Bump build number
- Update `frontend/app.json` -> `expo.ios.buildNumber` (string) before each new build.
- Keep `expo.version` in sync with App Store Connect version.

## Common failures and fixes
- Icon error (alpha/size): run `npm run verify:icons` and replace the icon with a 1024x1024 PNG without transparency.
- Credentials/provisioning: run `eas credentials` and reconfigure signing.
- Bundle ID mismatch: confirm `expo.ios.bundleIdentifier` in `frontend/app.json`.
- App Store Connect rejects build: verify Info.plist usage strings and privacy settings.
- Build stuck or failed: check EAS build logs and retry when status recovers.
