import { SITE } from "../lib/site.ts";
import { log } from "../lib/server/logger.ts";

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

/** Strips CR/LF and other control characters so user input can never smuggle extra email headers. */
export function sanitizeHeaderValue(value: string): string {
  return value.replace(/[\r\n\0]+/g, " ").trim();
}

const EMAIL_RE = /^[^\s@<>"]+@[^\s@<>",]+\.[^\s@<>",]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

/** Resend must never hang a request indefinitely — the visitor's enquiry is already saved by the time this runs. */
const RESEND_TIMEOUT_MS = 8000;

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}): Promise<NotifyResult> {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    return { sent: false, channel: "email", reason: "RESEND_API_KEY not configured" };
  }
  const from = process.env.RESEND_FROM?.trim() || `Tourism Is Life <${SITE.email}>`;
  const replyTo =
    opts.replyTo && isValidEmail(opts.replyTo) ? sanitizeHeaderValue(opts.replyTo) : undefined;
  let res: Response;
  try {
    res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [opts.to],
        subject: sanitizeHeaderValue(opts.subject).slice(0, 200),
        html: opts.html,
        text: opts.text,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
      signal: AbortSignal.timeout(RESEND_TIMEOUT_MS),
    });
  } catch (err) {
    const timedOut = err instanceof Error && err.name === "TimeoutError";
    return { sent: false, channel: "email", reason: timedOut ? "Resend request timed out" : "Resend request failed" };
  }
  if (!res.ok) {
    // Never surface the raw Resend response body — it can echo request details.
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
  const result = await sendEmail({
    to: opts.email,
    subject: `We received your ${opts.type} enquiry ${opts.ref}`,
    html: `<p>Dear ${escapeHtml(opts.name || "friend")},</p><p>Your ${escapeHtml(opts.type)} enquiry ${escapeHtml(opts.ref)} is with the Freetown desk.</p>`,
    text: `Enquiry ${opts.ref} received.`,
  });
  if (!result.sent) {
    log.warn("enquiry.receipt_failed", { ref: opts.ref, reason: result.reason });
  }
  return result;
}

const ENQUIRY_TYPE_LABELS: Record<string, string> = {
  B2C: "Traveller enquiry",
  B2B: "Partner / operator enquiry",
  CRUISE: "Cruise enquiry",
  MICE: "MICE / event enquiry",
};

/** Human-readable labels for known enquiry-form field names. Unknown keys fall back to a humanized form. */
const FIELD_LABELS: Record<string, string> = {
  name: "Name",
  contact: "Contact person",
  company: "Company",
  volume: "Estimated volume",
  destinations: "Destinations of interest",
  destination: "Preferred destination",
  ship: "Ship name",
  arrival: "Arrival date & time",
  passengers: "Passenger count",
  excursions: "Shore excursion requirements",
  logistics: "Logistics notes",
  eventType: "Event type",
  attendees: "Attendees",
  dates: "Dates",
  travelers: "Number of travelers",
  context: "Regarding",
};

function humanizeFieldName(key: string): string {
  return FIELD_LABELS[key] ?? key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase());
}

/**
 * Builds the internal notification email sent to the Tourism Is Life desk for a
 * new enquiry. Only renders fields that are actually present in `payload` —
 * never invents fields the form didn't collect.
 */
export function buildEnquiryTeamEmail(opts: {
  ref: string;
  type: string;
  email: string;
  phone?: string;
  submittedAt: Date;
  payload: Record<string, string>;
}) {
  const typeLabel = ENQUIRY_TYPE_LABELS[opts.type] ?? `${opts.type} enquiry`;
  // Fields shown as fixed rows above, or the message body below — omitted from the generic list.
  const { email: _email, message, phone: payloadPhone, name: _name, contact: _contact, ...rest } =
    opts.payload;
  const phone = (opts.phone || payloadPhone || "").trim();
  const submittedAt = opts.submittedAt.toISOString().replace("T", " ").slice(0, 19) + " UTC";

  const rows: Array<[string, string]> = [];
  for (const [key, value] of Object.entries(rest)) {
    const trimmed = value?.trim();
    if (!trimmed) continue;
    rows.push([humanizeFieldName(key), trimmed]);
  }

  const htmlRows = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#6b7280;white-space:nowrap;vertical-align:top;">${escapeHtml(label)}</td><td style="padding:4px 0;">${escapeHtml(value)}</td></tr>`,
    )
    .join("");

  const html = `
    <div style="font-family:Georgia,serif;color:#1f2a1f;max-width:560px;">
      <p style="text-transform:uppercase;letter-spacing:0.08em;font-size:12px;color:#b08d2b;margin:0 0 8px;">Tourism Is Life website</p>
      <h2 style="margin:0 0 16px;">New ${escapeHtml(typeLabel.toLowerCase())}</h2>
      <table style="border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:4px 12px 4px 0;color:#6b7280;white-space:nowrap;vertical-align:top;">Name</td><td style="padding:4px 0;">${escapeHtml(opts.payload.name || opts.payload.contact || "Not supplied")}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#6b7280;white-space:nowrap;vertical-align:top;">Email</td><td style="padding:4px 0;"><a href="mailto:${escapeHtml(opts.email)}">${escapeHtml(opts.email)}</a></td></tr>
        ${phone ? `<tr><td style="padding:4px 12px 4px 0;color:#6b7280;white-space:nowrap;vertical-align:top;">Phone</td><td style="padding:4px 0;">${escapeHtml(phone)}</td></tr>` : ""}
        ${htmlRows}
      </table>
      ${message?.trim() ? `<p style="margin:16px 0 4px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.06em;">Message</p><p style="white-space:pre-wrap;margin:0;">${escapeHtml(message.trim())}</p>` : ""}
      <p style="margin-top:20px;font-size:12px;color:#6b7280;">Ref ${escapeHtml(opts.ref)} · Submitted ${escapeHtml(submittedAt)} · Reply-To is set to the visitor's email.</p>
    </div>
  `;

  const textLines = [
    `New ${typeLabel} — Tourism Is Life website`,
    `Name: ${opts.payload.name || opts.payload.contact || "Not supplied"}`,
    `Email: ${opts.email}`,
    ...(phone ? [`Phone: ${phone}`] : []),
    ...rows.map(([label, value]) => `${label}: ${value}`),
    ...(message?.trim() ? ["", "Message:", message.trim()] : []),
    "",
    `Ref ${opts.ref} · Submitted ${submittedAt}`,
  ];

  return {
    subject: `New ${typeLabel} — ${opts.ref}`,
    html,
    text: textLines.join("\n"),
  };
}

/** Notifies the Tourism Is Life desk of a new enquiry. Reply-To is the visitor's own email. */
export async function notifyEnquiryTeam(opts: {
  ref: string;
  type: string;
  email: string;
  phone?: string;
  payload: Record<string, string>;
}) {
  const { subject, html, text } = buildEnquiryTeamEmail({
    ref: opts.ref,
    type: opts.type,
    email: opts.email,
    phone: opts.phone,
    submittedAt: new Date(),
    payload: opts.payload,
  });
  const result = await sendEmail({
    to: SITE.email,
    subject,
    html,
    text,
    replyTo: opts.email,
  });
  if (result.sent) {
    log.info("enquiry.team_notification_sent", { ref: opts.ref, id: result.id });
  } else {
    log.warn("enquiry.team_notification_failed", { ref: opts.ref, reason: result.reason });
  }
  return result;
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
