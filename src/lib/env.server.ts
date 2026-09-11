export function env(key: string): string | undefined {
  const v = process.env[key]?.trim();
  return v || undefined;
}

/**
 * Workspace preview vs deployed app. The deployer writes GROK_PROJECT_ID on
 * every publish; the sandbox preview never has it. A non-Grok host (e.g.
 * Vercel) sets no GROK_PROJECT_ID either, so that alone is not a reliable
 * "really deployed" signal — Vercel sets `VERCEL` at both build and runtime,
 * in every one of its environments (production, preview, development), so we
 * check that too. Single source of truth for the split — gate audience, gate
 * endpoints, connector-token semantics, demo-payment eligibility, cron auth
 * and the staff-bootstrap gate all key off this predicate.
 */
export function isWorkspacePreview(): boolean {
  return !env("GROK_PROJECT_ID") && !env("VERCEL");
}
