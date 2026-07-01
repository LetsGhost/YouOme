# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```sh
npm run dev     # ts-node-dev --respawn --transpile-only src/server.ts (hot reload)
npm run build   # tsc -p tsconfig.build.json -> dist/
npm start       # node dist/server.js (run the build output)
npm run lint    # eslint . --ext .ts
```

There is **no test runner configured** (no Jest/Vitest/Mocha, no `test` script, no test files under `src/`). If asked to add or run tests, you're starting from zero — check with the user before introducing a framework.

Swagger UI is only mounted in development: `http://localhost:{PORT}/api-docs` (raw spec at `/api-docs.json`).

## Big-picture architecture

This is a modular monolith built on **filesystem auto-discovery**: controllers, event handlers, and (partially) scheduled jobs are found and wired up at startup rather than imported explicitly in one place. `src/modules/common/` is the shared framework layer and is explicitly excluded from all auto-discovery scans.

### Startup sequence (`src/server.ts` → `src/bootstrap/express.ts`)

1. Connect MongoDB (`bootstrap/database.ts`).
2. `redisService.connect()` — **awaited before controller registration**, since routes get recorded into Redis as they're mounted.
3. Middleware: `cors` → `helmet` → `express.json`/`urlencoded` → rate limiters (`/api/` general, `/api/auth/` stricter; both **skipped entirely when `NODE_ENV=development`**) → `httpLogger`.
4. Swagger UI (dev only) → `GET /health` (reports Redis status, uptime; records a health check).
5. `registerControllers(app)` → `registerEventHandlers()` → `registerScheduledJobs()` → `jobScheduler.startScheduler()`.
6. `errorHandler` mounted last.

`request-context.middleware.ts` (AsyncLocalStorage request-id correlation) exists but is **not mounted anywhere** — treat it as dead code unless you're the one wiring it in.

### Module structure and conventions

Each feature lives under `src/modules/<name>/` with a consistent file-suffix convention: `*.controller.ts`, `*.service.ts`, `*.model.ts` (Typegoose model), `*.entity.ts` (Typegoose class), `*.schema.ts` (Zod DTOs), and an `events/` folder with `*.event.ts` / `*.handler.ts`.

Modules: `auth`, `user`, `group`, `group-member`, `group-invite`, `group-policy`, `friend-invite`, `friend-list`, `expense`, `expense-participant`, `settlement`, `debt-ledger`, `collaboration`, `p2p-expense`, `p2p-thread`, `notification`, `redis`, and a stray `categorie` module (entity only, no controller/service — not wired into routing or the DB).

**Controller auto-registration** (`src/modules/common/registry/controller/registry.controller.ts`): for every module folder with a `controller/` subdirectory, it `require()`s the `*.controller.ts` file, expects the first export to be a singleton instance with a `.router` (convention: `export const xController = new XController();`), and mounts it at `moduleName === "auth" ? "/api/auth" : "/api/${moduleName}s"`. **This pluralization is naive string concatenation, not smart pluralization** — e.g. `redis` → `/api/rediss` (not a typo), `group-member` → `/api/group-members`. Controller class names don't have to match the mount path; check the registry logic or the running Swagger spec if unsure of a route.

**`BaseController`** (`common/base/base.controller.ts`) creates the router and calls the subclass's `routes()` via `setImmediate()` so constructor method-binding finishes first. **`BaseService<T>`** gives generic CRUD (`create`/`findById`/`findOne`/`findAll`/`updateById`/`deleteById`), all accepting an optional Mongoose `ClientSession` for transactions. **`BaseEntity`**/`createModel()` (`base.entity.ts`/`base.model.ts`) standardize `timestamps: true`, `versionKey: false`.

### Event-driven architecture (`src/modules/common/messaging/`)

A **fully in-memory, single-process** pub/sub (`InMemoryMessageBus` / `eventBus`, `Map<eventType, Set<handler>>`) — no external broker, nothing survives a restart. `publish()` runs all matching handlers concurrently via `Promise.all` and logs a warning if a published event type has zero subscribers.

`registerEventHandlers()` auto-discovers every `events/*.handler.ts` file across modules (except `common`) and subscribes the exported handler instance to `handler.getEventType()`.

Prefer this event bus for cross-module fan-out (notifications, mirrored writes). Keep same-module persistence and authorization checks as direct synchronous service calls.

Known event flows (publisher → event → subscriber(s)):

