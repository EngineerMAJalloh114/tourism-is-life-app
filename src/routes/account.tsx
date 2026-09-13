import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { pageHead } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/account")({
  head: () => pageHead("Account", "Your Tourism Is Life bookings and saved tours.", "/account"),
  component: AccountLayout,
});

const LINKS = [
  { to: "/account", label: "Overview" },
  { to: "/account/profile", label: "Profile" },
  { to: "/account/bookings", label: "Bookings" },
  { to: "/account/payments", label: "Payments" },
  { to: "/account/vouchers", label: "Vouchers" },
  { to: "/account/saved", label: "Saved" },
  { to: "/account/reviews", label: "Reviews" },
  { to: "/account/settings", label: "Settings" },
];

function AccountLayout() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) return <div className="container-page py-24">Loading account…</div>;
  if (!user) return <RedirectToSignIn />;
  return (
    <div className="container-page py-12">
      <p className="text-xs uppercase tracking-[0.16em] text-gold-ink">Account</p>
      <h1 className="mt-2 font-display text-4xl text-brand">{user.displayName ?? "Traveller"}</h1>
      <p className="mt-2 text-sm text-muted">{user.primaryEmail}</p>
      <nav className="mt-8 flex flex-wrap gap-2 border-b border-line pb-3" aria-label="Account">
        {LINKS.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className={cn("min-h-10 rounded-full border border-line px-4 py-2 text-sm hover:border-gold")}
            activeProps={{ className: "border-brand bg-brand text-ivory" }}
          >
            {l.label}
          </Link>
        ))}
      </nav>
      <div className="py-8">
        <Outlet />
      </div>
    </div>
  );
}
