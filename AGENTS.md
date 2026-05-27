# AGENTS.md

## Cursor Cloud specific instructions

### Architecture

This workspace contains two independent repos:
- **Backend** (`/agent/repos/Teacher-s-App-backend`) — Node.js/Express 5 + PostgreSQL API. Runs on port 5000.
- **Frontend** (`/agent/repos/Teacher-s-App-frontent`) — Vite + React 18 SPA. Runs on port 3000.

### Running the apps

- **Backend**: `npm run dev` (nodemon) in the backend repo. Requires PostgreSQL running and a `.env` with `DATABASE_URL`, `JWT_SECRET`, `PORT=5000`.
- **Frontend**: `npm run dev -- --host` in the frontend repo. The `.env` has `VITE_API_URL=http://localhost:5000/api`.
- **Build check**: `npm run build` in the frontend repo (Vite build).

### Database setup gotchas

- The base `schema.sql` (via `npm run init-db`) does NOT create all columns used by routes. Columns like `users.phone` and `schools.email_domain`/`schools.welcome_message` are added at runtime by route files or must be manually ALTERed. If you hit column-not-found errors on registration, run:
  ```sql
  ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
  ALTER TABLE schools ADD COLUMN IF NOT EXISTS email_domain TEXT;
  ALTER TABLE schools ADD COLUMN IF NOT EXISTS welcome_message TEXT;
  ```
- Many tables are created via `CREATE TABLE IF NOT EXISTS` at server startup in individual route files (not in `schema.sql`).

### Testing notes

- There is **no automated test suite** — `npm test` exits with error. Validation is done via manual API calls and UI testing.
- JWT tokens contain only `{id, role}`, not `school_id`. The `resolveSchoolForAccount` function in `routes/admin.js` looks up `school_id` from the database when not present in the JWT.
- To test teacher features, register a head_teacher with a school code first, then log in.

### Key API patterns

- Auth: `Authorization: Bearer <jwt>` header on all authenticated requests.
- API client: `src/api.js` — single fetch-based module, no axios/React Query.
- No controllers/models layer — all business logic is in route handler files under `routes/`.
