/**
 * Self-hosted Better Auth for THIS app (server-only).
 *
 * Pre-wired for live preview + deploy — do not rewrite this file. To enable
 * local email/password, flip the flag in `./email-password` only (see auth skill).
 *
 * The app runs its own Better Auth at `/api/auth/*`, so the session cookie stays
 * on this app's own origin. Sign-in federates to the shared **Grok auth broker**
 * (`GROK_AUTH_ISSUER`) via the `genericOAuth` plugin — the broker brokers the
 * upstream sign-in methods (Google, X, …) and holds their shared secrets; this
 * app only holds its own client id/secret and names the upstream it wants via
 * each provider's `idp` hint.
 *
 * Tri-mode:
 *   - Deployed: the deployer injects a per-app `GROK_AUTH_*` + `BETTER_AUTH_URL`
 *     + `DATABASE_URL`, so real federated auth is persisted in Postgres.
 *   - Sandbox live preview: no injection -> falls back to the shared **preview
 *     client** (`./preview`) and derives the preview's `https://*.grok-sandbox.com`
 *     origin from the request, so real sign-in works (no demo users). Sessions
 *     and identities persist in the embedded PGLite DB (same DB as app data);
 *     the process restart wipes both. Live-preview iframe clients use a bearer
 *     token (partitioned cookies) — see `client.ts`.
 *   - Off (`VITE_AUTH_ENABLED=false`, the shipped default): no providers;
 *     `requireUserId` resolves a dev user with no database configured, and
 *     throws fail-closed once `DATABASE_URL` is set (see `verify.server.ts`).
 *
 * NEVER import this from client code — it pulls in `pg` + the preview secret +
 * server-only Better Auth internals. The client uses `@/lib/auth/client`;
 * components read the user via `@/lib/auth/use-current-user`; server functions get
 * a verified id via `@/lib/auth/middleware`.
 */
import { betterAuth } from "better-auth";
import { bearer, genericOAuth } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { getCookie } from "@tanstack/react-start/server";
import { randomBytes } from "node:crypto";
import { Pool } from "pg";
import { isWorkspacePreview, vercelEnv } from "../env.server";
import { dbSource, ensureDbReady, getPglite, getSql } from "../db";
import { log } from "../server/logger";
import { bootstrapEmailAllowed } from "../server/config";
import { sendEmail } from "../../services/notify";
import { emailAndPasswordEnabled } from "./email-password";
import { localSeedDecision, seedLocalSuperAdmin } from "./local-seed";
import { GROK_PROVIDERS } from "./providers";
import { teamAuthOptions } from "./team-auth";
import { pgliteDialect } from "./pglite-dialect";
import {
  GROK_ISSUER_DEFAULT,
  PREVIEW_ALLOWED_HOSTS,
  PREVIEW_CLIENT_ID,
  PREVIEW_CLIENT_SECRET,
} from "./preview";

// Kick (and share) PGLite bootstrap as soon as the auth server module loads.
void ensureDbReady();

/**
 * Preview secret must outlive module reloads: PGLite (and its session rows) is
 * stored on `globalThis`, so an HMR re-eval of this file must NOT mint a new
 * signing secret or every existing session becomes invalid mid-dev. Process
 * restart clears both the secret and PGLite together.
 */
const globalAuthRef = globalThis as typeof globalThis & {
  __grokAuthPreviewSecret__?: string;
};
function previewAuthSecret(): string {
  globalAuthRef.__grokAuthPreviewSecret__ ??= randomBytes(32).toString("hex");
  return globalAuthRef.__grokAuthPreviewSecret__;
}

/** Read an env var, treating empty/whitespace as unset. */
const env = (key: string): string | undefined => {
  const value = process.env[key]?.trim();
  return value ? value : undefined;
};

// Explicit off-switch. The deployer sets `VITE_AUTH_ENABLED=true` when it
// provisions auth; set it to "false" to force auth off everywhere (dev user).
const authDisabled = env("VITE_AUTH_ENABLED") === "false";

// Broker federation creds: the deployer injects a per-app client when deployed;
// otherwise fall back to the shared live-preview client, which the broker accepts
// for any `*.grok-sandbox.com` callback (see `./preview`).
const grokIssuer = env("GROK_AUTH_ISSUER") ?? GROK_ISSUER_DEFAULT;
const grokClientId = env("GROK_AUTH_CLIENT_ID") ?? PREVIEW_CLIENT_ID;
const grokClientSecret = env("GROK_AUTH_CLIENT_SECRET") ?? PREVIEW_CLIENT_SECRET;

