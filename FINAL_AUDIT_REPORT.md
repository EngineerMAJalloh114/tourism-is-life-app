# Final audit

## PRESERVED

- Tourism Is Life branding (palette, Fraunces + Figtree, film grain, navigation, heroes, cards)
- All marketing routes, catalog, journal titles from tourismislife.com
- Guest checkout, 15-minute holds, voucher codes
- Better Auth (Google, X, email/password)
- Admin command centre, enquiry close, review moderate, audit log
- No invented prices, awards, fleet counts, or fake payment charges

## MIGRATED / ADDED

- Blueprint sitemap paths that were query-only or missing (`/tours/sierra-leone`, `/register`, journal nested URLs, account profile, admin users)
- Payment, reservation, notify, and storage **services** that match the blueprint modules
- Verified contact: `+232 80 343 826`, `+232 76 568 335`, `info@tourismislife.com`, State Avenue 232, Freetown
- Banana Island copy from the public tour page (half day, Kent crossing, listed inclusions)

## REFACTORED

- Stripe webhook parser (syntax that blocked the entire route generator)
- Checkout payment step: live providers call `initiatePayment` instead of dead copy
- Leftover `/booking/$slug/confirmed` no longer claims a paid booking

## REMOVED

Nothing product-shaped. Legacy `/booking/$slug/confirmed` kept as a pointer into checkout.

## VERIFIED

See BUILD_STATUS and the browser QA pass. Typecheck, unit tests, and production build are run before sign-off.

## REQUIRES CREDENTIALS

`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `MONEROO_SECRET_KEY`, `MONEROO_WEBHOOK_SECRET`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `RESEND_API_KEY`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `R2_*` / `S3_*`.

## CONTENT REQUIRED

Team roster beyond Kargbo and Bassie, sustainability certificates, cruise case-study bodies, published tariffs.

## REMAINING RISKS

- First signed-in user can bootstrap `SUPER_ADMIN` while `staff_profiles` is empty (preview convenience; lock this in production after the first claim).
- Hold expiry is lazy (next request), not a worker.
- Currency toggle is display-only because there are no public prices.
- Runtime is TanStack Start, not Next.js — documented in `MIGRATION_PLAN.md`.
