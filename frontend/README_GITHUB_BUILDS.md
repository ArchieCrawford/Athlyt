# GitHub PR label builds (Expo GitHub App)

This repo uses the Expo GitHub App to trigger EAS builds from PR labels.

## Required setup
- Install the Expo GitHub App for this repo.
- Link the repo to the Expo project in the Expo dashboard.
- Set the EAS base directory to `/frontend` for this app.

## Label format
`eas-build-[platform]:[profile]`

- platform: `ios` | `android` | `all` (default: `all`)
- profile: any profile in `frontend/eas.json` (default: `production`)

Examples:
- `eas-build` (all + production)
- `eas-build-ios` (ios + production)
- `eas-build-android:preview`
- `eas-build-all:development`

## How it runs
- Adding a label triggers a build for the latest commit on the PR base branch.
- Build status is reported back to the PR by the Expo GitHub App.
