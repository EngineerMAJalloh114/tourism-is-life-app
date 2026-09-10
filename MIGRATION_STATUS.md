# Migration status

## Restored

The empty scaffold was replaced with the existing Tourism Is Life source (routes, catalog, booking engine, admin, auth, brand tokens). Nothing product-shaped was rebuilt from a template.

## Completed this pass

- Regenerated the TanStack route tree (it was stale because `/api/webhooks/stripe` mixed `??` and `&&`). Checkout, destination slugs, admin children, and journal categories now actually route.
- Country tour URLs `/tours/sierra-leone|guinea|liberia|west-africa`
- `/register`, `/forgot-password`, `/reset-password`, `/account/profile`
- Nested journal `/journal/$category/$slug`
- Admin users/roles (`ADMIN`+), tours link in ops nav
- Payment provider classes (Stripe / Moneroo / demo) + live redirect when secrets exist
- Upstash reservation lock (15 minutes) on top of Postgres capacity
- Resend / Twilio notification services (no fake sends)
- R2/S3 storage abstraction
- Banana Island itinerary/inclusions taken from tourismislife.com
- Contact numbers/address from the public contact page
- Why Us in About nav; payments + profile in account nav

## Not switched (platform)

- Next.js App Router — would break this sandbox’s Vite/Nitro preview and Grok auth
- Prisma v6 — PGLite preview has no Prisma adapter; schema remains SQL migrations
- Argon2id in-app hashing — Better Auth owns password hashes (do not rewrite `src/lib/auth`)
- `.env` files — forbidden here; platform injects `DATABASE_URL` on deploy

## Requires credentials

Stripe, Moneroo, Upstash Redis, Resend, Twilio, R2/S3. Without them: demo settlement, Postgres-only holds, no outbound mail/SMS.

## Content still required from the business

Public prices, fleet size, certificates, remaining team, detailed cruise case studies.
