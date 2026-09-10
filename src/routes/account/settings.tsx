import { createFileRoute } from "@tanstack/react-router";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUser } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/account/settings")({ component: Settings });

function Settings() {
  const user = useCurrentUser();
  return (
    <div className="max-w-lg space-y-4">
      <p className="text-sm text-muted">Signed in as {user?.primaryEmail ?? user?.displayName}.</p>
      <UserButton />
      <p className="text-sm text-muted">
        Password changes use the email/password form on the sign-in page when you registered that way.
      </p>
    </div>
  );
}
