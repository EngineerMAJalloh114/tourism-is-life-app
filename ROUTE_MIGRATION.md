# Route migration

TanStack `$param` ≡ Next.js `[param]`. All of these resolve in the running app.

| Old / blueprint | Implemented | Migrated | Notes |
| --- | --- | --- | --- |
| `/` | `/` | YES | Homepage narrative |
| `/about` | `/about` | YES | |
| `/about/what-we-offer` | `/about/what-we-offer` | YES | |
| `/about/team` | `/about/team` | YES | Full roster still `[CONTENT REQUIRED]` |
| `/about/sustainability` | `/about/sustainability` | YES | Certs `[CONTENT REQUIRED]` |
| `/about/why-us` | `/about/why-us` | YES | Now in About nav |
| `/destinations` | `/destinations` | YES | |
| `/destinations/$circuit` | `/destinations/$circuit` | YES | |
| `/destinations/$circuit/$slug` | `/destinations/$circuit/$slug` | YES | |
| `/tours` | `/tours` | YES | |
| `/tours/sierra-leone` | `/tours/sierra-leone` | YES | Dedicated path (not only `?country=`) |
| `/tours/guinea` | `/tours/guinea` | YES | |
| `/tours/liberia` | `/tours/liberia` | YES | |
| `/tours/west-africa` | `/tours/west-africa` | YES | |
| `/tours/search` | `/tours/search` | YES | |
| `/tours/$slug` | `/tours/$slug` | YES | |
| `/cruise` + children | `/cruise/*` | YES | Case studies remain `[CONTENT REQUIRED]` |
| `/services` + 7 slugs | `/services/$slug` | YES | |
| `/journal` | `/journal` | YES | |
| `/journal/[category]` | `/journal/category/$category` | YES | Also keep nested article URL |
| `/journal/[category]/[slug]` | `/journal/$category/$slug` | YES | `/journal/$slug` still works |
| `/contact` | `/contact` | YES | |
| `/contact/travel` | `/contact/travel` | YES | |
| `/contact/partner` | `/contact/partner` | YES | |
| `/contact/emergency` | `/contact/emergency` | YES | |
| `/partner` | `/partner` | YES | |
| `/coming-soon` | `/coming-soon` | YES | |
| `/login` | `/login` | YES | |
| `/register` | `/register` | YES | |
| `/forgot-password` | `/forgot-password` | YES | Needs Resend to deliver mail |
| `/reset-password` | `/reset-password` | YES | |
| `/account` | `/account` | YES | |
| `/account/profile` | `/account/profile` | YES | |
| `/account/bookings` | `/account/bookings` | YES | |
| `/account/bookings/$ref` | `/account/bookings/$ref` | YES | |
| `/account/payments` | `/account/payments` | YES | Now in account nav |
| `/account/vouchers` | `/account/vouchers` | YES | |
| `/account/reviews` | `/account/reviews` | YES | |
| `/account/saved` | `/account/saved` | YES | |
| `/account/settings` | `/account/settings` | YES | |
| `/booking/$slug` | `/booking/$slug` | YES | Availability + 15-minute hold |
| `/checkout/$ref/*` | `/checkout/$ref/{guests,review,payment,…}` | YES | Guest checkout |
| `/admin` | `/admin` | YES | Server-side staff gate |
| `/admin/users` | `/admin/users` | YES | ADMIN+ can change roles |
| `/api/auth/*` | `/api/auth/$` | YES | Better Auth |
| `/api/webhooks/stripe` | `/api/webhooks/stripe` | YES | Signature required |
| `/api/webhooks/moneroo` | `/api/webhooks/moneroo` | YES | Signature required |
