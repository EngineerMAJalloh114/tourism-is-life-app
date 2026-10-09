import type { ReactNode } from "react";

/** The card every /team page uses: same surface and type as the old sign-in page. */
export function TeamPanel({ title, lede, children }: { title: string; lede?: ReactNode; children: ReactNode }) {
  return (
    <div className="container-page grid min-h-[70vh] place-items-center py-10">
      <div className="w-full max-w-md rounded-lg border border-line bg-surface p-6 shadow-[var(--shadow-card)] sm:p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-gold-ink">Team access</p>
        <h1 className="mt-2 font-display text-3xl text-heading">{title}</h1>
        {lede ? <div className="mt-2 text-sm text-muted">{lede}</div> : null}
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-sm text-danger">
      {message}
    </p>
  );
}
