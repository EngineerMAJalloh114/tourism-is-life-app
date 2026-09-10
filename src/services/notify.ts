/**
 * Outbound email (Resend) and SMS (Twilio).
 * Never fakes a live send. Without credentials the call is a documented no-op.
 */

export type NotifyResult =
  | { sent: true; channel: "email" | "sms"; id?: string }
  | { sent: false; channel: "email" | "sms"; reason: string };

export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export function smsConfigured() {
  return Boolean(process.env.TWILIO_ACCOUNT_SID?.trim() && process.env.TWILIO_AUTH_TOKEN?.trim());
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<NotifyResult> {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    return { sent: false, channel: "email", reason: "RESEND_API_KEY not configured" };
  }
  const from = process.env.RESEND_FROM?.trim() || "Tourism Is Life <bookings@tourismislife.com>";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    }),
  });
  if (!res.ok) {
    return { sent: false, channel: "email", reason: `Resend ${res.status}` };
  }
  const json = (await res.json()) as { id?: string };
  return { sent: true, channel: "email", id: json.id };
}

export async function sendSms(opts: { to: string; body: string }): Promise<NotifyResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_FROM?.trim();
  if (!sid || !token || !from) {
    return { sent: false, channel: "sms", reason: "Twilio credentials not configured" };
  }
  const params = new URLSearchParams({ To: opts.to, From: from, Body: opts.body });
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });
  if (!res.ok) {
    return { sent: false, channel: "sms", reason: `Twilio ${res.status}` };
  }
  const json = (await res.json()) as { sid?: string };
  return { sent: true, channel: "sms", id: json.sid };
}

export async function notifyBookingConfirmed(opts: {
  email: string;
  name: string;
  bookingId: string;
  tourTitle: string;
  travelDate: string;
  voucher: string;
  phone?: string | null;
}) {
  const html = `
    <p>Dear ${escapeHtml(opts.name || "traveller")},</p>
    <p>Your booking <strong>${escapeHtml(opts.bookingId)}</strong> for <strong>${escapeHtml(opts.tourTitle)}</strong>
    on ${escapeHtml(opts.travelDate)} is confirmed.</p>
    <p>Voucher: <strong>${escapeHtml(opts.voucher)}</strong></p>
    <p>Tourism Is Life · Freetown</p>
  `;
  const email = await sendEmail({
    to: opts.email,
    subject: `Booking confirmed ${opts.bookingId} · Tourism Is Life`,
    html,
    text: `Booking ${opts.bookingId} confirmed. Voucher ${opts.voucher}.`,
  });
  let sms: NotifyResult | undefined;
  if (opts.phone) {
    sms = await sendSms({
      to: opts.phone,
      body: `Tourism Is Life: booking ${opts.bookingId} confirmed. Voucher ${opts.voucher}.`,
    });
  }
  return { email, sms };
}

export async function notifyEnquiryReceived(opts: { email: string; name: string; ref: string; type: string }) {
  return sendEmail({
    to: opts.email,
    subject: `We received your ${opts.type} enquiry ${opts.ref}`,
    html: `<p>Dear ${escapeHtml(opts.name || "friend")},</p><p>Your ${escapeHtml(opts.type)} enquiry ${escapeHtml(opts.ref)} is with the Freetown desk.</p>`,
    text: `Enquiry ${opts.ref} received.`,
  });
}

const HTML_ESCAPES: Record<string, string> = {
  "&": "\u0026amp;",
  "<": "\u0026lt;",
  ">": "\u0026gt;",
  '"': "\u0026quot;",
  "'": "\u0026#39;",
};

export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch] ?? ch);
}
