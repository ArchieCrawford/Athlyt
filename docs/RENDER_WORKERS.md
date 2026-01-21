# Render Workers (Uploads + Scheduled Jobs)

## Background worker (uploads)
Configured in `render.yaml`:
- rootDir: workers/uploads
- startCommand: node index.js

This worker currently logs "worker running" and exits. Replace with upload logic later.

## Scheduled jobs (cron-like)
Render supports Cron Jobs that run on a schedule. Example command:
- Command: node cron.js
- Schedule: */15 * * * * (every 15 minutes)

Suggested flow:
1) Add a new script file in `workers/uploads/cron.js`.
2) Configure a Render Cron Job with the command above.
3) Store secrets as Render environment variables (server-only).
