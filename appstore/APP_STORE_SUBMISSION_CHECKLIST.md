# App Store Submission Checklist (iOS)

## Build & Versioning
- Expo version: 1.0 (frontend/app.json)
- iOS build number incremented (frontend/app.json -> expo.ios.buildNumber)
- App icon is 1024x1024 PNG with no alpha
- Run `npm run verify:icons`
- Create iOS build with EAS

## App Store Connect -> App Information
- App Name: Tayp
- Bundle ID: com.archie.crawford.tayp
- Primary Language
- Category / Secondary Category
- Age Rating questionnaire completed
- Privacy Policy URL set
- App Store Icon: pulled from build (no manual upload needed for iOS)

## App Store Connect -> App Privacy
- Complete privacy nutrition labels
- Data collection and tracking selections are accurate

## App Store Connect -> Pricing and Availability
- Price tier set
- Availability regions selected

## App Store Connect -> iOS App (1.0) -> Prepare for Submission
### Previews and Screenshots
- iPhone 6.5" screenshots required
  - Size: 1242 x 2688 px (portrait)
  - 1 to 10 screenshots
- App previews optional (MP4/MOV)

### App Review Information
- Contact name, email, phone
- Review notes (see appstore/APP_REVIEW_NOTES.md)
- Demo account credentials if login is required

### Version Release
- Automatic
- Manual
- Scheduled (optional)

### Build
- Select the uploaded build (Add Build)

## Final Checks
- Ensure legal links open in-app
- Report/Block flows are reachable
- No endless spinners; empty states are labeled
