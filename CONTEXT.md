# Session Context — July 13

## Last Action
Implemented role-specific auth system: admin login via Supabase Auth, separate login/registration forms for each role, removed admin code flow, cleaned up socket.io.

## Deployed & Live
- **Frontend**: https://sunshinetickets.vercel.app (Vercel)
- **Backend**: Serverless API via `api/index.js` on Vercel
- **Database**: Supabase PostgreSQL (`ctxchjdlhxwucslhrior`, eu-west-1)
- **Storage**: Supabase Storage bucket `uploads` (public read/write)
- **Realtime**: Supabase Realtime on `messages` + `conversations` tables
- **GitHub**: https://github.com/DominicOigo/sunshine-tickets (auto-deploys to Vercel)

## Architecture
- Frontend: React 18 + Vite + TypeScript, served by Vercel
- Backend: Express (plain JS) running as Vercel serverless function in `api/index.js`
- Server code lives in `server/src/` but is imported by `api/index.js` via relative paths
- Auth: Three separate login flows:
  - **Admin**: Supabase Auth (email + password), no registration. Managed via Supabase dashboard.
  - **Organizer**: Custom JWT auth via `/api/auth/signin`. Registration at `/organizer/auth` (requires admin approval).
  - **Customer**: Custom JWT auth via `/api/auth/signin`. Registration via AuthModal (auto-login).
- Chat: Supabase Realtime (replaced socket.io)
- Uploads: Supabase Storage (replaced multer disk)

## What's Next (in priority order)
1. **Seed admin in Supabase Auth** — create admin user in Supabase Auth dashboard (email + password) so the `/admin/login` page works
2. **Test organizer approval flow** — register organizer → admin approves → organizer can sign in
3. **Wire remaining sidebar items** — Email Logs, Sales Reports, Event Performance, User Analytics, Activity Logs, Backup & Restore (backend endpoints needed)
4. **Seed data alignment** — ensure hero_slides, categories, settings seed data is correct in Supabase

## Key Commands
```bash
npm run dev                    # Vite frontend on :5173
node server/src/index.js       # Express API on :4000 (local dev only)
npx tsc --noEmit               # TypeScript check
npx vite build                 # production build
vercel --prod                  # manual deploy
```

## Auth Flow Summary
```
/admin/login → supabase.auth.signInWithPassword → POST /api/auth/admin-signin → our JWT
/organizer/auth → POST /api/auth/signup (role=organizer) → pending approval
/organizer/auth → POST /api/auth/signin (username+password) → our JWT
AuthModal (customer) → POST /api/auth/signup (role=customer) → auto-login
AuthModal (customer) → POST /api/auth/signin (username+password) → our JWT
```

## DB Schema Key Tables
- `users`: id, username, email, password (bcrypt), full_name, role (customer|organizer|admin), admin_code, is_suspended
- `organizer_profiles`: user_id (FK), business_name, payout_phone, is_verified
- `buyer_profiles`: user_id (FK), phone, avatar_url
- `events`, `ticket_tiers`, `orders`, `payments`, `payouts`, `refunds`
- `conversations`, `messages` (realtime)
- `hero_slides`, `categories`, `settings`, `notifications`, `team_members`

## Default Credentials
- **Admin**: Login via Supabase Auth dashboard (email + password you set there)
- **Supabase project**: ref `ctxchjdlhxwucslhrior`, region eu-west-1
