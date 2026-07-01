#!/usr/bin/env sh
set -eu

# One-time helper to bootstrap Let's Encrypt certificates for the nginx
# reverse proxy, working around the chicken-and-egg problem: the HTTPS
# server block needs a cert that doesn't exist yet, but certbot needs nginx
# serving the ACME challenge over plain HTTP first.
#
# Usage: ./init-certbot.sh your-domain.com you@example.com
#
# What it does:
#   1. Temporarily swaps nginx/default.conf for the HTTP-only
#      nginx/bootstrap.conf and starts nginx.
#   2. Runs certbot once (via `docker compose run --rm`) to obtain the
#      certificate via the HTTP-01 webroot challenge.
#   3. Restores the full HTTP+HTTPS nginx/default.conf and reloads nginx.
#
# Safe to re-run if it fails partway - it always restores default.conf from
# its backup before exiting on error (see the trap below).

DOMAIN="${1:?Usage: $0 <domain> <email>}"
EMAIL="${2:?Usage: $0 <domain> <email>}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$BACKEND_DIR"

COMPOSE="docker compose -f docker-compose.prod.yml"
BACKUP="nginx/default.conf.bak"

restore_config() {
    if [ -f "$BACKUP" ]; then
        mv "$BACKUP" nginx/default.conf
    fi
}
trap restore_config EXIT

echo "==> Switching nginx to HTTP-only bootstrap config"
cp nginx/default.conf "$BACKUP"
cp nginx/bootstrap.conf nginx/default.conf

echo "==> Starting nginx (HTTP only)"
$COMPOSE up -d nginx

echo "==> Requesting certificate for $DOMAIN"
$COMPOSE run --rm certbot certonly \
    --webroot -w /var/www/certbot \
    -d "$DOMAIN" \
    --email "$EMAIL" --agree-tos --no-eff-email

echo "==> Restoring full HTTP+HTTPS nginx config"
restore_config
trap - EXIT

echo "==> Reloading nginx"
$COMPOSE restart nginx

echo "Done. Certificate for $DOMAIN issued and nginx reloaded with HTTPS enabled."
echo "Remember: nginx/default.conf and nginx/bootstrap.conf both still contain"
echo "the YOUR_DOMAIN placeholder if you haven't replaced it yet - this script"
echo "does not edit those files for you."
