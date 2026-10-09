/** A JSON value (what a jsonb column holds and what a server function can return). */
export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
