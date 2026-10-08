import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth/client";
import { pageHead } from "@/lib/seo";
import { getTeamSetupState } from "@/lib/server/team-setup.functions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { FormError, TeamPanel } from "@/components/team/team-panel";
import { authErrorMessage, safeNext } from "@/lib/team-auth-ui";

export const Route = createFileRoute("/team/sign-in")({
  validateSearch: (raw: Record<string, unknown>): { next?: string } =>
    typeof raw.next === "string" ? { next: raw.next } : {},
  head: () => pageHead("Team sign-in", "Sign in to the Tourism Is Life operations desk.", "/team/sign-in", "noindex,nofollow"),
  component: TeamSignIn,
});

function TeamSignIn() {
  const { next } = Route.useSearch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);

  useEffect(() => {
    void getTeamSetupState()
      .then((s) => setSetupOpen(s.open))
      .catch(() => setSetupOpen(false));
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const { data, error: failed } = await authClient.signIn.email({ email: email.trim(), password });
    setPending(false);
    if (failed) {
      setError(authErrorMessage(failed, "Email or password is incorrect."));
      return;
    }
    const destination = safeNext(next);
    if ((data as { twoFactorRedirect?: boolean } | null)?.twoFactorRedirect) {
      await navigate({ to: "/team/two-factor", search: { next: destination } });
      return;
    }
    // Signed in without two-factor yet: the admin sends the member to enrol.
    window.location.href = destination;
  }

  return (
    <TeamPanel title="Sign in" lede="For Tourism Is Life team members. Visitors do not need an account to send an enquiry.">
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <Label htmlFor="team-email">Email</Label>
          <Input
            id="team-email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="team-password">Password</Label>
          <Input
            id="team-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <FormError message={error} />
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm">
        <Link to="/team/forgot-password" className="text-muted hover:text-heading">
          Forgot your password?
        </Link>
      </p>
      {setupOpen ? (
        <p className="mt-2 text-center text-sm">
          <Link to="/team/setup" className="text-muted hover:text-heading">
            First-time setup
          </Link>
        </p>
      ) : null}
    </TeamPanel>
  );
}
