# Session Context — June 17

## Last Action
Rewrote `OrgCheckInPage.tsx` — responsive grid layout, CSS-only scanner frame with animated scan line, 3 breakpoints (900px, 540px). Build passes.

## What's Next (in priority order)
1. **GatewaysPage + RolesPage** — replace "coming soon" with real DB-backed pages (backend endpoints + frontend)
2. **Wire remaining sidebar items** — Email Logs, Sales Reports, Event Performance, User Analytics, Activity Logs, Backup & Restore (either add backend or remove from nav)
3. **Full-stack integration test** — Vite dev + Express server running, verify end-to-end flows

## Key Commands
```bash
# dev
npm run dev          # Vite frontend on :5173
node server/src/index.js  # Express API on :4000
npx tsc --noEmit     # TypeScript check
npx vite build       # production build
```

## Default Admin
- username: `admin`, password: `Admin@2026`, admin code: `111111`

## Architecture
- Frontend: React 18 + Vite + TypeScript, `/api` proxied to `localhost:4000`
- Backend: Express (plain JS), PostgreSQL via `pg`, socket.io for chat
- Auth: JWT in localStorage, 3-field admin login (username + admin_code + password)
- DB: `server/src/db/schema.sql` — full schema with settings, payment_methods, hero_slides, conversations, messages
