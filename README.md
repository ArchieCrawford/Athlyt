<h1>
  <img src="https://github.com/kirkwat/tiktok/assets/60279003/c36ab6a7-056a-4c3c-ad88-bf8fd53ea274" width="56" height="56" style="vertical-align:bottom">
  TikTok made with React Native and Firebase
</h1>

This project is a TikTok clone built using React Native, Expo, TypeScript, Firebase, and Redux. Building off of [SimCoder's TikTok clone tutorial](https://github.com/SimCoderYoutube/TiktokClone), this implementation is refactored to incorporate TypeScript and updated to utilize Firebase v10 and Redux Toolkit.

<p align="center">
  <img src="https://github.com/kirkwat/tiktok/assets/60279003/24265ba0-d014-4e8c-bed8-ddf099850fb4">
</p>

## Features

- Authentication
- Post videos using camera or gallery
- User profiles
  - View user posts
  - Follow/unfollow
  - View user stats (following/followers/likes)
- Feed
  - Explore posts from other users
  - Like/comment on posts
- Directly message users
- User search by email

## Setup & Usage

### Cloud Environment - Supabase

Supabase now provides auth, database, realtime, and storage. Provision a Supabase project, then run the SQL in [`backend/supabase/schema.sql`](backend/supabase/schema.sql) inside the Supabase SQL editor to create tables, triggers, and row-level security policies.

Create a public storage bucket (default name `media`) for uploads, or set your own bucket name in the frontend `.env`.

### Frontend - React Native Application with Expo

1) Add environment variables in `frontend/.env` (or your preferred Expo env file):

```
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
EXPO_PUBLIC_SUPABASE_STORAGE_BUCKET=media
```

2) Install dependencies and start the Expo dev server:

```
cd frontend
npm install
npm run start
```

Use an iOS/Android emulator or Expo Go to open the app.

### Backend

Firebase Functions are no longer required. All server logic now lives in Supabase (SQL triggers/RLS + storage). Keep the `backend/supabase` files as infra reference; nothing needs to be deployed separately.

## Next Steps

There are plenty of features to add, so here is what I would work on next. Feel free to contribute if you are interested.

- Ability to reload profile/feed/chat screens
- Ability to share posts through messaging
- For You feed page vs Following feed page

Local run (dev)

From PowerShell:
cd C:\Users\AceGr\Athlyt\frontend
npm ci (or npm install)
Start Metro:
Dev Client (recommended with your setup): npx expo start --dev-client -c
Expo Go: npx expo start -c
Then:
iOS Simulator: press i in the Expo terminal (mac only), or open the dev-client app on device.
Android Emulator/device: press a (or scan QR / open the dev-client app).
Make sure .env has:

EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
EXPO_PUBLIC_SUPABASE_STORAGE_BUCKET (usually media)
TestFlight (build + upload)

Build an App Store (production) IPA:
cd C:\Users\AceGr\Athlyt\frontend
Optional but recommended so it doesn’t hang on auth prompts: set an EAS token first (Expo dashboard → Access Tokens):
$env:EAS_TOKEN="YOUR_TOKEN_HERE"
Run the script:
powershell -ExecutionPolicy Bypass -File [build.ps1](http://_vscodecontentref_/5) -Platform ios -Profile production -NonInteractive
Submit the build to App Store Connect:
cd C:\Users\AceGr\Athlyt\frontend
npx eas submit -p ios --profile production
Invite testers (this is the “TestFlight invitation”)
In App Store Connect → Your app → TestFlight:
Internal: add tester emails (must be on your App Store Connect team)
External: create a tester group and enable a Public Link (share that link)
If you tell me whether you’re using Dev Client or Expo Go day-to-day, I can tailor the exact “open on device” steps for your setup.