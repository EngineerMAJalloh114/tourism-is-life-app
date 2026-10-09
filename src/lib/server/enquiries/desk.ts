/**
 * The enquiry desk (task A12, OPS-4). Reading an enquiry shows a visitor's
 * name, email, phone and message, so every read needs `enquiries.read`
 * (BOOKING_MANAGER, ADMIN, SUPER_ADMIN); changing status, assignee and notes
 * needs `enquiries.manage`; the CSV export needs `enquiries.export` (ADMIN,
 * SUPER_ADMIN) and is audited. Enquiries are never deleted here, and notes are
 * append-only.
 *
 * Statuses: 'open' is shown as New (it is what the public form writes, and is
 * left as it is), then in progress, quoted, closed.
 */
import { can } from "@/lib/capabilities";
import { createMailtoUrl, createWhatsAppUrl, normalizePhoneNumber } from "@/lib/contact";
import { toCsv } from "@/lib/csv";
import { inTransaction, type Sql } from "@/lib/sql";
import { adminOperation, type Actor } from "@/lib/server/access";
import { audit } from "@/lib/server/audit";
import { publicId } from "@/lib/server/crypto";
import { InvalidRequestError, NotFoundError } from "@/lib/server/errors";

export const ENQUIRY_STATUSES = ["open", "in_progress", "quoted", "closed"] as const;
export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];
export const STATUS_LABELS: Record<EnquiryStatus, string> = { open: "New", in_progress: "In progress", quoted: "Quoted", closed: "Closed" };

/** Labels for the fields the site's forms send; anything else is shown by its own name. */
const FIELD_LABELS: Record<string, string> = {
  name: "Name",
  contact: "Contact person",
  email: "Email",
  phone: "Phone",
  company: "Company",
  country: "Country",
  message: "Message",
  destination: "Preferred destination",
  destinations: "Destinations",
  dates: "Dates",
  travelers: "Travellers",
  volume: "Estimated volume",
  ship: "Ship",
  arrival: "Arrival",
  departureDate: "Departure",
  passengers: "Passengers",
  excursions: "Excursions",
  logistics: "Logistics",
  eventType: "Event type",
  attendees: "Attendees",
};

const humanise = (key: string) => FIELD_LABELS[key] ?? key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[-_]/g, " ").replace(/^./, (c) => c.toUpperCase());

export function parsePayload(payload: string): Record<string, string> {
  try {
    const value = JSON.parse(payload) as unknown;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, typeof v === "string" ? v : JSON.stringify(v)]));
    }
  } catch {
    // An unparseable payload is shown as the message itself.
  }
  return { message: payload };
}

/** Reply links: email with "Re: {ref}", and WhatsApp prefilled with the reference only when a phone number exists. */
export function replyLinks(ref: string, email: string | null, phone: string | null) {
  const digits = phone ? normalizePhoneNumber(phone) : "";
  return {
    email: email ? createMailtoUrl(email, `Re: ${ref}`) : null,
    whatsapp: digits.length >= 7 ? createWhatsAppUrl(digits, `Re: ${ref}`) : null,
  };
}

type Row = {
  id: string;
  type: string;
  payload: string;
  status: EnquiryStatus;
  guest_email: string | null;
  guest_name: string | null;
  created_at: string;
  assignee_id: string | null;
  assignee_email: string | null;
  status_changed_at: string | null;
};

export type EnquiryFilters = {
  q?: string;
  status?: EnquiryStatus;
  type?: string;
  /** "me", "none", or a team member's id. */
  assignee?: string;
};

function filterSql(sql: Sql, actor: Actor, f: EnquiryFilters) {
  const q = f.q?.trim().toLowerCase().slice(0, 100) || null;
  const pattern = q ? `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%` : null;
  const assignee = f.assignee === "me" ? actor.userId : f.assignee && f.assignee !== "none" ? f.assignee : null;
  return { pattern, status: f.status ?? null, type: f.type ?? null, assignee, unassigned: f.assignee === "none" };
}

