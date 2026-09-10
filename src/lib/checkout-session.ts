const KEY = "til-checkout";

export type CheckoutHandle = { id: string; token: string; tourSlug: string };

export function storeCheckout(handle: CheckoutHandle) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(handle));
    sessionStorage.setItem(`til-booking:${handle.id}`, handle.token);
  } catch {
    /* ignore quota */
  }
}

export function readCheckout(id?: string): CheckoutHandle | null {
  try {
    if (id) {
      const token = sessionStorage.getItem(`til-booking:${id}`);
      if (token) return { id, token, tourSlug: "" };
    }
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CheckoutHandle;
    if (!parsed.id || !parsed.token) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function checkoutPath(id: string, token: string, step: string) {
  const q = new URLSearchParams({ t: token });
  return `/checkout/${encodeURIComponent(id)}/${step}?${q.toString()}`;
}
