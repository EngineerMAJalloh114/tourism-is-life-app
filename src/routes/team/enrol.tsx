import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth/client";
import { qrSvg } from "@/lib/qr-svg";
import { pageHead } from "@/lib/seo";
import { getAdminAccess } from "@/lib/server/admin-access.functions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { FormError, TeamPanel } from "@/components/team/team-panel";
import { authErrorMessage } from "@/lib/team-auth-ui";

export const Route = createFileRoute("/team/enrol")({
  head: () =>
    pageHead("Set up two-factor sign-in", "Connect an authenticator app to your team account.", "/team/enrol", "noindex,nofollow"),
  beforeLoad: async () => {
    const access = await getAdminAccess();
    if (!access.signedIn) throw redirect({ to: "/team/sign-in", search: { next: "/team/enrol" } });
    return { access };
  },
  component: Enrol,
});

type Enrolment = { totpURI: string; backupCodes: string[] };

function secretFrom(uri: string): string {
  try {
    return (new URL(uri).searchParams.get("secret") ?? "").replace(/(.{4})/g, "$1 ").trim();
  } catch {
    return "";
  }
}

function Enrol() {
  const { access } = Route.useRouteContext();
  const [password, setPassword] = useState("");
  const [enrolment, setEnrolment] = useState<Enrolment | null>(null);
  const [saved, setSaved] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const qr = useMemo(() => (enrolment ? qrSvg(enrolment.totpURI) : null), [enrolment]);

  if (access.twoFactorEnabled) {
    return (
      <TeamPanel title="Two-factor is on" lede="Your account already uses an authenticator app. If you lost your phone, ask a SUPER_ADMIN to reset it.">
        <Button asChild className="w-full">
          <Link to="/admin">Go to the desk</Link>
        </Button>
      </TeamPanel>
    );
  }

  async function start(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const { data, error: failed } = await authClient.twoFactor.enable({ password });
    setPending(false);
    if (failed || !data) {
      setError(authErrorMessage(failed, "That password is not right."));
      return;
    }
    setPassword("");
    setEnrolment(data as Enrolment);
  }

  async function confirm(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const { error: failed } = await authClient.twoFactor.verifyTotp({ code: code.replace(/\s/g, "") });
    setPending(false);
    if (failed) {
      setError(authErrorMessage(failed, "That code did not work. Check the time on your phone and try again."));
      return;
    }
    window.location.href = "/admin";
  }

  function download() {
    if (!enrolment) return;
    const text = [
      "Tourism Is Life team desk: two-factor recovery codes",
      "Each code works once. Keep them somewhere safe, away from your phone.",
      "",
      ...enrolment.backupCodes,
    ].join("\n");
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "tourism-is-life-recovery-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!enrolment) {
    return (
      <TeamPanel
        title="Set up two-factor sign-in"
        lede="Every team account uses an authenticator app (for example Google Authenticator, Microsoft Authenticator or 1Password). Confirm your password to start."
      >
        <form onSubmit={start} className="space-y-3">
          <div>
            <Label htmlFor="enrol-password">Password</Label>
            <Input
              id="enrol-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <FormError message={error} />
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Starting…" : "Continue"}
          </Button>
        </form>
      </TeamPanel>
    );
  }

  return (
    <TeamPanel title="Scan this code" lede="In your authenticator app, add an account and scan the code. It is drawn on this page; it is not sent anywhere.">
      {/* Black on white regardless of theme: authenticator apps need that contrast to scan. */}
      {qr ? (
        <svg
          viewBox={qr.viewBox}
          className="mx-auto h-56 w-56 rounded bg-white p-0"
          role="img"
          aria-label="QR code for your authenticator app"
          shapeRendering="crispEdges"
        >
          <rect width="100%" height="100%" fill="#ffffff" />
          <path d={qr.path} fill="#000000" />
        </svg>
      ) : null}
      <p className="mt-3 text-center text-xs text-muted">
        Cannot scan? Enter this key by hand: <span className="font-mono text-ink">{secretFrom(enrolment.totpURI)}</span>
      </p>

      <h2 className="mt-6 font-display text-xl text-heading">Your recovery codes</h2>
      <p className="mt-1 text-sm text-muted">
        If you lose your phone, each of these lets you sign in once. They are shown only now. Save them before you
        continue.
      </p>
      <ol className="mt-3 grid grid-cols-2 gap-2 rounded-md border border-line bg-page p-3 font-mono text-sm">
        {enrolment.backupCodes.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ol>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" onClick={() => void navigator.clipboard?.writeText(enrolment.backupCodes.join("\n"))}>
          Copy
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={download}>
          Download
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => window.print()}>
          Print
        </Button>
      </div>
      <label className="mt-4 flex items-start gap-2 text-sm">
        <input type="checkbox" className="mt-1" checked={saved} onChange={(e) => setSaved(e.target.checked)} />
        <span>I have saved my recovery codes.</span>
      </label>

      <form onSubmit={confirm} className="mt-6 space-y-3">
        <div>
          <Label htmlFor="enrol-code">6-digit code from the app</Label>
          <Input
            id="enrol-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9 ]{6,7}"
            maxLength={7}
            required
          />
        </div>
        <FormError message={error} />
        <Button type="submit" className="w-full" disabled={pending || !saved}>
          {pending ? "Checking…" : "Turn on two-factor"}
        </Button>
      </form>
    </TeamPanel>
  );
}
