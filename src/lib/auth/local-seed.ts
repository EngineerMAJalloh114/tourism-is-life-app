/**
 * Local-only test SUPER_ADMIN for `npm run dev:local` (in-memory PGLite).
 *
 * Reads LOCAL_SUPER_ADMIN_EMAIL and LOCAL_SUPER_ADMIN_PASSWORD from the local
 * `.env.local` (names in `.env.example`). Refuses unless ALL of these hold:
 *   - `scripts/local-db.mjs` started the process (it sets TIL_LOCAL_SEED=1),
 *   - DATABASE_URL and DATABASE_URL_UNPOOLED are both blank,
 *   - the active backend is PGLite.
 * So it can never create an account on a real database. The account still has
 * to enrol two-factor on its first sign-in, like every team account.
 */
import type { Sql } from "@/lib/sql";

export type LocalSeedEnv = Record<string, string | undefined>;

export type LocalSeedDecision =
  | { seed: true; email: string; password: string }
  | { seed: false; reason: string };

export function localSeedDecision(env: LocalSeedEnv, backend: "neon" | "pglite"): LocalSeedDecision {
  const email = env.LOCAL_SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  const password = env.LOCAL_SUPER_ADMIN_PASSWORD ?? "";
  if (!email && !password) return { seed: false, reason: "LOCAL_SUPER_ADMIN_EMAIL and LOCAL_SUPER_ADMIN_PASSWORD are not set" };
  if (env.DATABASE_URL?.trim() || env.DATABASE_URL_UNPOOLED?.trim()) {
    return { seed: false, reason: "a database URL is set; the local seed only runs on in-memory PGLite" };
  }
  if (backend !== "pglite") return { seed: false, reason: "the active database is not PGLite" };
  if (env.TIL_LOCAL_SEED !== "1") return { seed: false, reason: "not started by npm run dev:local" };
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { seed: false, reason: "LOCAL_SUPER_ADMIN_EMAIL is not an email address" };
  if (password.length < 12) return { seed: false, reason: "LOCAL_SUPER_ADMIN_PASSWORD must be at least 12 characters" };
  return { seed: true, email, password };
}

type AuthContextLike = {
  password: { hash: (password: string) => Promise<string> };
  internalAdapter: {
    findUserByEmail: (email: string) => Promise<{ user: { id: string } } | null>;
    createUser: (user: { email: string; name: string; emailVerified: boolean }) => Promise<{ id: string }>;
    createAccount: (account: { userId: string; providerId: string; accountId: string; password: string }) => Promise<unknown>;
  };
};

/** Create (once) the local SUPER_ADMIN and close the bootstrap claim for it. */
export async function seedLocalSuperAdmin(ctx: AuthContextLike, sql: Sql, email: string, password: string): Promise<string> {
  const existing = await ctx.internalAdapter.findUserByEmail(email);
  let userId = existing?.user.id;
  if (!userId) {
    const user = await ctx.internalAdapter.createUser({ email, name: "Local SUPER_ADMIN", emailVerified: true });
    userId = user.id;
    await ctx.internalAdapter.createAccount({
      userId,
      providerId: "credential",
      accountId: userId,
      password: await ctx.password.hash(password),
    });
  }
  await sql`insert into staff_profiles (user_id, role) values (${userId}, ${"SUPER_ADMIN"}) on conflict (user_id) do nothing`;
  await sql`insert into bootstrap_lock (id, user_id) values (${1}, ${userId}) on conflict (id) do nothing`;
  return userId;
}
