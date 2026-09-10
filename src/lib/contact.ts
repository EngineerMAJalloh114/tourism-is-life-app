export function normalizePhoneNumber(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function createTelUrl(phone: string): string {
  const normalized = normalizePhoneNumber(phone);
  return `tel:+${normalized}`;
}

export function createSmsUrl(phone: string): string {
  const normalized = normalizePhoneNumber(phone);
  return `sms:+${normalized}`;
}

export function createWhatsAppUrl(phone: string, message?: string): string {
  const normalized = normalizePhoneNumber(phone);
  const url = new URL(`https://wa.me/${normalized}`);
  if (message && message.trim()) {
    url.searchParams.set("text", message.trim());
  }
  return url.toString();
}

export function createGmailComposeUrl(email: string, subject?: string): string {
  const url = new URL("https://mail.google.com/mail/");
  url.searchParams.set("view", "cm");
  url.searchParams.set("fs", "1");
  url.searchParams.set("to", email);
  if (subject && subject.trim()) {
    url.searchParams.set("su", subject.trim());
  }
  return url.toString();
}

export function createMailtoUrl(email: string, subject?: string): string {
  const url = new URL("mailto:" + email);
  if (subject && subject.trim()) {
    url.searchParams.set("subject", subject.trim());
  }
  return url.toString();
}
