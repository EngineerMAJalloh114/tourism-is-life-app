/**
 * Site settings (task A7): one draft, published versions, history of 30.
 *
 * Saving a draft and publishing both carry the `rev` the editor loaded, so two
 * people editing at once cannot silently overwrite each other. Publishing
 * copies the checked draft into a new version; restoring publishes a new
 * version holding an older one's data. Every change is audited with before
 * and after. `settings.edit` (ADMIN and SUPER_ADMIN) covers all of it.
 *
 * `enquiryRecipients` is the one read used outside the admin in this
 * milestone: the enquiry notification sends to the published list, and falls
 * back to `ENQUIRY_TEAM_EMAILS` if the list cannot be read, so a settings
 * problem can never stop the desk hearing about an enquiry.
 */
import { parseSettings, SettingsInvalid, type SiteSettings } from "@/lib/settings/schema";
import { ENQUIRY_TEAM_EMAILS } from "@/lib/site";
import { inTransaction, type Sql, type TxSql } from "@/lib/sql";
import { adminOperation } from "@/lib/server/access";
import { audit } from "@/lib/server/audit";
import { publicId } from "@/lib/server/crypto";
import { ConflictError, InvalidRequestError, NotFoundError } from "@/lib/server/errors";

export const KEEP_VERSIONS = 30;
export const STALE_MESSAGE = "Someone else saved the settings. Reload to see their changes.";

type Row = { draft: unknown; rev: number; published_version_id: string | null };

const parseJson = <T>(v: unknown): T => (typeof v === "string" ? JSON.parse(v) : v) as T;

async function lockRow(tx: TxSql): Promise<Row> {
  const rows = await tx<Row>`select draft, rev, published_version_id from site_settings where id = 'site' for update`;
  if (!rows[0]) throw new NotFoundError("The site settings have not been set up. Run the migrations.");
  return rows[0];
}

function checked(data: unknown): SiteSettings {
  try {
    return parseSettings(data);
  } catch (e) {
    if (e instanceof SettingsInvalid) throw new InvalidRequestError(e.message, "SETTINGS_INVALID");
    throw e;
  }
}

function assertRev(row: Row, rev: number) {
  if (row.rev !== rev) throw new ConflictError(STALE_MESSAGE, "STALE");
}

async function publishVersion(tx: TxSql, data: SiteSettings, publishedBy: string, restoredFrom: string | null) {
  const last = await tx<{ v: number }>`select coalesce(max(version), 0)::int as v from site_settings_versions where settings_id = 'site'`;
  const version = (last[0]?.v ?? 0) + 1;
  const id = `ssv_${publicId(8)}`;
  await tx`
    insert into site_settings_versions (id, settings_id, version, data, published_by, restored_from)
    values (${id}, 'site', ${version}, ${JSON.stringify(data)}::jsonb, ${publishedBy}, ${restoredFrom})
  `;
  // Keep the newest KEEP_VERSIONS; the one being published is always among them.
  await tx`
    delete from site_settings_versions
    where settings_id = 'site' and version <= ${version - KEEP_VERSIONS}
  `;
  return { id, version };
}

export type SettingsView = {
  draft: SiteSettings;
  rev: number;
  published: SiteSettings | null;
  publishedVersion: number | null;
  draftDiffers: boolean;
  versions: { id: string; version: number; publishedAt: string; publishedBy: string | null; restoredFrom: string | null; current: boolean }[];
};

export const getSiteSettings = adminOperation("settings.edit", async (sql): Promise<SettingsView> => {
  const rows = await sql<Row>`select draft, rev, published_version_id from site_settings where id = 'site'`;
  const row = rows[0];
  if (!row) throw new NotFoundError("The site settings have not been set up. Run the migrations.");
  const versions = await sql<{ id: string; version: number; published_at: string; published_by: string | null; restored_from: string | null; data: unknown }>`
    select id, version, published_at::text as published_at, published_by, restored_from, data
    from site_settings_versions where settings_id = 'site' order by version desc
  `;
  const current = versions.find((v) => v.id === row.published_version_id);
  const draft = parseJson<SiteSettings>(row.draft);
  const published = current ? parseJson<SiteSettings>(current.data) : null;
  return {
    draft,
    rev: row.rev,
    published,
    publishedVersion: current?.version ?? null,
    draftDiffers: JSON.stringify(draft) !== JSON.stringify(published),
    versions: versions.map((v) => ({
      id: v.id,
      version: v.version,
      publishedAt: v.published_at,
      publishedBy: v.published_by,
      restoredFrom: v.restored_from,
      current: v.id === row.published_version_id,
    })),
  };
});

