import { useEffect } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Saved places live in this browser only (localStorage). There is no account
 * sync, and the UI says "saved on this device" rather than implying otherwise.
 *
 * `skipHydration` keeps the server render and the first client render both
 * empty, so hearts never cause a hydration mismatch. `useFavoritesHydration`
 * restores the stored ids right after mount.
 */
interface FavoritesState {
  ids: string[];
  toggle: (id: string) => void;
}

export const FAVORITES_STORAGE_KEY = "til-saved-places";

export const useFavorites = create<FavoritesState>()(
  persist(
    (set) => ({
      ids: [],
      toggle: (id) =>
        set((s) => ({ ids: s.ids.includes(id) ? s.ids.filter((x) => x !== id) : [...s.ids, id].slice(-200) })),
    }),
    {
      name: FAVORITES_STORAGE_KEY,
      skipHydration: true,
      partialize: (s) => ({ ids: s.ids }),
      onRehydrateStorage: () => (state) => {
        // Anything that is not a list of strings (older build, hand-edited storage) is dropped.
        if (state && !(Array.isArray(state.ids) && state.ids.every((x) => typeof x === "string"))) state.ids = [];
      },
    },
  ),
);

export function useFavoritesHydration() {
  useEffect(() => {
    void useFavorites.persist.rehydrate();
  }, []);
}
