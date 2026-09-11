import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { buildEnquiryTeamEmail, isValidEmail, sanitizeHeaderValue, sendEmail } from "./notify.ts";

const ORIGINAL_FETCH = globalThis.fetch;
const ORIGINAL_KEY = process.env.RESEND_API_KEY;
const ORIGINAL_FROM = process.env.RESEND_FROM;

function restoreEnv() {
  globalThis.fetch = ORIGINAL_FETCH;
  if (ORIGINAL_KEY === undefined) delete process.env.RESEND_API_KEY;
  else process.env.RESEND_API_KEY = ORIGINAL_KEY;
  if (ORIGINAL_FROM === undefined) delete process.env.RESEND_FROM;
  else process.env.RESEND_FROM = ORIGINAL_FROM;
}

describe("isValidEmail", () => {
  it("accepts a normal address", () => {
    assert.equal(isValidEmail("traveller@example.com"), true);
  });

  it("rejects a malformed address", () => {
    assert.equal(isValidEmail("not-an-email"), false);
    assert.equal(isValidEmail("missing@domain"), false);
    assert.equal(isValidEmail("@example.com"), false);
    assert.equal(isValidEmail(""), false);
  });

  it("rejects an address carrying a header-injection payload", () => {
    assert.equal(isValidEmail("a@example.com\r\nBcc: attacker@evil.com"), false);
    assert.equal(isValidEmail("a@example.com, other@example.com"), false);
  });
});

describe("sanitizeHeaderValue", () => {
  it("strips CR/LF so a value can never smuggle extra email headers", () => {
    assert.equal(sanitizeHeaderValue("Hello\r\nBcc: attacker@evil.com"), "Hello Bcc: attacker@evil.com");
    assert.equal(sanitizeHeaderValue("line1\nline2"), "line1 line2");
  });

  it("trims surrounding whitespace", () => {
    assert.equal(sanitizeHeaderValue("  hi  "), "hi");
  });
});

describe("buildEnquiryTeamEmail — Resend production integration", () => {
  const base = {
    ref: "ENQ-ABC123",
    type: "B2C",
    email: "traveller@example.com",
    submittedAt: new Date("2026-09-11T12:00:00.000Z"),
  };

  it("only renders fields that were actually present in the payload — never invents fields", () => {
    const { html, text } = buildEnquiryTeamEmail({
      ...base,
      payload: { name: "Ama", email: "traveller@example.com", message: "Interested in a tour." },
    });
    assert.match(html, /Ama/);
    assert.match(text, /Interested in a tour\./);
    // Fields the form never collected (e.g. company, ship) must not appear.
    assert.doesNotMatch(html, /Company/);
    assert.doesNotMatch(html, /Ship name/);
    assert.doesNotMatch(text, /Company/);
  });

  it("escapes HTML/script content in the payload", () => {
    const { html } = buildEnquiryTeamEmail({
      ...base,
      payload: {
        name: "Ama",
        email: "traveller@example.com",
        message: "<script>alert(1)</script>",
      },
    });
    assert.doesNotMatch(html, /<script>/);
    assert.match(html, /&lt;script&gt;/);
  });

  it("includes phone only when supplied", () => {
    const withPhone = buildEnquiryTeamEmail({
      ...base,
      phone: "+232 76 000 000",
      payload: { name: "Ama", email: "traveller@example.com", message: "Hi" },
    });
    assert.match(withPhone.html, /\+232 76 000 000/);

    const withoutPhone = buildEnquiryTeamEmail({
      ...base,
      payload: { name: "Ama", email: "traveller@example.com", message: "Hi" },
    });
    assert.doesNotMatch(withoutPhone.html, /Phone/);
  });

  it("labels B2B fields distinctly from B2C fields", () => {
    const { text } = buildEnquiryTeamEmail({
      ...base,
      type: "B2B",
      payload: {
        company: "Oasis Overland",
        contact: "Jo",
        email: "jo@oasisoverland.co.uk",
        volume: "40 pax",
        message: "Group rates?",
      },
    });
    assert.match(text, /Estimated volume: 40 pax/);
    assert.match(text, /Jo/);
  });

  it("includes the ref and submission time for traceability", () => {
    const { text } = buildEnquiryTeamEmail({
      ...base,
      payload: { name: "Ama", email: "traveller@example.com", message: "Hi" },
    });
    assert.match(text, /ENQ-ABC123/);
    assert.match(text, /2026-09-11 12:00:00 UTC/);
  });
});

describe("sendEmail — production reliability", () => {
  afterEach(restoreEnv);

  it("never throws on a timeout — resolves with sent:false instead", async () => {
    process.env.RESEND_API_KEY = "test-key";
    globalThis.fetch = (async () => {
      throw new DOMException("The operation was aborted.", "TimeoutError");
    }) as typeof fetch;

    const result = await sendEmail({ to: "info@tourismislife.com", subject: "x", html: "<p>x</p>" });
    assert.deepEqual(result, { sent: false, channel: "email", reason: "Resend request timed out" });
  });

  it("never throws on a network error — resolves with sent:false instead", async () => {
    process.env.RESEND_API_KEY = "test-key";
    globalThis.fetch = (async () => {
      throw new TypeError("fetch failed");
    }) as typeof fetch;

    const result = await sendEmail({ to: "info@tourismislife.com", subject: "x", html: "<p>x</p>" });
    assert.deepEqual(result, { sent: false, channel: "email", reason: "Resend request failed" });
  });

  it("never surfaces the raw Resend response body on a non-ok status", async () => {
    process.env.RESEND_API_KEY = "test-key";
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ message: "internal detail" }), { status: 422 })) as typeof fetch;

    const result = await sendEmail({ to: "info@tourismislife.com", subject: "x", html: "<p>x</p>" });
    assert.deepEqual(result, { sent: false, channel: "email", reason: "Resend 422" });
  });

  it("returns the Resend message id on success and sends the correct from/reply-to", async () => {
    process.env.RESEND_API_KEY = "test-key";
    process.env.RESEND_FROM = "Tourism Is Life <info@tourismislife.com>";
    let capturedBody: Record<string, unknown> | undefined;
    let capturedAuth: string | undefined;
    globalThis.fetch = (async (_url, init) => {
      capturedAuth = (init?.headers as Record<string, string>)?.Authorization;
      capturedBody = JSON.parse(init?.body as string);
      return new Response(JSON.stringify({ id: "re_abc123" }), { status: 200 });
    }) as typeof fetch;

    const result = await sendEmail({
      to: "info@tourismislife.com",
      subject: "New enquiry",
      html: "<p>x</p>",
      replyTo: "visitor@example.com",
    });

    assert.deepEqual(result, { sent: true, channel: "email", id: "re_abc123" });
    assert.equal(capturedBody?.from, "Tourism Is Life <info@tourismislife.com>");
    assert.deepEqual(capturedBody?.to, ["info@tourismislife.com"]);
    assert.equal(capturedBody?.reply_to, "visitor@example.com");
    // The API key must be sent as a bearer credential, never logged or returned.
    assert.equal(capturedAuth, "Bearer test-key");
  });

  it("is a documented no-op — never throws — when RESEND_API_KEY is not configured", async () => {
    delete process.env.RESEND_API_KEY;
    const result = await sendEmail({ to: "info@tourismislife.com", subject: "x", html: "<p>x</p>" });
    assert.deepEqual(result, { sent: false, channel: "email", reason: "RESEND_API_KEY not configured" });
  });
});
