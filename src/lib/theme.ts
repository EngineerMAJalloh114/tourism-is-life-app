/**
 * The four selectable site themes.
 *
 * Colour values live in `src/styles.css`: the default theme in the Tailwind
 * `@theme` block, the other three in `html[data-theme="..."]` blocks that
 * override the same custom properties. Everything on the site reads those
 * properties through Tailwind utilities, so a theme needs no component changes.
 *
 * To rename a theme, change `label` here — nothing else refers to the names.
 * To add one, add an id here plus a matching `html[data-theme]` block in the
 * stylesheet.
 */

export const THEME_IDS = ["default", "two", "three", "four"] as const;

export type ThemeId = (typeof THEME_IDS)[number];

/**
 * The theme ID whose colours live unattributed in the base `@theme` block —
 * not necessarily what a new visitor sees first (see `INITIAL_THEME` for
 * that). Kept separate on purpose: this id is tied to the CSS architecture
 * (no `data-theme` attribute means "use the base tokens"), while the
 * initial experience is a product decision that can change independently.
 */
export const DEFAULT_THEME: ThemeId = "default";

/**
 * What a visitor with no saved preference sees — rendered server-side
 * directly on `<html data-theme>` in `__root.tsx` (not applied by the
 * bootstrap script below, which only runs for saved *overrides* of this).
 * Changing this does not touch `DEFAULT_THEME`: this is "the theme new
 * visitors get," that is "the one id with no CSS override to apply."
 */
export const INITIAL_THEME: ThemeId = "two";

export type ThemeOption = {
  id: ThemeId;
  label: string;
  /** Short description read by screen readers and shown under the label. */
  description: string;
  /**
   * Preview colours for the selector, in the order [page, accent band, highlight].
   * These must mirror `--color-page`, `--color-brand` and `--color-gold` for the
   * theme, or the swatch advertises a palette the page does not use.
   */
  swatch: [string, string, string];
};

export const THEMES: ThemeOption[] = [
  {
    id: "default",
    label: "Default",
    description: "Light, forest green and gold",
    swatch: ["#fbf8f1", "#1b2e28", "#c69a3e"],
  },
  {
    id: "two",
    label: "Theme Two",
    description: "Dark, deep teal and turquoise",
    swatch: ["#012026", "#004b56", "#47c2cf"],
  },
  {
    id: "three",
    label: "Theme Three",
    description: "Dark, sage green and slate blue",
    swatch: ["#1b2619", "#2b3a47", "#96a7b6"],
  },
  {
    id: "four",
    label: "Theme Four",
    description: "Light, storm blue and pearl",
    swatch: ["#f3eee7", "#323942", "#a1acb8"],
  },
];

/** localStorage key written by the persisted prefs store. */
export const PREFS_KEY = "til-prefs";

/**
 * Inline `<head>` script, run before first paint, that restores a *saved
 * override* of `INITIAL_THEME` so the page never flashes the wrong palette.
 * `__root.tsx` already renders `<html data-theme>` for `INITIAL_THEME`
 * server-side, so this script's job is narrower than "apply the theme": do
 * nothing when there's no saved choice, or the saved choice already matches
 * what the server rendered, or the value is corrupt; otherwise correct the
 * attribute to whatever the visitor actually picked — including switching
 * it back to `DEFAULT_THEME`'s unattributed state. Kept dependency-free and
 * generated from THEME_IDS so it cannot drift from the list above. Wrapped
 * in try/catch because storage access throws when cookies are blocked.
 */
export const THEME_BOOTSTRAP = `(function(){try{
var ids=${JSON.stringify(THEME_IDS)};
var raw=localStorage.getItem(${JSON.stringify(PREFS_KEY)});
if(!raw)return;
var t=(JSON.parse(raw)||{}).state&&JSON.parse(raw).state.theme;
if(ids.indexOf(t)===-1||t===${JSON.stringify(INITIAL_THEME)})return;
if(t===${JSON.stringify(DEFAULT_THEME)}){document.documentElement.removeAttribute("data-theme");return;}
document.documentElement.setAttribute("data-theme",t);
}catch(e){}})();`;

/** Narrows an unknown stored value to a usable theme, falling back to the initial one. */
export function parseTheme(value: unknown): ThemeId {
  return THEME_IDS.includes(value as ThemeId) ? (value as ThemeId) : INITIAL_THEME;
}

/**
 * Applies the theme to the document element. The default theme carries no
 * attribute so it keeps using the base `@theme` tokens untouched.
 */
export function applyTheme(theme: ThemeId): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === DEFAULT_THEME) root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
}
