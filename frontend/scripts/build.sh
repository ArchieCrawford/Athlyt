#!/usr/bin/env bash
set -euo pipefail

PLATFORM="${1:-}"
PROFILE="${2:-production}"

if [[ -z "$PLATFORM" ]]; then
  echo "Usage: ./scripts/build.sh <ios|android|all> [profile]"
  exit 2
fi

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$ROOT/logs"
TS="$(date +"%Y%m%d_%H%M%S")"
LOG_FILE="$LOG_DIR/eas_build_${PLATFORM}_${PROFILE}_${TS}.log"

mkdir -p "$LOG_DIR"

log() { echo "[$(date +"%Y-%m-%d %H:%M:%S")] $*" | tee -a "$LOG_FILE"; }
run() { log "RUN: $*"; eval "$*" 2>&1 | tee -a "$LOG_FILE"; }

require_file() { [[ -f "$1" ]] || { log "Missing required file: $1"; exit 1; }; }
require_cmd() { command -v "$1" >/dev/null 2>&1 || { log "Missing command: $1"; exit 1; }; }

cd "$ROOT"
log "Build started. Platform=$PLATFORM Profile=$PROFILE Root=$ROOT"
log "Log file: $LOG_FILE"

require_file "$ROOT/package.json"
require_file "$ROOT/eas.json"
require_cmd node
require_cmd npx

run "node -v"
run "npx eas --version"

if [[ -f "$ROOT/package-lock.json" ]]; then
  log "Detected package-lock.json -> npm ci"
  run "npm ci"
elif [[ -f "$ROOT/yarn.lock" ]]; then
  require_cmd yarn
  log "Detected yarn.lock -> yarn install --frozen-lockfile"
  run "yarn install --frozen-lockfile"
elif [[ -f "$ROOT/pnpm-lock.yaml" ]]; then
  require_cmd pnpm
  log "Detected pnpm-lock.yaml -> pnpm install --frozen-lockfile"
  run "pnpm install --frozen-lockfile"
else
  log "No lockfile detected -> npm install"
  run "npm install"
fi

if npx --yes expo --version >/dev/null 2>&1; then
  log "Preflight: expo export (bundle check)"
  if [[ "$PLATFORM" == "ios" ]]; then
    run "npx expo export --platform ios"
  elif [[ "$PLATFORM" == "android" ]]; then
    run "npx expo export --platform android"
  else
    run "npx expo export --platform ios"
    run "npx expo export --platform android"
  fi
else
  log "Skipping expo export preflight (expo not found)."
fi

if [[ "$PLATFORM" == "ios" ]]; then
  run "npx eas build -p ios --profile $PROFILE"
elif [[ "$PLATFORM" == "android" ]]; then
  run "npx eas build -p android --profile $PROFILE"
else
  run "npx eas build -p ios --profile $PROFILE"
  run "npx eas build -p android --profile $PROFILE"
fi

log "Build finished successfully."
