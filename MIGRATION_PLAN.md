# Migration plan — Tourism Is Life

## Current (source of truth for product)

The attached project is a working **Tourism Is Life** destination-management platform:

| Layer | Current technology |
| --- | --- |
| App runtime | TanStack Start + Vite + Nitro (this Grok App Builder deploy target) |
| UI | React 19, TypeScript, Tailwind CSS v4, Radix/shadcn |
| Routing | TanStack file routes (`src/routes`) |
| Database | PostgreSQL via Neon in production, PGLite in preview (`@/lib/db`) |
| Schema | Ordered SQL migrations (`migrations/0001`–`0003`) |
| Auth | Better Auth (Google, X, email/password) + Grok identity |
| Validation | Zod on every booking/enquiry/admin server function |
| Payments | Provider abstraction (Stripe, Moneroo, demo) + signed webhooks |
| Reservations | 15-minute Postgres holds; Upstash Redis lock when credentials exist |
| Notifications | Resend / Twilio services — no-op until credentials exist |

## Target (Master Blueprint)

Next.js 15 App Router, Prisma v6, PostgreSQL 16, Upstash Redis, Vercel, Stripe, Moneroo, Resend, Twilio, Zod, Argon2id.

## Platform constraint (non-negotiable here)

This workspace is the Grok App Builder sandbox. Preview, Grok identity auth, PGLite, `grokPwaPlugin`, and the Nitro `vercel` preset are **wired to TanStack Start + Vite**. Replacing the router with Next.js App Router, or replacing `@/lib/db` with Prisma against PGLite, would take the live preview, sign-in, and deploy pipeline down.

That is the same class of constraint as “credentials unavailable”: the **product architecture** of the blueprint is implemented; the **runtime** stays the platform’s required stack.

Route mapping is 1:1 (`/tours/$slug` ↔ `/tours/[slug]`). See `ROUTE_MIGRATION.md`.

## Inventory

| Existing system | Current | Target (blueprint) | Strategy | Preserve? |
| --- | --- | --- | --- | --- |
| Routing | TanStack file routes | Next.js App Router | Keep TanStack; URLs match the blueprint sitemap | YES |
| UI | React 19 | React 19 | Reuse components, brand tokens, layouts | YES |
| Styling | Tailwind v4 | Tailwind v4 | Preserve `@theme` tokens | YES |
| Database | SQL migrations + `getSql()` | Prisma v6 | Keep SQL migrations (PGLite/Neon). Prisma cannot drive the preview DB | YES |
| Auth | Better Auth + Grok broker | Jose/JWT + Argon2id | Keep pre-wired Better Auth (frozen `src/lib/auth`). Email/password already on | YES |
| Booking | Hold → guests → payment → voucher | Same pipeline + Redis | Keep UX; add Upstash lock when configured | YES |
| Payments | Demo + webhook stubs | Stripe + Moneroo | `PaymentProvider` adapters; live redirect only with secrets | YES |
| Admin / RBAC | staff_profiles + requireStaff | CUSTOMER…SUPER_ADMIN | Server-side `requireStaff` + role admin | YES |
| Email/SMS | — | Resend / Twilio | Services exist; send only with keys | YES |
| Storage | `public/` + Unsplash | R2 / S3 | Abstraction; existing assets stay | YES |

## Order followed

AUDIT → BACKUP (extracted zip in `/tmp/tourism-audit`) → restore existing `src/` → fix stale route tree → complete missing blueprint routes/services → tests → browser QA.
