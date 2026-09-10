# BUILD_STATUS

## Implemented
- Public marketing shell with blueprint palette
- Homepage narrative, four circuits, featured tours, B2B/cruise teasers, journal
- Destination circuit + place pages, tour catalogue, country paths, search, tour detail
- Booking hold (Postgres + optional Upstash) → guest checkout → demo or live payment → voucher
- Enquiry forms (B2C, B2B, cruise, MICE)
- Account: profile, bookings, payments, vouchers, saved, reviews, settings
- Auth: Google, X, email/password, register, forgot/reset password UI
- Admin: dashboard, bookings, enquiries, availability, tours, reviews, users/roles, audit
- SEO titles, canonicals, JSON-LD, sitemap, robots

## Partially implemented
- Live Stripe / Moneroo (adapters + webhooks ready; demo until secrets)
- Redis 15-minute locks (Upstash when configured; otherwise Postgres reserved_seats)
- French locale (nav label only)
- Email/SMS (Resend/Twilio services; no send without keys)

## Requires credentials
- Live Stripe and Moneroo
- Resend / Twilio
- Upstash Redis
- Production DATABASE_URL (injected on deploy)

## Requires verified business content
- Public prices
- Fleet size, certificates, remaining team headshots
- Detailed cruise case studies