/** True when federated sign-in is active (real auth is enforced). */
export const authConfigured =
  !authDisabled && Boolean(grokClientId && grokClientSecret);

/**
 * Whether the Grok-broker OAuth plugin should actually be registered. The
 * baked preview client (`./preview`) is a legitimate auth mechanism ONLY in
 * the sandbox live preview — the broker accepts its callback exclusively on
 * `*.grok-sandbox.com`. On a real deployment (Vercel, Grok deploy, …) it must
 * never be the production authentication mechanism, so the plugin stays off
 * there unless the deployer has injected a real per-app broker client via
 * `GROK_AUTH_CLIENT_ID` / `GROK_AUTH_CLIENT_SECRET`.
 */
const grokOAuthActive =
  !authDisabled &&
  (isWorkspacePreview() ||
    Boolean(env("GROK_AUTH_CLIENT_ID") && env("GROK_AUTH_CLIENT_SECRET")));

// One-time, secret-free diagnostic of the runtime-classification inputs —
// exists to make this observable in `vercel logs` after a deploy, since a
// wrong classification here silently re-exposes the broker OAuth plugin /
// demo payments in production (see `isWorkspacePreview` for the incident
// this documents). No values here are sensitive: presence booleans and
// VERCEL_ENV's own three-value enum.
log.info("auth.runtime_classification", {
  grokProjectIdPresent: Boolean(env("GROK_PROJECT_ID")),
  vercelEnv: vercelEnv() ?? null,
  betterAuthUrlPresent: Boolean(env("BETTER_AUTH_URL")),
  isWorkspacePreview: isWorkspacePreview(),
  grokOAuthActive,
});

// This app's own Better Auth origin. When deployed the deployer injects the
// public URL. In the sandbox live preview there's no fixed URL (each preview gets
// a dynamic `*.grok-sandbox.com` host), so we hand Better Auth a dynamic baseURL:
// it derives the origin per-request from the (proxied) host, validated against the
// preview allowlist, which makes the OAuth `redirect_uri` the concrete preview URL
// the broker's preview client accepts.
const explicitBaseURL = env("BETTER_AUTH_URL");
if (!isWorkspacePreview() && !explicitBaseURL) {
  throw new Error(
    "BETTER_AUTH_URL is required on a real deployment — refusing the " +
      "*.grok-sandbox.com/localhost dynamic baseURL fallback (which would " +
      "reject the real origin and misdirect OAuth redirect_uri) in production.",
  );
}
// Explicit `string[]` (not a readonly tuple) — Better Auth's DynamicBaseURLConfig
// requires a mutable `allowedHosts: string[]`.
const previewAllowedHosts: string[] = [...PREVIEW_ALLOWED_HOSTS];
// Local `npm run dev` (port 8080 contract). Browsers may send Origin as any of
// these for the same server — trusting only `localhost` rejects `127.0.0.1` and
// breaks email/password with "Invalid origin".
const LOCAL_DEV_ORIGINS: string[] = [
  "http://localhost:8080",
  "http://127.0.0.1:8080",
  "http://[::1]:8080",
];
const baseURL = explicitBaseURL ?? {
  // Include loopback hosts so dynamic baseURL resolves for local email/password
  // (not only the preview wildcard).
  allowedHosts: [...previewAllowedHosts, "localhost", "127.0.0.1", "[::1]"],
  // `auto` → trust both http:// and https:// expansions of allowedHosts
  // (preview is https; local dev is http).
  protocol: "auto" as const,
  fallback: "http://localhost:8080",
};

// Origins Better Auth accepts on credentialed POSTs (sign-up/sign-in, etc.).
// Missing entries here surface as FORBIDDEN "Invalid origin".
const trustedOrigins: string[] = explicitBaseURL
  ? [explicitBaseURL, ...LOCAL_DEV_ORIGINS]
  : [
      // Host wildcards (matched against Origin's host)
      ...previewAllowedHosts,
      // Full-origin wildcards (matched against Origin)
      ...previewAllowedHosts.flatMap((host) => [`https://${host}`, `http://${host}`]),
      ...LOCAL_DEV_ORIGINS,
    ];

const databaseUrl = env("DATABASE_URL");

