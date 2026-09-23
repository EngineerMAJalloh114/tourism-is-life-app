import { create } from "zustand";
import { persist } from "zustand/middleware";
import { applyTheme, DEFAULT_THEME, parseTheme, type ThemeId } from "@/lib/theme";

interface Prefs {
  theme: ThemeId;
  setTheme: (t: ThemeId) => void;
}

export const PREFS_STORAGE_KEY = "til-prefs";

export const usePrefs = create<Prefs>()(
  persist(
    (set) => ({
      theme: DEFAULT_THEME,
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
