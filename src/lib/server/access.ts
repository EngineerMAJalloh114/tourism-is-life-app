/**
 * Who is calling an admin operation, and whether they may.
 *
 * Every admin operation is built with `adminOperation(capability, fn)`, which
 * checks the capability before `fn` runs. The staff middleware resolves the
 * `Actor` from the session; the operation re-checks the capability itself, so
 * the rule holds even if an operation is called from somewhere new, and the
 * check can be tested on PGLite for every role without an HTTP layer.
 *
 * No server-only imports here: the logic modules that use this run in tests
 * under plain `node --test`.
 */
import { can, type Capability, type StaffRole } from "@/lib/capabilities";
import type { Sql } from "@/lib/sql";
import { AuthRequiredError, ForbiddenError } from "@/lib/server/errors";

export type StaffStatus = "active" | "disabled" | "removed";

/** A signed-in team member with an active staff profile. */
export type Actor = {
  userId: string;
  email: string | null;
  role: StaffRole;
};

/** Throws 401 when there is no actor and 403 when the actor lacks `capability`. */
export function requireCapability(actor: Actor | null | undefined, capability: Capability): asserts actor is Actor {
  if (!actor) throw new AuthRequiredError();
  if (!can(actor.role, capability)) throw new ForbiddenError();
}

/** An admin operation: `(sql, actor, input) => result`, with its capability attached. */
export type AdminOperation<I, O> = ((sql: Sql, actor: Actor | null, input: I) => Promise<O>) & {
  readonly capability: Capability;
};

/**
 * Build an admin operation. The capability check runs first, before any query,
 * so a refused caller never touches the database.
 */
export function adminOperation<I, O>(
  capability: Capability,
  fn: (sql: Sql, actor: Actor, input: I) => Promise<O>,
): AdminOperation<I, O> {
  const op = async (sql: Sql, actor: Actor | null, input: I) => {
    requireCapability(actor, capability);
    return fn(sql, actor, input);
  };
  return Object.assign(op, { capability });
}

export function isAdminOperation(value: unknown): value is AdminOperation<unknown, unknown> {
  return typeof value === "function" && typeof (value as { capability?: unknown }).capability === "string";
}
