import type { ErrorComponentProps } from "@tanstack/react-router";

/** Shown in place of an admin page when its `beforeLoad` or loader refuses access. */
export function AdminRouteError({ error }: ErrorComponentProps) {
  const forbidden = error instanceof Error && (error.name === "AdminPageForbidden" || /access/i.test(error.message));
  return (
    <div className="rounded-lg border border-line bg-surface p-6">
      <h1 className="font-display text-2xl text-heading">{forbidden ? "No access" : "This page could not load"}</h1>
      <p className="mt-2 text-sm text-muted">
        {forbidden
          ? "Your account does not have access to this page. Ask a SUPER_ADMIN if you need it."
          : error instanceof Error
            ? error.message
            : "Try again in a moment."}
      </p>
    </div>
  );
}
