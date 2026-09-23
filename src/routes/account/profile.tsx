import { createFileRoute, Link } from "@tanstack/react-router";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/account/profile")({ component: Profile });

function Profile() {
  const user = useCurrentUser();
  return (
    <div className="max-w-lg space-y-5">
      <dl className="space-y-3 text-sm">
        <div>
          <dt className="text-xs uppercase tracking-[0.14em] text-muted">Name</dt>
          <dd className="mt-1">{user?.displayName ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-[0.14em] text-muted">Email</dt>
          <dd className="mt-1">{user?.primaryEmail ?? "—"}</dd>
        </div>
      </dl>
      <p className="text-sm text-muted">
        Profile edits beyond sign-in providers are handled by writing to {SITE.email} or using{" "}
        <Link to="/account/settings" className="text-heading hover:text-gold-ink">
          account settings
        </Link>
        .
      </p>
    </div>
  );
}
