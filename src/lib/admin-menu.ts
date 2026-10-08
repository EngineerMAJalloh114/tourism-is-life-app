/**
 * The admin menu, built from the capability map. An item appears only for a
 * role holding its capability; an item whose task is not built yet appears
 * disabled with the task that brings it, so the team can see what is coming.
 * Hiding is a convenience: every page and server function checks again.
 */
import type { Capability } from "@/lib/capabilities";

export type AdminMenuItem = {
  label: string;
  to: string;
  capability: Capability;
  /** False until the task that builds this page has shipped. */
  available: boolean;
  /** Shown on a disabled item. */
  comingIn?: string;
};

export type AdminMenuGroup = { label: string; items: AdminMenuItem[] };

export const ADMIN_MENU: AdminMenuGroup[] = [
  {
    label: "Operations",
    items: [
      { label: "Dashboard", to: "/admin", capability: "dashboard.view", available: true },
      { label: "Enquiries", to: "/admin/enquiries", capability: "enquiries.read", available: true },
    ],
  },
  {
    label: "Content",
    items: [
      { label: "Pages", to: "/admin/pages", capability: "pages.edit", available: false, comingIn: "the page builder" },
      { label: "Navigation", to: "/admin/navigation", capability: "navigation.edit", available: false, comingIn: "the page builder" },
      { label: "Collections", to: "/admin/collections", capability: "collections.edit", available: false, comingIn: "A8" },
      { label: "Media", to: "/admin/media", capability: "media.upload", available: true },
      { label: "Rates and ratings", to: "/admin/rates", capability: "rates.manage", available: false, comingIn: "A10" },
      { label: "Announcements", to: "/admin/announcements", capability: "announcements.edit", available: false, comingIn: "A11" },
    ],
  },
  {
    label: "Site",
    items: [
      { label: "Settings", to: "/admin/settings", capability: "settings.edit", available: false, comingIn: "A7" },
      { label: "Theme", to: "/admin/theme", capability: "theme.edit", available: false, comingIn: "the page builder" },
    ],
  },
  {
    label: "Team",
    items: [
      { label: "Team accounts", to: "/admin/users", capability: "users.view", available: true },
      { label: "Public profiles", to: "/admin/profiles", capability: "team.profiles", available: false, comingIn: "A9" },
    ],
  },
  {
    label: "Security",
    items: [
      { label: "Audit log", to: "/admin/audit", capability: "audit.view", available: true },
      { label: "Sign-in log", to: "/admin/sign-ins", capability: "audit.view", available: true },
    ],
  },
];

/** The menu for a set of capabilities: groups with no visible item are left out. */
export function menuFor(capabilities: readonly Capability[]): AdminMenuGroup[] {
  return ADMIN_MENU.map((group) => ({
    label: group.label,
    items: group.items.filter((item) => capabilities.includes(item.capability)),
  })).filter((group) => group.items.length > 0);
}