// Static broker OAuth endpoints (skip OIDC discovery on every sign-in / callback).
// Discovery would cost an extra network hop to the broker before the popup can
// even redirect to Google/X — the live-preview popup felt stuck on the app for
// that whole round-trip. These paths match the broker's discovery document.
const issuerBase = grokIssuer.replace(/\/+$/, "");
const grokAuthorizationUrl = `${issuerBase}/api/auth/oauth2/authorize`;
const grokTokenUrl = `${issuerBase}/api/auth/oauth2/token`;
const grokUserInfoUrl = `${issuerBase}/api/auth/oauth2/userinfo`;

// Real Postgres when `DATABASE_URL` is set (deployed apps), else the app's
// embedded PGLite (preview) via a Kysely dialect — so Better Auth persists to the
// SAME DB as app data, including email/password users. Both use the Better Auth
// schema from `migrations/auth/0001_auth.sql`, copied into `migrations/` when
// the app turns sign-in on.
const database = databaseUrl
  ? new Pool({ connectionString: databaseUrl })
  : { dialect: pgliteDialect(() => getPglite()), type: "postgres" as const };

/** Session token cookie name — also read by the live-preview popup completion page. */
export const SESSION_TOKEN_COOKIE = "__Host-grok-auth.session_token";

// Built separately so the `betterAuth({...})` call stays easy to edit without
// breaking brackets (models often trip on the conditional plugin spread).
const grokOAuthPlugin = authConfigured && grokOAuthActive
  ? genericOAuth({
      config: GROK_PROVIDERS.map(({ providerId, idp }) => ({
        providerId,
        clientId: grokClientId as string,
        clientSecret: grokClientSecret as string,
        // Prefer static endpoints over `discoveryUrl` so initiating (and
        // completing) OAuth does not wait on a broker discovery fetch.
        authorizationUrl: grokAuthorizationUrl,
        tokenUrl: grokTokenUrl,
        userInfoUrl: grokUserInfoUrl,
        scopes: ["openid", "profile", "email"],
        // `prompt: "login"` forces the broker to re-authenticate against the
        // upstream on every sign-in instead of silently reusing an existing
        // broker session. Combined with the broker sending Google
        // `prompt=select_account`, the user always gets the account chooser
        // and can pick (or switch) which account to sign in with.
        authorizationUrlParams: { idp, prompt: "login" },
      })),
    })
  : null;

/**
 * Session-signing secret. A real deployment MUST supply `BETTER_AUTH_SECRET`
 * — refusing (rather than silently minting an ephemeral per-process secret)
 * is deliberate: an unstable secret signs sessions that a different
 * serverless instance, or the same instance after a cold start, would then
 * reject, which fails as confusing "random" sign-outs instead of a clear
 * startup error.
 */
function resolveAuthSecret(): string {
  const explicit = env("BETTER_AUTH_SECRET");
  if (explicit) return explicit;
  if (!isWorkspacePreview()) {
    throw new Error(
      "BETTER_AUTH_SECRET is required on a real deployment — refusing to " +
        "sign sessions with an ephemeral per-process secret.",
    );
  }
  return previewAuthSecret();
}

const authSecret = resolveAuthSecret();

/**
 * Team sign-in rules (task A3): sign-up closed, team accounts only, TOTP
 * two-factor with hashed recovery codes, Postgres rate limits, every attempt
 * logged, 12-hour sessions, working password reset through Resend. See
 * `./team-auth.ts` and docs/CUSTOMIZATION_PLAN.md section 9.
 */
const team = teamAuthOptions({
  getSql,
  sendEmail: (m) => sendEmail(m),
  secret: authSecret,
  bootstrapEmailAllowed,
  // Only on in-memory PGLite (local dev, preview builds with no database): there
  // is no real mailbox to protect, and without Resend the link would be lost.
  onUndeliveredLink:
    dbSource === "pglite" ? (email, url) => log.info("team.link.not_emailed", { email, url }) : undefined,
});

