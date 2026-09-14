import { useState, type FormEvent } from "react";
import { subscribeNewsletter } from "@/lib/server/ops";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export function NewsletterForm({ variant = "light" }: { variant?: "light" | "dark" }) {
  const [status, setStatus] = useState<"idle" | "saving" | "ok" | "err">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const email = String(fd.get("email") ?? "");
    setStatus("saving");
    try {
      await subscribeNewsletter({ data: { email } });
      setStatus("ok");
      form.reset();
    } catch (err) {
      setStatus("err");
      setMessage(err instanceof Error ? err.message : "Could not subscribe.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <Label htmlFor="newsletter-email" className={variant === "dark" ? "text-ivory/70" : undefined}>
          Email
        </Label>
        <Input
          id="newsletter-email"
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          className={variant === "dark" ? "border-ivory/20 bg-brand/40 text-ivory placeholder:text-ivory/40" : undefined}
        />
      </div>
      <Button type="submit" disabled={status === "saving"} variant={variant === "dark" ? "primary" : "dark"}>
        {status === "saving" ? "Sending…" : "Subscribe"}
      </Button>
      {status === "ok" ? (
        <p className="text-sm text-ok" role="status">
          You’re on the list.
        </p>
      ) : null}
      {status === "err" ? (
        <p className="text-sm text-danger" role="alert">
          {message}
        </p>
      ) : null}
    </form>
  );
}
