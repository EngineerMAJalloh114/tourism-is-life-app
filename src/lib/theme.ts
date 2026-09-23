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

export const DEFAULT_THEME: ThemeId = "default";

export type ThemeOption = {
  id: ThemeId;
  label: string;
  /** Short description read by screen readers and shown under the label. */
  description: string;
  /** Three representative colours for the selector preview, dark to light. */
  swatch: [string, string, string];
};

export const THEMES: ThemeOption[] = [
  {
    id: "default",
    label: "Default",
    description: "Forest green and gold",
    swatch: ["#1b2e28", "#c69a3e", "#fbf8f1"],
  },
  {
    id: "two",
    label: "Theme Two",
    description: "Deep teal and sand",
    swatch: ["#00525E", "#6BCED8", "#FAF7F3"],
  },
  {
    id: "three",
    label: "Theme Three",
    description: "Navy and sky blue",
    swatch: ["#171725", "#5A94C1", "#F7F8FA"],
  },
  {
    id: "four",
    label: "Theme Four",
    description: "Coastal slate and teal",
    swatch: ["#383E3D", "#83B1C4", "#F7F9F9"],
  },
];

/** localStorage key written by the persisted prefs store. */
export const PREFS_KEY = "til-prefs";

/**
 * Inline `<head>` script, run before first paint, that restores the saved theme
 * so the page never flashes the default palette. Kept dependency-free and
 * generated from THEME_IDS so it cannot drift from the list above. Wrapped in
 * try/catch because storage access throws when cookies are blocked.
 */
export const THEME_BOOTSTRAP = `(function(){try{
var ids=${JSON.stringify(THEME_IDS)};
var raw=localStorage.getItem(${JSON.stringify(PREFS_KEY)});
if(!raw)return;
var t=(JSON.parse(raw)||{}).state&&JSON.parse(raw).state.theme;
if(ids.indexOf(t)===-1||t===${JSON.stringify(DEFAULT_THEME)})return;
document.documentElement.setAttribute("data-theme",t);
}catch(e){}})();`;

/** Narrows an unknown stored value to a usable theme, falling back to default. */
export function parseTheme(value: unknown): ThemeId {
  return THEME_IDS.includes(value as ThemeId) ? (value as ThemeId) : DEFAULT_THEME;
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
