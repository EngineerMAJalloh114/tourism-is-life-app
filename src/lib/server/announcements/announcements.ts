/**
 * Announcements (task A11): a plain-text message of up to 200 characters, an
 * optional link, a start and an optional end. `announcements.edit`
 * (CONTENT_MANAGER, ADMIN, SUPER_ADMIN) covers editing and publishing. They
 * are archived, never deleted. The public site shows `activeAnnouncement`
 * from task B5.
 */
import { inTransaction, type Sql, type TxSql } from "@/lib/sql";
import { adminOperation } from "@/lib/server/access";
import { audit } from "@/lib/server/audit";
import { publicId } from "@/lib/server/crypto";
import { ConflictError, InvalidRequestError, NotFoundError } from "@/lib/server/errors";

export const MAX_MESSAGE = 200;
type Status = "draft" | "published" | "archived";

type Row = {
  id: string;
  message: string;
  link_label: string;
  link: string;
  starts_at: string;
  ends_at: string | null;
  status: Status;
};

export type Announcement = {
  id: string;
  message: string;
  linkLabel: string;
  link: string;
  startsAt: string;
  endsAt: string | null;
  status: Status;
};

const view = (r: Row): Announcement => ({
  id: r.id,
  message: r.message,
  linkLabel: r.link_label,
  link: r.link,
  startsAt: new Date(r.starts_at).toISOString(),
  endsAt: r.ends_at ? new Date(r.ends_at).toISOString() : null,
  status: r.status,
});

/** A site path ("/tours") or an https link. Anything else is refused. */
export function safeLink(link: string): boolean {
  if (link === "") return true;
  if (/^https:\/\/[^\s]+$/i.test(link)) return true;
  return /^\/(?!\/)[^\s]*$/.test(link);
}

export type AnnouncementInput = { message: string; linkLabel?: string; link?: string; startsAt: string; endsAt?: string | null };

function check(input: AnnouncementInput) {
  // Plain text only: line breaks become spaces, and nothing is interpreted as markup.
  const message = input.message.replace(/\s+/g, " ").trim();
  if (!message) throw new InvalidRequestError("Write the message.", "EMPTY_MESSAGE");
  if (message.length > MAX_MESSAGE) throw new InvalidRequestError(`Keep the message to ${MAX_MESSAGE} characters.`, "MESSAGE_TOO_LONG");
  const link = (input.link ?? "").trim();
  if (!safeLink(link)) throw new InvalidRequestError("The link must be a site path such as /tours or start with https://", "BAD_LINK");
  const linkLabel = (input.linkLabel ?? "").replace(/\s+/g, " ").trim().slice(0, 40);
  if (link && !linkLabel) throw new InvalidRequestError("Give the link a short label.", "LINK_LABEL");
  const startsAt = Date.parse(input.startsAt);
  if (Number.isNaN(startsAt)) throw new InvalidRequestError("Choose when it starts.", "BAD_START");
  const endsAt = input.endsAt ? Date.parse(input.endsAt) : null;
  if (endsAt !== null && (Number.isNaN(endsAt) || endsAt <= startsAt)) throw new InvalidRequestError("It must end after it starts.", "BAD_END");
  return {
    message,
    link,
    linkLabel: link ? linkLabel : "",
    startsAt: new Date(startsAt).toISOString(),
    endsAt: endsAt === null ? null : new Date(endsAt).toISOString(),
  };
}

async function lock(tx: TxSql, id: string): Promise<Row> {
  const rows = await tx<Row>`
    select id, message, link_label, link, starts_at::text as starts_at, ends_at::text as ends_at, status
    from announcements where id = ${id} for update
  `;
  if (!rows[0]) throw new NotFoundError("That announcement does not exist.");
  return rows[0];
}

export const listAnnouncements = adminOperation("announcements.edit", async (sql) => {
  const rows = await sql<Row>`
    select id, message, link_label, link, starts_at::text as starts_at, ends_at::text as ends_at, status
    from announcements order by (status = 'archived'), starts_at desc, created_at desc limit 200
  `;
  return rows.map(view);
});

export const createAnnouncement = adminOperation("announcements.edit", async (sql, actor, input: AnnouncementInput) => {
  const a = check(input);
  return inTransaction(sql, async (tx) => {
    const id = publicId(12);
    await tx`
      insert into announcements (id, message, link_label, link, starts_at, ends_at, created_by, updated_by)
      values (${id}, ${a.message}, ${a.linkLabel}, ${a.link}, ${a.startsAt}, ${a.endsAt}, ${actor.userId}, ${actor.userId})
    `;
    await audit(tx, { actor, action: "announcement.create", entity: "announcements", entityId: id, before: null, after: a });
    return { id };
  });
});

export const updateAnnouncement = adminOperation("announcements.edit", async (sql, actor, input: AnnouncementInput & { id: string }) => {
  const a = check(input);
  return inTransaction(sql, async (tx) => {
    const row = await lock(tx, input.id);
    if (row.status === "archived") throw new ConflictError("An archived announcement is not edited. Add a new one.", "ARCHIVED");
    await tx`
      update announcements set message = ${a.message}, link_label = ${a.linkLabel}, link = ${a.link}, starts_at = ${a.startsAt},
        ends_at = ${a.endsAt}, updated_at = now(), updated_by = ${actor.userId}
      where id = ${row.id}
    `;
    const before = view(row);
    await audit(tx, {
      actor,
      action: "announcement.update",
      entity: "announcements",
      entityId: row.id,
      before: { message: before.message, linkLabel: before.linkLabel, link: before.link, startsAt: before.startsAt, endsAt: before.endsAt, status: before.status },
      after: { ...a, status: row.status },
    });
    return { id: row.id };
  });
});

/** Publish, take back to a draft, or archive. */
export const setAnnouncementStatus = adminOperation(
  "announcements.edit",
  async (sql, actor, input: { id: string; status: Status }) => {
    if (!["draft", "published", "archived"].includes(input.status)) throw new InvalidRequestError("Unknown status.", "BAD_STATUS");
    return inTransaction(sql, async (tx) => {
      const row = await lock(tx, input.id);
      if (row.status === "archived") throw new ConflictError("An archived announcement stays archived.", "ARCHIVED");
      if (row.status === input.status) return { id: row.id, status: row.status };
      await tx`
        update announcements set status = ${input.status},
          published_at = case when ${input.status}::text = 'published' then now() else published_at end,
          archived_at = case when ${input.status}::text = 'archived' then now() else archived_at end,
          updated_at = now(), updated_by = ${actor.userId}
        where id = ${row.id}
      `;
      await audit(tx, { actor, action: `announcement.${input.status === "published" ? "publish" : input.status === "archived" ? "archive" : "unpublish"}`, entity: "announcements", entityId: row.id, before: { status: row.status }, after: { status: input.status } });
      return { id: row.id, status: input.status };
    });
  },
);

/**
 * The announcement to show at `now`: published, started, not ended, and the
 * latest start when several overlap (then the newest). Null when none.
 */
export async function activeAnnouncement(sql: Sql, now: Date = new Date()): Promise<Announcement | null> {
  const at = now.toISOString();
  const rows = await sql<Row>`
    select id, message, link_label, link, starts_at::text as starts_at, ends_at::text as ends_at, status
    from announcements
    where status = 'published' and starts_at <= ${at}::timestamptz and (ends_at is null or ends_at > ${at}::timestamptz)
    order by starts_at desc, created_at desc
    limit 1
  `;
  return rows[0] ? view(rows[0]) : null;
}
