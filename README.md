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

# 2. Start the development server on the local database (http://localhost:8080)
npm run dev:local
```

Open **http://localhost:8080** in your browser.

## Local database rule (read this first)

**Never point local work at the production database.** In this checkout `.env.local`
holds the **production** `DATABASE_URL` (the Neon `production` branch), and Vite copies
every `.env.local` key into the server's environment. A plain `npm run dev` therefore
reads and writes **live data**: every test enquiry, sign-up or migration lands in
production.

| Do | Don't |
|---|---|
| `npm run dev:local` (embedded PGLite, bound to 127.0.0.1) | `npm run dev` while `.env.local` holds the production URL |
| `npm run build:dev` to build | `npm run build` locally: it runs `db:migrate` against whatever `DATABASE_URL` is set |
| `npm test` (never loads `.env.local`) | point a test or script at `DATABASE_URL` from `.env.local` |

`dev:local` runs `scripts/local-db.mjs`, which blanks `DATABASE_URL` and
`DATABASE_URL_UNPOOLED` before Vite starts; a variable already in the environment wins
over `.env.local`, and the app treats a blank URL as unset, so it uses PGLite. Use the
script rather than `DATABASE_URL= npm run dev`: that syntax does not exist in PowerShell
or cmd.exe, and in PowerShell `$env:DATABASE_URL = ""` deletes the variable, which lets
`.env.local` win again.

The lasting fix is a separate Neon **development** branch: put only its URL in
`.env.local` and keep production credentials in Vercel alone. Until that exists, treat
`npm run dev` as connected to production.

The PGLite database is in-memory: it starts empty, migrations run automatically on
start, and everything is lost when the server stops.

### Common scripts

| Command              | Description                                      |
|----------------------|--------------------------------------------------|
| `npm run dev:local`  | Dev server on 127.0.0.1:8080, local PGLite only (use this) |
| `npm run dev`        | Dev server on port 8080 using `.env.local` (see the rule above) |
| `npm run build:dev`  | Build without migrating (use this locally)        |
| `npm run check:assets` | After a build: every `/assets/*` URL the server emits exists |
| `npm run build`      | Production build + DB migrate (Vercel only)      |
| `npm run preview`    | Serve the production build                       |
| `npm run typecheck`  | TypeScript check                                 |
| `npm run test`       | Script + server unit tests (Node 22.6+)          |
| `npm run lint`       | ESLint                                           |
| `npm run format`     | Prettier                                         |

## Environment variables (optional)

Copy `.env.example` to `.env` (or `.env.local`) in the project root to override defaults. Every variable listed there is one the code actually reads; each is commented out because none is required locally. The main groups are:

```env
DATABASE_URL=postgresql://user:pass@host:5432/dbname   # real Postgres / Neon (required in production)
BETTER_AUTH_URL=... BETTER_AUTH_SECRET=...            # Better Auth (email/password sign-in)
STRIPE_SECRET_KEY=... STRIPE_WEBHOOK_SECRET=...       # live card payments
MONEROO_SECRET_KEY=... MONEROO_WEBHOOK_SECRET=...     # live mobile-money payments
RESEND_API_KEY=...  TWILIO_ACCOUNT_SID=...            # email / SMS
CRON_SECRET=...                                       # authorises /api/cron/expire-holds
UPSTASH_REDIS_REST_URL=... UPSTASH_REDIS_REST_TOKEN=...
```

Sign-in is email/password through Better Auth. Social login is switched off in the UI and there is no standalone Google or X OAuth wiring.

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

- **Local**: `@electric-sql/pglite` (Postgres in WASM), used whenever `DATABASE_URL` is blank or unset. Use `npm run dev:local`; see the local database rule above.
- **Production**: `DATABASE_URL` is set in Vercel. Migrations are applied by `npm run build` during the Vercel build.

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
