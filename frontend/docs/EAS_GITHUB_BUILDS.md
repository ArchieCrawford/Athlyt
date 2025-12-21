# EAS GitHub PR Label Builds

## Setup

- Install and configure the Expo GitHub App for this repo.
- In Expo dashboard, set the project base directory to `/frontend`.
- Ensure `frontend/eas.json` has the build profiles you want to trigger.

## PR Label Triggers

Labels follow: `eas-build-[platform]:[profile]`
- Platform: `ios`, `android`, or `all` (defaults to `all`)
- Profile: any profile from `frontend/eas.json` (defaults to `production`)

Examples:
- `eas-build`
- `eas-build-ios`
- `eas-build-android:preview`
- `eas-build-all:development`

Builds run for the latest commit on the PR base branch and report status in PR checks.
