import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth/client";
import { pageHead } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { FormError, TeamPanel } from "@/components/team/team-panel";
import { authErrorMessage } from "@/lib/team-auth-ui";

export const Route = createFileRoute("/team/forgot-password")({
  head: () =>
    pageHead("Reset your team password", "Get a link to set a new password.", "/team/forgot-password", "noindex,nofollow"),
  component: ForgotPassword,
});

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const { error: failed } = await authClient.requestPasswordReset({
      email: email.trim(),
      redirectTo: "/team/reset-password",
    });
    setPending(false);
    if (failed) {
      setError(authErrorMessage(failed, "That did not go through. Try again in a moment."));
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <TeamPanel
        title="Check your email"
        lede="If that address belongs to a team account, a link to set a new password is on its way. It works once and lasts 60 minutes."
      >
        <Link to="/team/sign-in" className="text-sm text-muted hover:text-heading">
          Back to sign-in
        </Link>
      </TeamPanel>
    );
  }

  return (
    <TeamPanel title="Reset your password" lede="Enter the email address of your team account.">
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <Label htmlFor="reset-email">Email</Label>
          <Input
            id="reset-email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <FormError message={error} />
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Sending…" : "Send the link"}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm">
        <Link to="/team/sign-in" className="text-muted hover:text-heading">
          Back to sign-in
        </Link>
      </p>
    </TeamPanel>
  );
}