- `auth.register` creates the user synchronously (no event indirection) and publishes `user.created` (consumed only by a no-op logger handler today)
- `group.service` → `group.created` → `group-member` (auto-adds owner), `group-policy` (seeds default policy), `notification` — all three run in parallel
- `group-invite.service` → `groupInvite.created` → `notification`; on accept → `groupInvite.accepted` → `group-member` (adds member)
- `expense.controller`/`expense.service` → `expense.created_with_participants` → `expense-participant` (creates participant rows), `notification`
- `expense-participant` payment lifecycle → `payment_submitted` / `payment_confirmed` / `payment_rejected` → `notification`
- `friend-invite.service` → `friend.invite.created` → `notification`; on accept → `friend.added` → `friend-list`
- `notification.service` → `notification.created` is terminal (no subscribers)
- Several events are published with no current subscriber and are effectively inert today: `groupMember.created`, `groupPolicy.created`, `expense.created`, `collaboration.created`, `debtLedgerEntry.created`, `settlement.created`, `p2pExpense.created`, `p2pThread.created`. Don't assume publishing one of these currently has any side effect.

### Middleware (`src/middleware/`)

- `auth.middleware.ts` — `authenticate()`, the JWT guard (full flow below); also exports `invalidateUserCache(userId)` to bust the Redis-cached user on logout/update.
- `role.middleware.ts` — `authorize(...roles)`, throws `"Forbidden"` if `req.user.role` isn't allowed.
- `group-access.middleware.ts` — validates `groupId`/`id` param as a Mongo ObjectId and annotates `req.groupAccess = { isOwnerOrAdmin, isMember }` (each check is independently try/caught — it annotates, it doesn't hard-block by itself).
- `rate-limit.middleware.ts` — general `/api/` and stricter `/api/auth/` limiters, custom in-memory `Map`-backed store, both **disabled in development**.
- `error.middleware.ts` — global error handler; **always responds 400** with `{ message: err.message }` regardless of the actual failure type (no 401/403/404/500 differentiation) unless a controller has already sent its own response.

### Auth flow and the dev bypass gotcha

JWT: access tokens 15m / refresh tokens 7d (hardcoded expiries in `common/auth/jwt.ts`, not env-driven), signed with `JWT_SECRET`/`JWT_REFRESH_SECRET`. `authenticate()` reads the bearer token, verifies it, then checks a Redis cache (`user:<id>`, 1hr TTL) before falling back to `userService.findById`. A user's role is elevated to `"admin"` if their email is in `SYSTEM_ADMIN_EMAILS`, regardless of what's embedded in the JWT.

**Dev auth bypass** (`src/utils/auth/auth-bypass.utils.ts`) only activates when **both** `NODE_ENV === "development"` **and** `BYPASS_AUTH === "true"`. When active, it applies to *every* authenticated route, not just `GET /api/auth/me`: a valid bearer token is still honored if present; otherwise an `X-Dev-User-Id` header (24-hex-char ObjectId pattern) is used with role `"admin"`; otherwise it falls back to a hardcoded dummy admin user `000000000000000000000000`.

**Gotcha**: the checked-in `backend/.env` has `BYPASS_AUTH=true` but `NODE_ENV=production` — bypass is therefore currently **inactive** in that env file, since both conditions are required. Don't assume bypass is on just because `BYPASS_AUTH=true` is set; check `NODE_ENV` too.

### Config/env

`src/config/env.ts` loads and types env vars; `JWT_SECRET`/`JWT_REFRESH_SECRET`/`MONGO_URI` are asserted non-null but not validated at startup (a missing var becomes `undefined` at runtime, not a boot-time error). `src/config/cors.ts` is wide open (`origin: "*"`) in development and restricted to `ALLOWED_ORIGINS` in production; allows the custom `X-Dev-User-Id` header used by the bypass. See `example.env` for the full variable list (Mongo, Redis, JWT, rate limits, CORS origins).

### Scheduled jobs (`src/modules/common/scheduler/`)

Unlike controllers/events, jobs are **not filesystem-auto-discovered** — `src/modules/common/scheduler/scheduler-registry.ts` requires a manual side-effect import per job file. Currently only one job is registered: `user/jobs/auto-register.job.ts` (`"0 2 * * *"`, daily), and its `fetchPendingUsers()` is a stub returning `[]` — it's a no-op today, not a bug to "fix" unless asked. The scheduler (`scheduler.ts`) enforces `maxConcurrentJobs` (5) and exponential-backoff retries (up to 3 attempts, `2^attempt * 1000`ms).

## Practical notes

- Keep backend API changes aligned with the frontend client in `frontend/src/shared/api/backend.ts` (separate repo/folder — update both sides together when a contract changes).
- Read the nearest module folder first; prefer changing the owning module over adding cross-cutting logic elsewhere.
- Route mount paths are pluralized from module folder names, not from controller class names — confirm the actual path via the registry logic or the running `/api-docs` spec, not by guessing.