async function fetchRows(sql: Sql, actor: Actor, f: EnquiryFilters, after: { ts: string; id: string } | null, limit: number) {
  const p = filterSql(sql, actor, f);
  return sql<Row>`
    select e.id, e.type, e.payload, e.status, e.guest_email, e.guest_name, e.created_at::text as created_at, e.assignee_id,
      u.email as assignee_email, e.status_changed_at::text as status_changed_at
    from enquiries e left join "user" u on u.id = e.assignee_id
    where (${p.status}::text is null or e.status = ${p.status})
      and (${p.type}::text is null or e.type = ${p.type})
      and (${p.assignee}::text is null or e.assignee_id = ${p.assignee})
      and (not ${p.unassigned} or e.assignee_id is null)
      and (${p.pattern}::text is null or lower(e.id) like ${p.pattern} or lower(coalesce(e.guest_email, '')) like ${p.pattern}
        or lower(coalesce(e.guest_name, '')) like ${p.pattern} or lower(e.payload) like ${p.pattern})
      and (${after?.ts ?? null}::timestamptz is null or (e.created_at, e.id) < (${after?.ts ?? null}::timestamptz, ${after?.id ?? ""}))
    order by e.created_at desc, e.id desc
    limit ${limit}
  `;
}

function summary(r: Row) {
  const fields = parsePayload(r.payload);
  return {
    id: r.id,
    createdAt: r.created_at,
    type: r.type,
    status: r.status,
    name: r.guest_name ?? fields.name ?? fields.contact ?? null,
    email: r.guest_email ?? fields.email ?? null,
    phone: fields.phone || null,
    assigneeId: r.assignee_id,
    assigneeEmail: r.assignee_email,
    preview: (fields.message ?? "").slice(0, 160),
  };
}

const encodeCursor = (r: Row) => Buffer.from(`${r.created_at}|${r.id}`, "utf8").toString("base64url");
function decodeCursor(cursor: string | undefined): { ts: string; id: string } | null {
  if (!cursor) return null;
  const text = Buffer.from(cursor, "base64url").toString("utf8");
  const at = text.lastIndexOf("|");
  if (at < 0 || Number.isNaN(Date.parse(text.slice(0, at)))) throw new InvalidRequestError("That page link is not valid.", "BAD_CURSOR");
  return { ts: text.slice(0, at), id: text.slice(at + 1) };
}

/** Newest first, keyset pages (stable while new enquiries arrive). */
export const listEnquiries = adminOperation(
  "enquiries.read",
  async (sql, actor, input: (EnquiryFilters & { cursor?: string; limit?: number }) | undefined) => {
    const limit = Math.min(Math.max(input?.limit ?? 30, 1), 100);
    const rows = await fetchRows(sql, actor, input ?? {}, decodeCursor(input?.cursor), limit + 1);
    const page = rows.slice(0, limit);
    return { rows: page.map(summary), nextCursor: rows.length > limit ? encodeCursor(page[page.length - 1]) : null };
  },
);

export const getEnquiry = adminOperation("enquiries.read", async (sql, _actor, input: { id: string }) => {
  const rows = await sql<Row>`
    select e.id, e.type, e.payload, e.status, e.guest_email, e.guest_name, e.created_at::text as created_at, e.assignee_id,
      u.email as assignee_email, e.status_changed_at::text as status_changed_at
    from enquiries e left join "user" u on u.id = e.assignee_id where e.id = ${input.id}
  `;
  const r = rows[0];
  if (!r) throw new NotFoundError("That enquiry does not exist.");
  const fields = parsePayload(r.payload);
  const notes = await sql<{ id: string; body: string; created_at: string; author_email: string | null }>`
    select n.id, n.body, n.created_at::text as created_at, u.email as author_email
    from enquiry_notes n left join "user" u on u.id = n.author_id
    where n.enquiry_id = ${r.id} order by n.created_at, n.id
  `;
  const base = summary(r);
  return {
    ...base,
    statusChangedAt: r.status_changed_at,
    fields: Object.entries(fields).map(([key, value]) => ({ key, label: humanise(key), value })),
    reply: replyLinks(r.id, base.email, base.phone),
    notes: notes.map((n) => ({ id: n.id, body: n.body, createdAt: n.created_at, author: n.author_email })),
  };
});

export const setEnquiryStatus = adminOperation(
  "enquiries.manage",
  async (sql, actor, input: { id: string; status: EnquiryStatus }) => {
    if (!(ENQUIRY_STATUSES as readonly string[]).includes(input.status)) throw new InvalidRequestError("Unknown status.", "BAD_STATUS");
    return inTransaction(sql, async (tx) => {
      const current = await tx<{ status: string }>`select status from enquiries where id = ${input.id} for update`;
      if (!current[0]) throw new NotFoundError("That enquiry does not exist.");
      await tx`
        update enquiries set status = ${input.status}, status_changed_at = now(), updated_at = now() where id = ${input.id}
      `;
      await audit(tx, {
        actor,
        action: "enquiry.status",
        entity: "enquiries",
        entityId: input.id,
        before: { status: current[0].status },
        after: { status: input.status },
      });
      return { ok: true as const };
    });
  },
);

