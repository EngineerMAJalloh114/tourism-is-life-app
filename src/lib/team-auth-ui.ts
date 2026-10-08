/** Small helpers shared by the /team pages (kept out of component files for fast refresh). */

/** Only internal admin and team paths may be used as a post-sign-in destination. */
export function safeNext(raw: unknown): string {
  if (typeof raw !== "string") return "/admin";
  if (!/^\/(admin|team\/enrol)(\/[\w./-]*)?(\?[\w=&%.-]*)?$/.test(raw)) return "/admin";
  return raw;
}

/** The error message Better Auth's client returns, or a fallback. */
export function authErrorMessage(error: unknown, fallback: string): string {
  const e = error as { message?: string; status?: number } | null | undefined;
  if (e?.status === 429) return "Too many attempts. Wait 15 minutes, then try again.";
  return e?.message || fallback;
}
