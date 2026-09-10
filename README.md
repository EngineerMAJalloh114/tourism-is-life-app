# Tourism Is Life — Independent Local App

A full-stack tourism / DMC (Destination Management Company) web application for West Africa tours, cruises, and B2B services. Built with **TanStack Start**, **React 19**, **Vite 8**, **Tailwind CSS 4**, **Better Auth**, and **PGLite** (or Neon Postgres).

This package is prepared to run **independently** on Windows, macOS, or Linux using VS Code, Cursor, Claude Code, Grok, or any standard Node.js environment. No Grok sandbox, no special runtime required.

## Prerequisites

- **Node.js 20+** (LTS recommended) — https://nodejs.org
- **npm** (comes with Node)
- Optional: Git, VS Code / Cursor

## Quick start (Windows / macOS / Linux)

```bash
# 1. Install dependencies
npm install

# 2. Start the development server (http://localhost:8080)
npm run dev
```

Open **http://localhost:8080** in your browser.

The app uses an embedded **PGLite** database by default (no external Postgres needed). Schema migrations run automatically on first start.

### Common scripts

| Command              | Description                                      |
|----------------------|--------------------------------------------------|
| `npm run dev`        | Dev server with HMR on port 8080                 |
| `npm run build`      | Production build + DB migrate                    |
| `npm run preview`    | Serve the production build                       |
| `npm run typecheck`  | TypeScript check                                 |
| `npm run test`       | Unit tests                                       |
| `npm run lint`       | ESLint                                           |
| `npm run format`     | Prettier                                         |

## Environment variables (optional)

Create a `.env` (or `.env.local`) file in the project root if you want to override defaults:

```env
# Use a real Postgres / Neon database instead of embedded PGLite
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Auth providers (Better Auth)
# GOOGLE_CLIENT_ID=...
# GOOGLE_CLIENT_SECRET=...
# etc.

# Payment / email / Redis (optional – demo mode works without them)
# STRIPE_SECRET_KEY=...
# RESEND_API_KEY=...
# UPSTASH_REDIS_REST_URL=...
# UPSTASH_REDIS_REST_TOKEN=...
```

Without any secrets the app runs in **demo mode** (PGLite, mock payments, local auth).

The file `.grok/app-env.json` can also supply `VITE_*` build flags; a real process environment always wins.

## Project structure

```
├── src/
│   ├── components/     # UI components
│   ├── lib/            # db, auth, utilities
│   ├── routes/         # File-based TanStack Router routes
│   ├── services/       # payments, reservations, notify, storage
│   └── styles.css
├── migrations/         # SQL migrations (auto-applied)
├── scripts/            # build helpers (cross-platform Node)
├── public/             # static assets
├── server/             # server entry points
├── .grok/              # optional AI agent skills & references
│   └── skills/         # useful when coding with Claude / Cursor / Grok
└── package.json
```

## Windows-specific notes

- All scripts use pure Node.js — no Bash required.
- `npm run dev` works in PowerShell, Command Prompt, and Windows Terminal.
- If you ever see “vite is not recognized”, ensure you ran `npm install` and are using `npm run …` (not calling `vite` directly outside the npm PATH).
- Port 8080 must be free. Change it in `package.json` if needed:

  ```json
  "dev": "node scripts/with-app-env.mjs vite dev --host 0.0.0.0 --port 3000"
  ```

## VS Code / Cursor / Claude / Grok

1. Open the folder in VS Code or Cursor.
2. Install the recommended extensions if prompted (ESLint, Prettier, Tailwind CSS IntelliSense).
3. Run `npm install` in the integrated terminal.
4. Press `F5` or use the npm scripts panel, or simply `npm run dev`.
5. The `.grok/skills/` folder contains high-quality reference material that AI coding agents can read when you ask them to extend the app.

## Database

- **Default**: `@electric-sql/pglite` (Postgres in WASM) — zero configuration, data lives in-memory / browser-compatible storage for the session.
- **Production**: set `DATABASE_URL` to any Postgres connection string (Neon, Supabase, local Docker, etc.). Migrations are applied on `npm run build` / first request.

## Auth

Better Auth is wired for:

- Email + password
- Google
- X (Twitter)

In local demo mode a development user is available when auth is enabled. Configure real OAuth credentials via environment variables for production.

## Features (summary)

- Marketing site (home, destinations, tours, journal, cruise, B2B)
- Tour catalogue + search + detail pages
- Booking hold → guest checkout → payment → voucher
- Account area (profile, bookings, payments, vouchers, reviews)
- Admin command centre
- Enquiry forms
- SEO (titles, canonicals, JSON-LD, sitemap, robots)

See `BUILD_STATUS.md` and `FINAL_AUDIT_REPORT.md` for the full feature matrix.

## License / attribution

Original application content and branding belong to Tourism Is Life.  
This independent packaging is provided so the project can be developed and run outside the original App Builder sandbox.

---

**Happy building!**  
Open an issue or ask your AI assistant if anything does not start cleanly.
