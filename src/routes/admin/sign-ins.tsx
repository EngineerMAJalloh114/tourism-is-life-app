import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { requirePageCapability } from "@/lib/admin-access";
import { AdminRouteError } from "@/components/admin/admin-route-error";
import { adminListSignInAttempts } from "@/lib/server/admin/security.functions";

export const Route = createFileRoute("/admin/sign-ins")({
  beforeLoad: ({ context }) => requirePageCapability(context.access, "audit.view"),
  errorComponent: AdminRouteError,
  component: SignIns,
});

const OUTCOME_LABELS: Record<string, string> = {
  "signed-in": "Signed in",
  "password-ok": "Password accepted, code requested",
  "two-factor-ok": "Code accepted",
  "bad-credentials": "Wrong email or password",
  "bad-code": "Wrong code",
  refused: "Refused (not an active team account)",
  "rate-limited": "Blocked: too many attempts",
  sent: "Link requested",
  failed: "Failed",
};

function SignIns() {
  const [rows, setRows] = useState<Awaited<ReturnType<typeof adminListSignInAttempts>>>([]);
  const [email, setEmail] = useState("");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const handle = setTimeout(() => {
      void adminListSignInAttempts({ data: { email: email.trim() || undefined, limit: 200 } })
        .then(setRows)
        .catch((e) => setErr(e instanceof Error ? e.message : "Could not load the sign-in log."));
    }, 250);
    return () => clearTimeout(handle);
  }, [email]);

  return (
    <div>
      <h1 className="font-display text-3xl text-heading">Sign-in log</h1>
      <p className="mt-2 text-sm text-muted">
        Every team sign-in, two-factor, password reset and setup attempt, newest first.
      </p>
      <label className="mt-4 block text-sm">
        <span className="block text-xs uppercase tracking-[0.14em] text-muted">Email</span>
        <input
          className="mt-1 min-h-10 w-full max-w-sm rounded-md border border-line bg-page px-2"
          type="search"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.com"
        />
      </label>
      {err ? (
        <p role="alert" className="mt-3 text-sm text-danger">
          {err}
        </p>
      ) : null}
      <ul className="mt-6 space-y-2 text-sm">
        {rows.map((r) => (
          <li key={r.id} className="rounded-md border border-line bg-surface px-4 py-2">
            <span className="font-mono text-xs text-muted">{new Date(r.created_at).toLocaleString()}</span>
            <span className="ml-2 font-medium">{OUTCOME_LABELS[r.outcome] ?? r.outcome}</span>
            <span className="ml-2 text-muted">{r.kind}</span>
            <span className="ml-2 break-all text-xs text-muted">
              {r.email ?? "unknown email"} · {r.ip ?? "unknown IP"}
            </span>
          </li>
        ))}
      </ul>
      {rows.length === 0 ? <p className="mt-4 text-muted">No attempts recorded.</p> : null}
    </div>
  );
}