/** Team members an enquiry can be assigned to: active, and allowed to read enquiries. */
export const listAssignees = adminOperation("enquiries.read", async (sql) => {
  const rows = await sql<{ user_id: string; role: string; email: string | null; name: string | null }>`
    select s.user_id, s.role, u.email, u.name from staff_profiles s join "user" u on u.id = s.user_id
    where s.status = 'active' order by u.name, u.email
  `;
  return rows.filter((r) => can(r.role, "enquiries.read")).map((r) => ({ id: r.user_id, email: r.email, name: r.name }));
});

export const assignEnquiry = adminOperation(
  "enquiries.manage",
  async (sql, actor, input: { id: string; assigneeId: string | null }) => {
    return inTransaction(sql, async (tx) => {
      const current = await tx<{ assignee_id: string | null }>`select assignee_id from enquiries where id = ${input.id} for update`;
      if (!current[0]) throw new NotFoundError("That enquiry does not exist.");
      if (input.assigneeId) {
        const staff = await tx<{ role: string; status: string }>`select role, status from staff_profiles where user_id = ${input.assigneeId}`;
        if (!staff[0] || staff[0].status !== "active" || !can(staff[0].role, "enquiries.read")) {
          throw new InvalidRequestError("Assign it to an active team member who can read enquiries.", "BAD_ASSIGNEE");
        }
      }
      await tx`update enquiries set assignee_id = ${input.assigneeId}, updated_at = now() where id = ${input.id}`;
      await audit(tx, {
        actor,
        action: "enquiry.assign",
        entity: "enquiries",
        entityId: input.id,
        before: { assigneeId: current[0].assignee_id },
        after: { assigneeId: input.assigneeId },
      });
      return { ok: true as const };
    });
  },
);

export const addEnquiryNote = adminOperation("enquiries.manage", async (sql, actor, input: { id: string; body: string }) => {
  const body = input.body.trim();
  if (!body || body.length > 4000) throw new InvalidRequestError("Write a note of up to 4,000 characters.", "BAD_NOTE");
  return inTransaction(sql, async (tx) => {
    const exists = await tx`select 1 from enquiries where id = ${input.id}`;
    if (!exists.length) throw new NotFoundError("That enquiry does not exist.");
    const id = publicId(10);
    await tx`insert into enquiry_notes (id, enquiry_id, author_id, body) values (${id}, ${input.id}, ${actor.userId}, ${body})`;
    await tx`update enquiries set updated_at = now() where id = ${input.id}`;
    await audit(tx, { actor, action: "enquiry.note", entity: "enquiries", entityId: input.id, before: null, after: { noteId: id, body } });
    return { id };
  });
});

export const EXPORT_LIMIT = 5000;

/** CSV of the enquiries matching the filters (at most EXPORT_LIMIT), formula-safe. The audit row records the filters and count, not the data. */
export const exportEnquiries = adminOperation("enquiries.export", async (sql, actor, input: EnquiryFilters | undefined) => {
  const rows = await fetchRows(sql, actor, input ?? {}, null, EXPORT_LIMIT);
  const header = ["Reference", "Received", "Type", "Status", "Name", "Email", "Phone", "Assigned to", "Message", "Other fields"];
  const lines = rows.map((r) => {
    const s = summary(r);
    const fields = parsePayload(r.payload);
    const { message: _m, name: _n, email: _e, phone: _p, contact: _c, ...other } = fields;
    return [
      s.id,
      s.createdAt,
      s.type,
      STATUS_LABELS[s.status] ?? s.status,
      s.name ?? "",
      s.email ?? "",
      s.phone ?? "",
      s.assigneeEmail ?? "",
      fields.message ?? "",
      Object.entries(other).map(([k, v]) => `${humanise(k)}: ${v}`).join("; "),
    ];
  });
  await inTransaction(sql, (tx) =>
    audit(tx, {
      actor,
      action: "enquiry.export",
      entity: "enquiries",
      entityId: "export",
      before: null,
      after: { filters: { q: input?.q ?? null, status: input?.status ?? null, type: input?.type ?? null, assignee: input?.assignee ?? null }, count: rows.length },
    }),
  );
  return { filename: `enquiries-${new Date().toISOString().slice(0, 10)}.csv`, csv: toCsv(header, lines), count: rows.length, capped: rows.length === EXPORT_LIMIT };
});
