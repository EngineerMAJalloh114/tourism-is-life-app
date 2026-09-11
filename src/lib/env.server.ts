export function env(key: string): string | undefined {
  const v = process.env[key]?.trim();
  return v || undefined;
}

/**
 * Vercel's own environment classification for this process — `"production"`,
 * `"preview"`, or `"development"` — read straight from the `VERCEL_ENV`
 * System Environment Variable. `undefined` off Vercel, OR on Vercel with
 * "Automatically expose System Environment Variables" turned off for the
 * project (Project Settings → Environment Variables): that toggle is what
 * silently broke an earlier version of this check (see `isWorkspacePreview`).
 */
export function vercelEnv(): string | undefined {
  return env("VERCEL_ENV");
}

/**
 * Workspace preview / local dev vs a real deployed app.
 *
 * History: this used to key off `GROK_PROJECT_ID` alone (Grok's deploy
 * marker), then briefly also checked the plain `VERCEL` var on the
 * (unverified) assumption Vercel always injects it — confirmed FALSE for
 * this project's Nitro-built function: a live production probe still showed
 * `isWorkspacePreview() === true` (the Grok-broker OAuth plugin was still
 * registered). Root cause: Vercel only injects `VERCEL`/`VERCEL_ENV` into a
 * function's runtime when the project has "Automatically expose System
 * Environment Variables" enabled — not guaranteed for every project/preset.
 *
 * Fix: prefer `VERCEL_ENV === "production"` (the precise, Vercel-native
 * signal the task asked for) when the platform exposes it; when it does not,
 * fall back to a signal THIS APP controls directly and unconditionally:
 * `BETTER_AUTH_URL` is required, by our own deployment process, in the
 * Production environment ONLY (never Preview/Development — see
 * `src/lib/auth/server.ts`), so its mere presence is an equally reliable,
 * zero-extra-configuration "this is the real deployment" marker that does
 * not depend on any Vercel platform toggle.
 *
 * Net effect, fail-closed by construction:
 *   - Grok deploy (`GROK_PROJECT_ID`)            -> NOT preview (deployed)
 *   - Vercel prod, VERCEL_ENV exposed             -> NOT preview (deployed)
 *   - Vercel prod, VERCEL_ENV NOT exposed          -> NOT preview, via BETTER_AUTH_URL
 *   - Vercel preview / development                -> preview (permissive, same as local)
 *   - Local `npm run dev`, nothing configured      -> preview (permissive; local dev keeps working)
 *
 * Single source of truth for the split — gate audience, gate endpoints,
 * connector-token semantics, demo-payment eligibility, cron auth, and the
 * staff-bootstrap gate all key off this predicate.
 */
export function isWorkspacePreview(): boolean {
  if (env("GROK_PROJECT_ID")) return false;
  const ve = vercelEnv();
  if (ve) return ve !== "production";
  return !env("BETTER_AUTH_URL");
}
