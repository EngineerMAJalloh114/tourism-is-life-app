# Deployment notes: team admin

Environment variable **names** the admin relies on, and the one-time setup for photo
uploads. Values are never written here or committed; they live in Vercel.

## Variables

| Name | Scope | Needed for |
|---|---|---|
| `DATABASE_URL` | Production only (never Preview) | the live database |
| `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET` | Production, Preview | team sign-in; `BETTER_AUTH_URL` is also the start of every emailed password link |
| `RESEND_API_KEY`, `RESEND_FROM` | Production | password reset and team invitations (Milestone A does not merge without them) |
| `BOOTSTRAP_ADMIN_EMAIL` | Production, only while the owner makes the single SUPER_ADMIN claim | first-time setup (owner item O2) |
| `SUPABASE_URL` | Production (and Preview with test buckets) | photo uploads |
| `SUPABASE_SERVICE_KEY` | Production (and Preview with test buckets) | photo uploads; the project's **secret** key, server only |
| `SUPABASE_PUBLIC_BUCKET` | as above | bucket for processed photos visitors load |
| `SUPABASE_INCOMING_BUCKET` | as above | bucket for raw uploads, never served |
| `LOCAL_SUPER_ADMIN_EMAIL`, `LOCAL_SUPER_ADMIN_PASSWORD` | `.env.local` only, never Vercel | the local test account for `npm run dev:local` |

None of the `SUPABASE_*` names may ever start with `VITE_`: Vite would copy the value into
the browser bundle. A test and `npm run check:assets` both fail if that happens.

Uploads switch on only when all four `SUPABASE_*` variables are set. With some set, the
media page says which are missing; with none, it says uploads are off. The photos that
ship with the site are listed either way.

## Supabase Storage setup (once)

1. Create two buckets in the Supabase project:
   - the incoming bucket: **private**, file size limit 15 MB, allowed types
     `image/jpeg, image/png, image/webp`;
   - the public bucket: **public**.
2. Copy the project URL and a **secret** key (`sb_secret_...`) from the project's API keys
   page into Vercel as `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`, and the two bucket names
   into `SUPABASE_PUBLIC_BUCKET` and `SUPABASE_INCOMING_BUCKET`.
3. Redeploy. On the first upload, check the media page shows the photo and its copies.

The browser sends a photo straight to a signed upload URL for one object in the incoming
bucket; the server reads it back, checks and cleans it, writes the copies to the public
bucket, and deletes the original. The secret key never leaves the server.

**Free-plan pausing can take uploaded photos offline.** Supabase pauses a Free Plan project
after low database activity over 7 days ([Project Pausing](https://supabase.com/docs/guides/platform/free-project-pausing)),
and a paused project answers with status 540 until the owner restores it
([HTTP status codes](https://supabase.com/docs/guides/troubleshooting/http-status-codes)).
This site's database is on Neon, so the Supabase project would see almost no database
activity of its own. Put it on a paid plan before the first real upload (owner item O5).
Photos in `public/images` are served by Vercel and are not affected.
