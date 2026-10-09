import type { ErrorComponentProps } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";
import { INTERFACE_TEXT } from "@/content/defaults/interface";

export function AppErrorComponent({ error }: ErrorComponentProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-page px-6 text-center text-ink">
      <span className="text-danger" aria-hidden="true">
        <TriangleAlert className="size-10" strokeWidth={2} />
      </span>
      <h1 className="font-display text-2xl text-heading">{INTERFACE_TEXT.errorTitle}</h1>
      <p className="max-w-md text-sm break-words text-muted">
        {error instanceof Error && error.message
          ? error.message
          : INTERFACE_TEXT.errorFallback}
      </p>
    </main>
  );
}
