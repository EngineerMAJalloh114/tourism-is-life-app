import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth/client";
import { pageHead } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { FormError, TeamPanel } from "@/components/team/team-panel";
import { authErrorMessage } from "@/lib/team-auth-ui";

export const Route = createFileRoute("/team/reset-password")({
  validateSearch: (raw: Record<string, unknown>): { token?: string; error?: string } => ({
    ...(typeof raw.token === "string" ? { token: raw.token } : {}),
    ...(typeof raw.error === "string" ? { error: raw.error } : {}),
  }),
  head: () =>
    pageHead("Choose a new password", "Set the password for your team account.", "/team/reset-password", "noindex,nofollow"),
  component: ResetPassword,
});

const MIN = 12;

function ResetPassword() {
  const { token, error: linkError } = Route.useSearch();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (!token || linkError) {
    return (
      <TeamPanel
        title="This link does not work"
        lede="It may have been used already or be more than 60 minutes old. Ask for a new one."
      >
        <Button asChild className="w-full">
          <Link to="/team/forgot-password">Get a new link</Link>
        </Button>
      </TeamPanel>
    );
  }

  if (done) {
    return (
      <TeamPanel title="Password saved" lede="Sign in with your new password. Any other signed-in sessions have ended.">
        <Button asChild className="w-full">
          <Link to="/team/sign-in">Sign in</Link>
        </Button>
      </TeamPanel>
    );
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (password.length < MIN) {
      setError(`Use at least ${MIN} characters.`);
      return;
    }
    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }
    setPending(true);
    setError(null);
    const { error: failed } = await authClient.resetPassword({ newPassword: password, token });
    setPending(false);
    if (failed) {
      setError(authErrorMessage(failed, "This link does not work any more. Ask for a new one."));
      return;
    }
    setDone(true);
  }

  return (
    <TeamPanel title="Choose a password" lede={`At least ${MIN} characters. A short sentence you can remember works well.`}>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <Label htmlFor="new-password">New password</Label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            minLength={MIN}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="confirm-password">Type it again</Label>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            minLength={MIN}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </div>
        <FormError message={error} />
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Saving…" : "Save password"}
        </Button>
      </form>
    </TeamPanel>
  );
}
