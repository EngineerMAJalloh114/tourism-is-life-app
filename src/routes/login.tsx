import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { GROK_PROVIDERS, SOCIAL_LOGIN_ENABLED, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/login")({
  head: () => pageHead("Sign in", "Sign in to Tourism Is Life to manage bookings and saved tours.", "/login"),
  component: Login,
});

function Login() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onEmail(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      if (mode === "up") {
        await authClient.signUp.email({ email, password, name });
      } else {
        await authClient.signIn.email({ email, password });
      }
      window.location.href = "/account";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="container-page grid min-h-[70vh] place-items-center py-16">
      <div className="w-full max-w-md rounded-lg border border-line bg-surface p-8 shadow-[var(--shadow-card)]">
        <p className="text-xs uppercase tracking-[0.2em] text-gold-ink">Account</p>
        <h1 className="mt-2 font-display text-3xl text-brand">
          {mode === "in" ? "Sign in" : "Create an account"}
        </h1>
        <p className="mt-2 text-sm text-muted">
          Required for saved tours, bookings, and enquiries. Guest browsing and guest checkout do not
          require an account.
        </p>
        {authEnabled ? (
          <div className="mt-6 space-y-3">
            {SOCIAL_LOGIN_ENABLED ? (
              <>
                {GROK_PROVIDERS.map((p) => (
                  <Button
                    key={p.providerId}
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => signIn(p.providerId, { callbackURL: "/account" })}
                  >
                    Continue with {p.label}
                  </Button>
                ))}
                <div className="relative py-2 text-center text-xs uppercase tracking-[0.16em] text-muted">
                  or email
                </div>
              </>
            ) : null}
            <form onSubmit={onEmail} className="space-y-3">
              {mode === "up" ? (
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
              ) : null}
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
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
                {pending ? "Please wait…" : mode === "in" ? "Sign in" : "Create account"}
              </Button>
            </form>
            <button
              type="button"
              className="w-full text-sm text-muted hover:text-brand"
              onClick={() => setMode(mode === "in" ? "up" : "in")}
            >
              {mode === "in" ? "Need an account? Register" : "Already registered? Sign in"}
            </button>
            {mode === "in" ? (
              <p className="text-center text-sm">
                <Link to="/forgot-password" className="text-muted hover:text-brand">
                  Forgot password
                </Link>
                {" · "}
                <Link to="/register" className="text-muted hover:text-brand">
                  Create an account
                </Link>
              </p>
            ) : null}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted">Sign-in is disabled.</p>
        )}
        <p className="mt-6 text-center text-sm">
          <Link to="/" className="text-brand hover:text-gold">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
