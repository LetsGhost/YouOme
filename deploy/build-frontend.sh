#!/usr/bin/env sh
set -eu

# Builds the frontend SPA and copies the output into ./static, which the
# nginx service in docker-compose.prod.yml mounts and serves.
#
# Run from anywhere - paths are resolved relative to this script, not to the
# current working directory.
#
# Usage: ./build-frontend.sh
# (re-run any time frontend/ changes and needs to be redeployed)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"        # backend/ - where docker-compose.prod.yml lives
FRONTEND_DIR="$(cd "$BACKEND_DIR/../frontend" && pwd)"
STATIC_DIR="$BACKEND_DIR/static"

echo "==> Building frontend in $FRONTEND_DIR"
cd "$FRONTEND_DIR"
npm ci
npm run build

echo "==> Copying frontend/dist -> $STATIC_DIR"
rm -rf "$STATIC_DIR"
mkdir -p "$STATIC_DIR"
cp -r dist/. "$STATIC_DIR/"

echo "Done. Static files are in $STATIC_DIR"
