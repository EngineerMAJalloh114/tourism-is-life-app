import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { pageHead } from "@/lib/seo";
import { getTeamSetupState, requestTeamSetup } from "@/lib/server/team-setup.functions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { FormError, TeamPanel } from "@/components/team/team-panel";

export const Route = createFileRoute("/team/setup")({
  head: () => pageHead("First-time setup", "Set up the first team account.", "/team/setup", "noindex,nofollow"),
  component: Setup,
});

function Setup() {
  const [open, setOpen] = useState<boolean | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    void getTeamSetupState()
      .then((s) => setOpen(s.open))
      .catch(() => setOpen(false));
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      await requestTeamSetup({ data: { name, email } });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "That did not go through. Try again in a moment.");
    } finally {
      setPending(false);
    }
  }

  if (open === null) return <TeamPanel title="First-time setup">{null}</TeamPanel>;

  if (!open) {
    return (
      <TeamPanel
        title="Setup is complete"
        lede="The team desk already has its first account. Team members are added from the desk."
      >
        <Button asChild className="w-full">
          <Link to="/team/sign-in">Sign in</Link>
        </Button>
      </TeamPanel>
    );
  }

  if (sent) {
    return (
      <TeamPanel
        title="Check your email"
        lede="If that is the address set up for the first team account, a link to choose your password is on its way. It works once and lasts 60 minutes. After that, sign in, set up two-factor, and claim SUPER_ADMIN at the desk."
      >
        <Link to="/team/sign-in" className="text-sm text-muted hover:text-heading">
          Back to sign-in
        </Link>
      </TeamPanel>
    );
  }

  return (
    <TeamPanel
      title="First-time setup"
      lede="For the owner only, before any team account exists. Use the address the site was configured with; the link goes to that mailbox."
    >
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <Label htmlFor="setup-name">Your name</Label>
          <Input id="setup-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="setup-email">Email</Label>
          <Input
            id="setup-email"
            type="email"
            autoComplete="email"
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
    </TeamPanel>
  );
}
