import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth/client";
import { pageHead } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { FormError, TeamPanel } from "@/components/team/team-panel";
import { authErrorMessage, safeNext } from "@/lib/team-auth-ui";

export const Route = createFileRoute("/team/two-factor")({
  validateSearch: (raw: Record<string, unknown>): { next?: string } =>
    typeof raw.next === "string" ? { next: raw.next } : {},
  head: () =>
    pageHead("Two-factor check", "Enter the code from your authenticator app.", "/team/two-factor", "noindex,nofollow"),
  component: TwoFactor,
});

function TwoFactor() {
  const { next } = Route.useSearch();
  const [mode, setMode] = useState<"code" | "recovery">("code");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const value = code.trim();
    const { error: failed } =
      mode === "code"
        ? await authClient.twoFactor.verifyTotp({ code: value.replace(/\s/g, "") })
        : await authClient.twoFactor.verifyBackupCode({ code: value });
    setPending(false);
    if (failed) {
      setError(
        authErrorMessage(
          failed,
          mode === "code" ? "That code did not work. Check the time on your phone and try again." : "That recovery code did not work.",
        ),
      );
      return;
    }
    window.location.href = safeNext(next);
  }

  return (
    <TeamPanel
      title={mode === "code" ? "Enter your code" : "Use a recovery code"}
      lede={
        mode === "code"
          ? "Open your authenticator app and type the 6-digit code for Tourism Is Life."
          : "Type one of the recovery codes you saved when you set up two-factor. Each one works once."
      }
    >
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <Label htmlFor="two-factor-code">{mode === "code" ? "6-digit code" : "Recovery code"}</Label>
          <Input
            id="two-factor-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            inputMode={mode === "code" ? "numeric" : "text"}
            autoComplete="one-time-code"
            pattern={mode === "code" ? "[0-9 ]{6,7}" : undefined}
            maxLength={mode === "code" ? 7 : 11}
            required
            autoFocus
          />
        </div>
        <FormError message={error} />
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Checking…" : "Continue"}
        </Button>
      </form>
      <button
        type="button"
        className="mt-4 w-full text-sm text-muted hover:text-heading"
        onClick={() => {
          setMode(mode === "code" ? "recovery" : "code");
          setCode("");
          setError(null);
        }}
      >
        {mode === "code" ? "Lost your phone? Use a recovery code" : "Use the authenticator code instead"}
      </button>
      <p className="mt-2 text-center text-sm">
        <Link to="/team/sign-in" className="text-muted hover:text-heading">
          Start again
        </Link>
      </p>
    </TeamPanel>
  );
}
