import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildEnquiryTeamEmail, isValidEmail, sanitizeHeaderValue } from "./notify.ts";

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
