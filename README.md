# Kosinus Backend Architecture

A TypeScript/Express backend architecture with MongoDB, JWT authentication, Swagger documentation, event-driven messaging, and scheduled job support.

## Features
- **Express.js** - Web framework
- **MongoDB + Typegoose** - Data persistence with ORM
- **JWT Authentication** - Secure user authentication
- **Event-Driven Architecture** - Event bus and event handlers
- **Scheduled Jobs** - Background job scheduling with node-cron
- **Redis Integration** - Caching and state management
- **Swagger/OpenAPI** - Interactive API documentation
- **Rate Limiting** - Request throttling and DDoS protection
- **Logging** - Winston logger with HTTP request logging
- **Type Safety** - Full TypeScript support

## Requirements
- Node.js 18+
- MongoDB (local or connection string)
- Redis (optional, for caching)

## Setup
1. Install dependencies:
   ```sh
   npm install
   ```
2. Configure environment:
   - Copy `.env` (already present) and update values if needed.
   - Defaults: local MongoDB, dev mode, and auth bypass enabled.
   - Set `DISABLE_EMAIL_VERIFICATION=true` to skip email verification during registration and sign users in immediately.
   - Rate limits are configurable with `API_RATE_LIMIT_MAX`, `API_RATE_LIMIT_WINDOW_MS`, `AUTH_RATE_LIMIT_MAX`, and `AUTH_RATE_LIMIT_WINDOW_MS`.

3. Run in development:
   ```sh
   npm run dev
   ```

4. API Docs:
   - Swagger UI: http://localhost:3000/api-docs
   - JSON: http://localhost:3000/api-docs.json

## Build & Run
```sh
npm run build
npm start
```

## Scripts
- dev: start with ts-node-dev
- build: compile TypeScript to `dist/`
- start: run compiled server
- lint: run ESLint

## Architecture

### Module Structure
The application is built with modular architecture where each feature is self-contained:
- **Authentication** - JWT token generation and validation
- **User** - User management and registration
- **Redis** - Caching and state management
- **Common** - Shared utilities including base classes, logging, event bus, and scheduling

### Key Components
- **BaseController** - Automatic route registration and Swagger documentation
- **BaseService** - CRUD operations and transaction support
- **EventBus** - Domain event publishing and handling
- **Scheduler** - Background job execution with cron patterns
- **Request Context** - Request tracing and logging

## Notes
- Auth bypass (BYPASS_AUTH=true) allows testing protected routes without JWT in development.
- Logs are written to `logs/` and console.
- Redis is optional but recommended for production deployments.
- All controllers are automatically discovered and registered on startup.

## Production (Docker)

`docker-compose.prod.yml` (in this directory) runs the full stack behind an
nginx reverse proxy with Let's Encrypt TLS: `nginx`, `backend`, `mongodb`,
`redis`, and `certbot`. All commands below assume you're in `backend/` on the
target server, with Docker + Docker Compose (v2, the `docker compose` plugin)
installed.

### 1. Required `.env`

`docker-compose.prod.yml` reads `backend/.env` (via `env_file`) plus these
`${VAR}` substitutions it expects directly:

| Variable | Used for |
|---|---|
| `APP_URL` | passed to the backend as `APP_URL` |
| `MONGO_USER` | Mongo root user (compose + Mongo URI) |
| `MONGO_PASSWORD` | Mongo root password (compose + Mongo URI) |
| `MONGO_DB` | Mongo database name (compose + Mongo URI) |
| `REDIS_PASSWORD` | Redis auth password (compose + healthcheck) |

These can live in `backend/.env` alongside the normal app variables (see
`example.env`) - just make sure production values replace the dev defaults
(`JWT_SECRET`, `JWT_REFRESH_SECRET`, `SYSTEM_ADMIN_EMAILS`, `ALLOWED_ORIGINS`,
`RESEND_API_KEY`, etc. should all be real production secrets, not the
placeholders in `example.env`). `NODE_ENV`/`PORT` are set directly in the
compose file and don't need to be in `.env`.

### 2. Build the frontend into `./static`

The `nginx` service serves the frontend from `./static` (bind-mounted to
`/var/www/static`), but nothing builds it there automatically. Run:

```sh
./deploy/build-frontend.sh
```

This runs `npm ci && npm run build` in `../frontend` (using
`frontend/.env.production` for `VITE_API_BASE_URL`) and copies
`frontend/dist/*` into `./static`. Re-run it whenever the frontend changes.

### 3. First-time TLS bootstrap (chicken-and-egg)

The HTTPS server block in `nginx/default.conf` needs a certificate that
doesn't exist yet, but certbot needs nginx serving the ACME HTTP-01 challenge
first. Before the very first `up`:

1. Replace the `YOUR_DOMAIN` placeholder in `nginx/default.conf` and
   `nginx/bootstrap.conf` with your real domain.
2. Run the bootstrap helper, which temporarily swaps in the HTTP-only config,
   starts nginx, requests the cert, then restores the full config:
   ```sh
   ./deploy/init-certbot.sh your-domain.com you@example.com
   ```
   (equivalent manual steps are documented in the comments at the top of
   `deploy/init-certbot.sh` if you'd rather run them by hand.)

**Renewal**: the certbot image's default command just prints help text and
exits - it does not renew anything by itself. `docker-compose.prod.yml`
overrides the `certbot` service's entrypoint with a loop that runs
`certbot renew` every 12 hours (a no-op unless the cert is near expiry), so
once the stack is up with `docker compose up -d`, renewal is automatic and no
external cron/systemd timer is needed. nginx does **not** auto-reload on
renewal - if you see cert warnings after a renewal, run
`docker compose -f docker-compose.prod.yml restart nginx`.

### 4. Bring the stack up

```sh
docker compose -f docker-compose.prod.yml up -d --build
```

Day-to-day:

```sh
docker compose -f docker-compose.prod.yml logs -f            # tail all logs
docker compose -f docker-compose.prod.yml logs -f backend    # a single service
docker compose -f docker-compose.prod.yml restart nginx      # e.g. after a config/cert change
docker compose -f docker-compose.prod.yml up -d --build backend  # redeploy backend only
docker compose -f docker-compose.prod.yml down               # stop everything (keeps volumes)
```