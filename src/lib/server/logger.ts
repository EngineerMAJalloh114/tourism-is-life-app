const SECRET = /password|passwd|token|secret|authorization|cookie|set-cookie|card|cvv|cvc|pan|otp|bearer/i;
const PII = /email|phone|guest_email|guest_phone|guest_name/i;

function redactValue(key: string, value: unknown): unknown {
  if (SECRET.test(key)) return "[redacted]";
  if (PII.test(key) && typeof value === "string") {
    if (value.includes("@")) {
      const [user, domain] = value.split("@");
      return `${user.slice(0, 1)}***@${domain}`;
    }
    if (value.length > 4) return `***${value.slice(-2)}`;
    return "[redacted]";
  }
  return value;
}

function redact(fields?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!fields) return undefined;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      out[k] = redact(v as Record<string, unknown>);
    } else {
      out[k] = redactValue(k, v);
    }
  }
  return out;
}

function emit(level: string, event: string, fields?: Record<string, unknown>) {
  const line = {
    level,
    event,
    ts: new Date().toISOString(),
    ...redact(fields),
  };
  const payload = JSON.stringify(line);
  if (level === "error") console.error(payload);
  else if (level === "warn") console.warn(payload);
  else console.log(payload);
}

export const log = {
  info: (event: string, fields?: Record<string, unknown>) => emit("info", event, fields),
  warn: (event: string, fields?: Record<string, unknown>) => emit("warn", event, fields),
  error: (event: string, fields?: Record<string, unknown>) => emit("error", event, fields),
};