/** Save the draft (checked the same way a publish is). */
export const saveSiteSettingsDraft = adminOperation(
  "settings.edit",
  async (sql, actor, input: { rev: number; data: unknown }) => {
    const data = checked(input.data);
    return inTransaction(sql, async (tx) => {
      const row = await lockRow(tx);
      assertRev(row, input.rev);
      await tx`
        update site_settings set draft = ${JSON.stringify(data)}::jsonb, rev = rev + 1, updated_at = now(), updated_by = ${actor.userId}
        where id = 'site'
      `;
      await audit(tx, {
        actor,
        action: "settings.save",
        entity: "site_settings",
        entityId: "site",
        before: parseJson<SiteSettings>(row.draft),
        after: data,
      });
      return { rev: row.rev + 1 };
    });
  },
);

/** Publish the saved draft as a new version. */
export const publishSiteSettings = adminOperation("settings.edit", async (sql, actor, input: { rev: number }) => {
  return inTransaction(sql, async (tx) => {
    const row = await lockRow(tx);
    assertRev(row, input.rev);
    const data = checked(parseJson(row.draft));
    const before = row.published_version_id
      ? await tx<{ data: unknown; version: number }>`select data, version from site_settings_versions where id = ${row.published_version_id}`
      : [];
    const { id, version } = await publishVersion(tx, data, actor.userId, null);
    await tx`update site_settings set published_version_id = ${id}, rev = rev + 1, updated_at = now(), updated_by = ${actor.userId} where id = 'site'`;
    await audit(tx, {
      actor,
      action: "settings.publish",
      entity: "site_settings",
      entityId: "site",
      before: before[0] ? { version: before[0].version, data: parseJson(before[0].data) } : null,
      after: { version, data },
    });
    return { rev: row.rev + 1, version };
  });
});

/** Publish an older version's data again as a new version; the draft becomes that data too. */
export const restoreSiteSettingsVersion = adminOperation(
  "settings.edit",
  async (sql, actor, input: { versionId: string; rev: number }) => {
    return inTransaction(sql, async (tx) => {
      const row = await lockRow(tx);
      assertRev(row, input.rev);
      const old = await tx<{ data: unknown; version: number }>`
        select data, version from site_settings_versions where id = ${input.versionId} and settings_id = 'site'
      `;
      if (!old[0]) throw new NotFoundError("That version is no longer kept.");
      const data = checked(parseJson(old[0].data));
      const { id, version } = await publishVersion(tx, data, actor.userId, input.versionId);
      await tx`
        update site_settings set draft = ${JSON.stringify(data)}::jsonb, published_version_id = ${id}, rev = rev + 1,
          updated_at = now(), updated_by = ${actor.userId}
        where id = 'site'
      `;
      await audit(tx, {
        actor,
        action: "settings.restore",
        entity: "site_settings",
        entityId: "site",
        before: { draft: parseJson(row.draft), publishedVersionId: row.published_version_id },
        after: { version, restoredFromVersion: old[0].version, data },
      });
      return { rev: row.rev + 1, version };
    });
  },
);

/** The published settings, or null when none can be read. Never throws. */
export async function publishedSiteSettings(sql: Sql): Promise<SiteSettings | null> {
  try {
    const rows = await sql<{ data: unknown }>`
      select v.data from site_settings s join site_settings_versions v on v.id = s.published_version_id where s.id = 'site'
    `;
    return rows[0] ? parseSettings(parseJson(rows[0].data)) : null;
  } catch {
    return null;
  }
}

/** Who receives enquiry notifications: the published list, or the code's list if it cannot be read. */
export async function enquiryRecipients(sql: Sql): Promise<{ recipients: readonly string[]; source: "settings" | "code" }> {
  const settings = await publishedSiteSettings(sql);
  if (settings && settings.enquiryRecipients.length > 0) return { recipients: settings.enquiryRecipients, source: "settings" };
  return { recipients: ENQUIRY_TEAM_EMAILS, source: "code" };
}