export const auth = betterAuth({
  baseURL,
  // Deployed apps inject BETTER_AUTH_SECRET. Preview: process-stable secret on
  // globalThis so HMR doesn't invalidate PGLite-backed sessions (see above).
  secret: authSecret,
  database,

  // CSRF / origin check for credentialed auth POSTs (email sign-up/sign-in, …).
  // See `trustedOrigins` construction above — must cover live preview hosts AND
  // local loopback variants, or clients get "Invalid origin".
  trustedOrigins,

  // Encrypt broker-issued OAuth tokens at rest, and treat the broker's upstreams
  // as trusted first-party identities. The broker owns identity and X emails are
  // synthetic/unverified, so WITHOUT this a login can fail with
  // `account_not_linked` (Better Auth refuses to attach an untrusted, unverified
  // identity to an existing user). Google and X carry DISTINCT emails, so this
  // never merges them into one user — they stay separate identities.
  account: {
    encryptOAuthTokens: true,
    accountLinking: {
      enabled: true,
      trustedProviders: GROK_PROVIDERS.map((p) => p.providerId),
      // X's synthetic email is never "verified", so don't gate linking on the
      // local user's email-verified state.
      requireLocalEmailVerified: false,
    },
  },

  // 12-hour sessions, never extended. The signed `session_data` cookie cache
  // still serves the public site; every admin check bypasses it
  // (`src/lib/server/actor.server.ts`), so a revoked session stops at once there.
  session: team.session,

  // Team email/password: sign-up closed, reset through Resend (`./team-auth.ts`).
  ...(emailAndPasswordEnabled ? { emailAndPassword: team.emailAndPassword } : {}),

  // Only active team accounts may hold a session (and the owner before the claim).
  databaseHooks: team.databaseHooks,

  // Rate limits, attempt log, one message for failed sign-ins, recovery-code hashing.
  hooks: team.hooks,

  // `__Host-` prefixed cookies: the browser REFUSES any same-named cookie that
  // carries a `Domain` attribute, so a sibling `*.grok.me` app cannot "toss" a
  // `Domain=.grok.me` session cookie onto this app. `__Host-` requires Secure +
  // Path=/ + no Domain; Better Auth otherwise uses `__Secure-` (which permits
  // Domain), so we drop its auto prefix (`useSecureCookies: false`) and set
  // Secure + the names ourselves. (Browsers allow Secure cookies on
  // `http://localhost`, so local dev still works.)
  advanced: {
    useSecureCookies: false,
    defaultCookieAttributes: { secure: true, sameSite: "lax", path: "/" },
    cookies: {
      session_token: { name: SESSION_TOKEN_COOKIE },
      session_data: { name: "__Host-grok-auth.session_data" },
      account_data: { name: "__Host-grok-auth.account_data" },
      dont_remember: { name: "__Host-grok-auth.dont_remember" },
    },
  },

  plugins: [
    // TOTP two-factor for every team account.
    team.twoFactorPlugin,

    // One genericOAuth provider per upstream (when auth is on), all federating
    // to the broker with the SAME client and differing only by the `idp` hint.
    // Registered only in the Grok workspace preview (see `grokOAuthActive`).
    ...(grokOAuthPlugin ? [grokOAuthPlugin] : []),

    // `Authorization: Bearer <session-token>` instead of the cookie, needed only
    // inside the Grok workspace preview iframe (partitioned cookies). Not
    // registered on a real deployment. The always-on Grok gate session plugin
    // that used to sit here was removed in task A3: nothing the business uses
    // depends on it, and it trusted tokens from two fixed Grok issuers.
    ...(isWorkspacePreview() ? [bearer()] : []),

    // Bridges Better Auth's Set-Cookie into TanStack Start responses. MUST be
    // last so it runs after every other plugin's hooks.
    tanstackStartCookies(),
  ],
});

export function readSessionToken(): string | null {
  return getCookie(SESSION_TOKEN_COOKIE) ?? null;
}

// Re-exported for convenience; the array lives in the dependency-free
// `providers.ts` so the client can import it too.
export { GROK_PROVIDERS } from "./providers";

// Local-only test SUPER_ADMIN (`npm run dev:local`, in-memory PGLite). Every
// guard is in `localSeedDecision`; on a real database this only logs why it
// did nothing.
if (dbSource === "pglite") {
  const decision = localSeedDecision(process.env, dbSource);
  if (decision.seed) {
    void (async () => {
      try {
        await ensureDbReady();
        const ctx = await auth.$context;
        await seedLocalSuperAdmin(ctx, await getSql(), decision.email, decision.password);
        log.info("team.local_seed", { email: decision.email });
      } catch (err) {
        log.error("team.local_seed_failed", { message: err instanceof Error ? err.message : String(err) });
      }
    })();
  } else if (process.env.LOCAL_SUPER_ADMIN_EMAIL) {
    log.info("team.local_seed_skipped", { reason: decision.reason });
  }
}
