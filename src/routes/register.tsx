import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { GROK_PROVIDERS, SOCIAL_LOGIN_ENABLED, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/register")({
  head: () => pageHead("Create an account", "Register to keep bookings, vouchers and saved tours.", "/register"),
  component: Register,
});

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      await authClient.signUp.email({ email, password, name });
      window.location.href = "/account";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="container-page grid min-h-[70vh] place-items-center py-16">
      <div className="w-full max-w-md rounded-lg border border-line bg-surface p-8 shadow-[var(--shadow-card)]">
        <p className="text-xs uppercase tracking-[0.2em] text-gold-ink">Account</p>
        <h1 className="mt-2 font-display text-3xl text-heading">Create an account</h1>
        <p className="mt-2 text-sm text-muted">
          Optional. Guest checkout does not require an account. Register to keep vouchers and saved tours.
        </p>
        {authEnabled ? (
          <div className="mt-6 space-y-3">
            {SOCIAL_LOGIN_ENABLED
              ? GROK_PROVIDERS.map((p) => (
                  <Button
                    key={p.providerId}
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => signIn(p.providerId, { callbackURL: "/account" })}
                  >
                    Continue with {p.label}
                  </Button>
                ))
              : null}
            <form onSubmit={onSubmit} className="space-y-3">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
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
                {pending ? "Please wait…" : "Create account"}
              </Button>
            </form>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted">Registration is disabled.</p>
        )}
        <p className="mt-6 text-center text-sm">
          Already registered?{" "}
          <Link to="/login" className="text-heading hover:text-gold-ink">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
