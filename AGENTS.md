# AGENTS.md

## Cursor Cloud specific instructions

### Deploy (production)

- **student.umunsi.com** — Vercel from this repo’s `main` (auto on push).
- **studentapi.umunsi.com** — VPS pull + `restart-production-api.sh` (see backend `DEPLOY.md`). UI also at `https://studentapi.umunsi.com/app/` from backend `student-web` build.
- **Inyandiko (commitment / school reports / quiz marks):** Teacher dashboard tab **✍️ Inyandiko** + class **Leaderboard → Inyandiko**. Requires backend routes on VPS (`GET /api/classes/inyandiko/dashboard`). If production shows “not on the server yet”, deploy the API — use Hostinger **Browser SSH** (fingerprint `SHA256:jYsWizDft9Sm+…`) and run the backend `hostinger-terminal-deploy.sh` one-liner.
- **Class Moments UI** — `src/components/classMoments/*` + `ClassMoments.css` (`cm-soc-*` Facebook/WhatsApp hybrid feed).

### Quiz share & guests

- Teacher class **Quizzes** tab → **Share w/ teacher** (colleague modal) or **Share** (public guest link).
- Teacher class **Notes** tab → **Share w/ teacher** — same accept flow as quizzes; inbox on staff **Classes** tab.
- **Leaderboard (students):** see #1 student hero + own marks only; teachers see full class list.

### Quiz share & guests (guest links)
- Public landing: `/quiz/share/:token` (`QuizShareLanding`) — guest form or links to `/register?role=…&quiz_share=…`.
- Guest dashboard: `/guest/dashboard` — home, classes unlocked via share links; **Donate** same as student (`DonateButton` + mobile FAB).
- Guest class view: `/guest/classes/:classId` — read-only Announcements, Notes, Homework; Quizzes (take, no leaderboard).
- Guest profile: `/guest/profile` — avatar, phone, quiz stats, donate banner (not full student profile).
- Guests are not on class roster, leaderboard, discussions, or classmates.

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
- Teachers and head teachers sign up without a school code; they link a school from the dashboard (`SchoolRequestBanner`). Optional school code at signup still supported.

### Key API patterns

- Auth: `Authorization: Bearer <jwt>` header on all authenticated requests.
- API client: `src/api.js` — single fetch-based module, no axios/React Query.
- No controllers/models layer — all business logic is in route handler files under `routes/`.

### Parent invites (UI)

- Teachers: dashboard **Parent invites (per student)** → picker modal → choose student → copy/share link.
- Also: class **Students** tab → **Parent invite** under each student.
- Students: **Parent invitation** modal shows unique **parent code** + link (`utils/parentInviteApi.js` tries GET then POST). Parent signup: `/invite?parent_token=...` (same form as staff invites).

### Composition status (C. Status)

- Student dashboard: **Add C. Status** only (no composer on dashboard). No approved composition → Profile (`?compose=composition`). Pick approved share → 7-day status with view list for owner.
- Teachers: class tab **C. Status**; **Tools** tab → school-wide list when linked to a school. HT **School** tab also lists school statuses.
- Components: `CompositionStatusPanel.jsx`, `CompositionStatusList.jsx`.

### Staff / parent communication hub

- **Teachers only** see **Join a school** (`SchoolRequestBanner`); HT approves in **School** tab.
- Teacher dashboard tabs: **Classes | Chats | Tools** (no **School** tab). **Head teacher** adds **School** tab.
- WhatsApp-style shell: `app-wa-shell` in `App.jsx`, `MobileDashboard.css`, `styles/WaAppShell.css`.
- Parents: `/parent/dashboard` — Chats, feed, school (pinned announcements), child summary with **Today / week / term** filters.
- Notify parents: in-app + optional email (`also_email` when SMTP configured). School announcements support **pin**.

### Email signup (UI)

- Staff register with a **school email username** (shown as `user@schooldomain.edu`) and log in with that address only.
- Students use Gmail or school email on the register form; backend validates on submit.
- CLI: `npm run check-email -- user@gmail.com` in the backend repo.

### Parent hub & school communication

- Parent UI: `ParentHub` at `/parent/dashboard` (tabs: Chats, Classroom feed, School, My child). Legacy feed-only UI remains at `/parent/legacy`.
- Parent API hub: `GET /api/parent/hub`, `GET /api/parent/children/:id/summary`, notifications under `/api/parent/notifications`.
- Staff: `SchoolHubPanel` on teacher/HT dashboards; `POST /api/parent/notify` and `POST /api/parent/school/announcements` deliver **in-app** notifications + chat messages (not external email).
- HT-only: `POST /api/parent/school/teachers`, `PUT /api/parent/school/profile` (district/sector).
- Parent ↔ teacher/HT messaging rules live in `lib/messagingAccess.js`.
- Hub tables/columns are ensured at startup via `lib/parentHub.js` (`school_announcements`, `parent_notifications`, `schools.district`, `schools.sector`).
- Join school / add pupils: frontend calls `/api/admin/*` (`SchoolRequestBanner`, `SchoolRequestsPanel`, `AddStudentsModal`).
- Password reset: `ForgotPassword` uses 6-digit OTP (`/auth/forgot-password` + `/auth/reset-password`); set backend `EXPOSE_RESET_CODE=true` in dev to show code in UI.
