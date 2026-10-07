import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { authClient, authEnabled } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { pageHead } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/forgot-password")({
  head: () => pageHead("Reset password", "Request a password reset for your Tourism Is Life account.", "/forgot-password"),
  component: ForgotPassword,
});

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const reset = (authClient as { forgetPassword?: (o: { email: string; redirectTo: string }) => Promise<unknown> }).forgetPassword;
      if (!reset) {
        setDone(true);
        return;
      }
      await reset({ email, redirectTo: "/reset-password" });
      setDone(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Password reset email needs Resend credentials. Write to ${SITE.email} if this persists.`,
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="container-page grid min-h-[70vh] place-items-center py-10">
      <div className="w-full max-w-md rounded-lg border border-line bg-surface p-8 shadow-[var(--shadow-card)]">
        <p className="text-xs uppercase tracking-[0.2em] text-gold-ink">Account</p>
        <h1 className="mt-2 font-display text-3xl text-heading">Reset password</h1>
        {done ? (
          <p className="mt-4 text-sm text-muted">
            If that address is on file, a reset link will follow. Production delivery requires a Resend API key.
          </p>
        ) : (
          <>
            <p className="mt-2 text-sm text-muted">
              Enter the email on the account. Reset mail is sent only when Resend is configured.
            </p>
            {authEnabled ? (
              <form onSubmit={onSubmit} className="mt-6 space-y-3">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                {error ? <p className="text-sm text-danger">{error}</p> : null}
                <Button type="submit" className="w-full" disabled={pending}>
                  {pending ? "Please wait…" : "Send reset link"}
                </Button>
              </form>
            ) : (
              <p className="mt-4 text-sm text-muted">Sign-in is disabled.</p>
            )}
          </>
        )}
        <p className="mt-6 text-center text-sm">
          <Link to="/login" className="text-heading hover:text-gold-ink">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
