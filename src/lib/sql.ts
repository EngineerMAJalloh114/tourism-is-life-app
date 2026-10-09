/**
 * The minimal SQL surface shared by Neon (`pg`) and PGLite, plus the wrapper
 * that turns a raw query runner into it. Lives apart from `db.ts` so tests can
 * build an isolated PGLite database (`src/lib/server/testing/test-db.ts`)
 * without importing the process-wide connection and its bootstrap side effects.
 *
 * Both the tagged-template and `.query()` forms resolve to an array of rows:
 *
 *   const rows = await sql`select * from todos where id = ${id}`; // parameterized
 *   const rows2 = await sql.query("select * from todos where id = $1", [id]);
 */
export interface Sql {
  <T = Record<string, unknown>>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T[]>;
  query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T[]>;
  /** Run `fn` in a single connection transaction. Nested calls reuse the same tx. */
  transaction<T>(fn: (tx: Sql) => Promise<T>): Promise<T>;
}

/**
 * A handle that is known to be inside a transaction. Only `inTransaction`
 * produces one, so a helper that takes `TxSql` (the audit writer, for example)
 * cannot be called on an autocommit connection by mistake.
 */
export type TxSql = Sql & { readonly __inTransaction: true };

/** Run `fn` in a transaction and hand it a `TxSql`. */
export function inTransaction<T>(sql: Sql, fn: (tx: TxSql) => Promise<T>): Promise<T> {
  return sql.transaction((tx) => fn(tx as TxSql));
}

export type Run = <T>(text: string, params: unknown[]) => Promise<T[]>;
export type Begin = (fn: (tx: Sql) => Promise<unknown>) => Promise<unknown>;

/** Wrap a query runner in the tagged-template + `.query()` `Sql` surface. */
export function toSql(run: Run, begin?: Begin): Sql {
  const sql = (async <T = Record<string, unknown>>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T[]> => {
    // Rebuild with $1, $2, … placeholders so values stay parameterized.
    let text = strings[0];
    for (let i = 0; i < values.length; i += 1) text += `$${i + 1}${strings[i + 1]}`;
    return run<T>(text, values);
  }) as unknown as Sql;
  sql.query = <T = Record<string, unknown>>(text: string, params: unknown[] = []) => run<T>(text, params);
  if (begin) {
    sql.transaction = async <T>(fn: (tx: Sql) => Promise<T>) => (await begin(fn)) as T;
  } else {
    sql.transaction = async (fn) => fn(sql);
  }
  return sql;
}

/**
 * Result-type parity: Postgres sends every value as text plus a type OID — the
 * JS value is the DRIVER's parsing choice, and pg and PGLite disagree (pg:
 * int8 -> string, date -> local-midnight Date; PGLite: int8 -> BigInt, which
 * JSON.stringify rejects, date -> UTC Date). Both drivers are configured with
 * these parsers so preview, tests and production return identical shapes:
 *   int8/bigint (incl. count(*)) -> number (past 2^53 loses precision — cast
 *                                   `::text` if you ever need huge integers)
 *   date                         -> 'YYYY-MM-DD' string
 *   interval                     -> Postgres interval text
 * numeric already comes back as a string on both (arbitrary precision).
 */
export const OID_INT8 = 20;
export const OID_DATE = 1082;
export const OID_INTERVAL = 1186;
export const identity = (v: string) => v;

/** The PGLite parser table matching the pg type parsers above. */
export const PGLITE_PARSERS = {
  [OID_INT8]: Number,
  [OID_DATE]: identity,
  [OID_INTERVAL]: identity,
};

/** Minimal structural type for a PGLite instance (avoids importing the package here). */
export interface PgliteLike {
  query<T>(text: string, params?: unknown[]): Promise<{ rows: T[] }>;
  transaction<T>(fn: (tx: { query<R>(text: string, params?: unknown[]): Promise<{ rows: R[] }> }) => Promise<T>): Promise<T>;
}

/** Wrap a PGLite instance in the `Sql` surface (used by db.ts and the test database). */
export function sqlFromPglite(pg: PgliteLike): Sql {
  return toSql(
    async <T>(text: string, params: unknown[]) => {
      const result = await pg.query<T>(text, params);
      return result.rows;
    },
    async (fn) => {
      return pg.transaction(async (tx) => {
        const txRun: Run = async <T>(text: string, params: unknown[]) => {
          const result = await tx.query<T>(text, params);
          return result.rows;
        };
        const txSql = toSql(txRun, (inner) => inner(txSql));
        return fn(txSql);
      });
    },
  );
}
