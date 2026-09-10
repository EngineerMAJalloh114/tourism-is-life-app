import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { pageHead } from "@/lib/seo";

type Search = { token?: string };

export const Route = createFileRoute("/reset-password")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    token: typeof s.token === "string" ? s.token : undefined,
  }),
  head: () => pageHead("Set a new password", "Complete a Tourism Is Life password reset.", "/reset-password"),
  component: ResetPassword,
});

function ResetPassword() {
  const { token } = Route.useSearch();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) {
      setError("This reset link is missing its token. Request a new one.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const reset = (authClient as { resetPassword?: (o: { newPassword: string; token: string }) => Promise<unknown> }).resetPassword;
      if (!reset) throw new Error("Password reset is unavailable until email delivery is configured.");
      await reset({ newPassword: password, token });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset password");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="container-page grid min-h-[70vh] place-items-center py-16">
      <div className="w-full max-w-md rounded-lg border border-line bg-surface p-8 shadow-[var(--shadow-card)]">
        <h1 className="font-display text-3xl text-brand">Set a new password</h1>
        {done ? (
          <p className="mt-4 text-sm">
            Password updated.{" "}
            <Link to="/login" className="text-brand hover:text-gold">
              Sign in
            </Link>
          </p>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-3">
            <div>
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Please wait…" : "Update password"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
