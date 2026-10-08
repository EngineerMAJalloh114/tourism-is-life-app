/**
 * An isolated, fully migrated in-memory PGLite database for tests.
 *
 * Each call gets its own database, so tests never share state and never reach
 * a real database (DATABASE_URL is not read here).
 */
import { applyMigrations, createPglite, listMigrations } from "../../../../scripts/migration-check.mjs";
import { sqlFromPglite, type Sql } from "@/lib/sql";
import type { StaffRole } from "@/lib/capabilities";
import type { Actor, StaffStatus } from "@/lib/server/access";

export type TestDb = { sql: Sql; close: () => Promise<void> };

export async function createTestDb(): Promise<TestDb> {
  const pg = await createPglite();
  await applyMigrations(pg, await listMigrations());
  return { sql: sqlFromPglite(pg), close: () => pg.close() };
}

/** Insert a Better Auth user row (no password) and return its id. */
export async function insertUser(sql: Sql, id: string, email = `${id}@example.test`, name = id): Promise<string> {
  await sql`
    insert into "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
    values (${id}, ${name}, ${email}, ${true}, now(), now())
  `;
  return id;
}

/** Insert a user with a staff profile and return the matching `Actor`. */
export async function insertStaff(
  sql: Sql,
  id: string,
  role: StaffRole,
  status: StaffStatus = "active",
): Promise<Actor> {
  await insertUser(sql, id);
  await sql`insert into staff_profiles (user_id, role, status) values (${id}, ${role}, ${status})`;
  return { userId: id, email: `${id}@example.test`, role };
}

/** An `Sql` that fails the test if any query runs (proves a refusal happened first). */
export function forbiddenSql(): Sql {
  const fail = async () => {
    throw new Error("a refused caller reached the database");
  };
  const sql = fail as unknown as Sql;
  sql.query = fail;
  sql.transaction = fail;
  return sql;
}
