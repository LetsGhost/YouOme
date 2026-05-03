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