import { create } from "zustand";
import { persist } from "zustand/middleware";
import { applyTheme, DEFAULT_THEME, parseTheme, type ThemeId } from "@/lib/theme";

type Currency = "USD" | "SLE";
type Lang = "EN";

interface Prefs {
  currency: Currency;
  language: Lang;
  theme: ThemeId;
  setCurrency: (c: Currency) => void;
  setTheme: (t: ThemeId) => void;
}

export const PREFS_STORAGE_KEY = "til-prefs";

export const usePrefs = create<Prefs>()(
  persist(
    (set) => ({
      currency: "USD",
      language: "EN",
      theme: DEFAULT_THEME,
      setCurrency: (currency) => set({ currency }),
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
    }),
    {
      name: PREFS_STORAGE_KEY,
      onRehydrateStorage: () => (state) => {
        // A stored value from an older build (or hand-edited storage) must not
        // leave the document on an attribute no stylesheet defines.
        if (!state) return;
        const theme = parseTheme(state.theme);
        if (theme !== state.theme) state.theme = theme;
        applyTheme(theme);
      },
    },
  ),
);
