import { useEffect } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Saved tours live in this browser only (localStorage), like saved places on
 * Stay & Dine. Visitors do not have accounts any more (team sign-in only), so
 * "Save tour" no longer sends anyone to a sign-in page.
 *
 * `skipHydration` keeps the server render and the first client render both
 * "Save tour", so the button never causes a hydration mismatch.
 */
interface SavedToursState {
  slugs: string[];
  toggle: (slug: string) => void;
}

export const SAVED_TOURS_STORAGE_KEY = "til-saved-tours";

export const useSavedTours = create<SavedToursState>()(
  persist(
    (set) => ({
      slugs: [],
      toggle: (slug) =>
        set((s) => ({
          slugs: s.slugs.includes(slug) ? s.slugs.filter((x) => x !== slug) : [...s.slugs, slug].slice(-100),
        })),
    }),
    {
      name: SAVED_TOURS_STORAGE_KEY,
      skipHydration: true,
      partialize: (s) => ({ slugs: s.slugs }),
      onRehydrateStorage: () => (state) => {
        if (state && !(Array.isArray(state.slugs) && state.slugs.every((x) => typeof x === "string"))) state.slugs = [];
      },
    },
  ),
);

export function useSavedToursHydration() {
  useEffect(() => {
    void useSavedTours.persist.rehydrate();
  }, []);
}
