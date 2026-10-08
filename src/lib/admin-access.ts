/**
 * Client-safe helpers for admin pages. The server functions are what protect
 * data; these only decide which page or menu item to show.
 */
import type { Capability } from "@/lib/capabilities";

export type PageAccess = { signedIn: boolean; capabilities: readonly Capability[] };

/** Thrown from an admin page's `beforeLoad` when the account lacks the page's capability. */
export class AdminPageForbidden extends Error {
  readonly status = 403;
  constructor() {
    super("Your account does not have access to this page.");
    this.name = "AdminPageForbidden";
  }
}

export function hasCapability(access: PageAccess | undefined, capability: Capability): boolean {
  return Boolean(access?.capabilities.includes(capability));
}

/** Use in an admin child route's `beforeLoad`. */
export function requirePageCapability(access: PageAccess | undefined, capability: Capability): void {
  if (!hasCapability(access, capability)) throw new AdminPageForbidden();
}
