import { useEffect, useRef, useState } from "react";
import { Check, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePrefs } from "@/lib/prefs";
import { THEMES, type ThemeId } from "@/lib/theme";

/**
 * Theme picker for the header utility bar. Renders as a radiogroup so screen
 * readers announce the options as a single choice, and closes on Escape, on
 * outside click, and after a selection.
 */
export function ThemeSwitcher() {
  const { theme, setTheme } = usePrefs();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const active = THEMES.find((t) => t.id === theme) ?? THEMES[0];

  function choose(id: ThemeId) {
    setTheme(id);
    setOpen(false);
    buttonRef.current?.focus();
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`Change site theme. Current theme: ${active.label}`}
        className="inline-flex min-h-8 items-center gap-1.5 text-ivory/70 transition-colors hover:text-gold"
      >
        <Palette className="size-3.5" aria-hidden />
        <span className="hidden sm:inline">Theme</span>
        <span
          aria-hidden
          className="ml-0.5 size-2.5 rounded-full border border-ivory/40"
          /* The highlight, not the page or band colour: this dot sits on the dark
             utility bar, where a theme's page colour would be nearly invisible. */
          style={{ background: active.swatch[2] }}
        />
      </button>

      {open ? (
        <div
          role="radiogroup"
          aria-label="Site theme"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-60 overflow-hidden rounded-lg border border-line bg-page p-1.5 text-ink shadow-[var(--shadow-lift)]"
        >
          {THEMES.map((option) => {
            const selected = option.id === theme;
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => choose(option.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left normal-case tracking-normal transition-colors",
                  selected ? "bg-surface" : "hover:bg-surface/70",
                )}
              >
                <span aria-hidden className="flex shrink-0 overflow-hidden rounded-md border border-line">
                  {option.swatch.map((colour) => (
                    <span key={colour} className="size-4" style={{ background: colour }} />
                  ))}
                </span>
                <span className="flex-1">
                  <span className="block text-[13px] font-medium leading-tight text-heading">
                    {option.label}
                  </span>
                  <span className="block text-[11px] leading-tight text-muted">{option.description}</span>
                </span>
                {selected ? <Check className="size-4 shrink-0 text-gold-ink" aria-hidden /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
