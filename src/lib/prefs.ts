import { create } from "zustand";
import { persist } from "zustand/middleware";

type Currency = "USD" | "SLE";
type Lang = "EN";

interface Prefs {
  currency: Currency;
  language: Lang;
  setCurrency: (c: Currency) => void;
}

export const usePrefs = create<Prefs>()(
  persist(
    (set) => ({
      currency: "USD",
      language: "EN",
      setCurrency: (currency) => set({ currency }),
    }),
    { name: "til-prefs" },
  ),
);
