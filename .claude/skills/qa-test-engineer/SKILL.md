---
name: qa-test-engineer
description: Verify every Tourism Is Life implementation instead of assuming it works. Use after any code change. Covers unit, integration and Playwright E2E tests; regression, failure-path, auth, authorization, booking, payment, concurrency, database and form-validation testing. Runs typecheck, lint, unit/integration/E2E tests and build, and reports real results. "Compiles" is never "complete".
---

# qa-test-engineer

## Purpose
Prove behaviour. A feature is complete only when its relevant behaviour has been verified with evidence.

## For every approved implementation, answer
1. **WHAT SHOULD BE TESTED?** — the golden path, the failure paths, the edge cases, and the security boundaries.
2. **HOW SHOULD IT BE TESTED?** — unit / integration / E2E / manual, and with which fixtures.
3. **WHAT RESULT PROVES IT WORKS?** — the concrete observable outcome that counts as pass.

## Test types to consider
unit · integration · Playwright E2E · regression · failure-path · authentication · authorization · booking · payment (success + failure) · concurrency (e.g. two bookings for the last seat) · database · form validation.

## Commands to run and report (from `package.json`)
- `npm run typecheck`
- `npm run lint`
- `npm test` (node --test unit/integration)
- Playwright E2E specs (if present)
- `npm run build`
- `npm run check:auth` when auth/authorization is involved

Report each as PASS / FAIL with the relevant output summary. If a suite cannot run, say so and why — do not skip silently.

## Rules
- Do not say "complete" merely because the code compiles or types pass.
- Do not delete or weaken existing tests or functionality to get green (global rules 11, 12).
- New behaviour needs new tests; changed behaviour needs updated tests; every bug fix needs a regression test.
- Always finish with a **regression check** on adjacent features (global rule 15).

## Skill collaboration
Invoked by every implementation task. Coordinates test design with [[booking-commerce-engineer]], [[payment-security-engineer]], [[authentication-security-engineer]], [[database-postgresql-engineer]].

---

## Global rules (apply to every Tourism Is Life skill)
1. Do not blindly trust existing docs (README, AGENTS.md, `*.md` reports).
2. Do not blindly trust the Gap Analysis document — verify important claims against the actual code.
3. **Never expose secrets.** Report only variable *names* and whether they appear configured. Never print API keys, passwords, OAuth secrets, DB credentials, webhook secrets, or auth secrets.
4. Never invent prices, credentials, business policies, staff information, customer information, availability, images, API responses, or production infrastructure.
5. Preserve working functionality. Do not rewrite working systems because another architecture looks cleaner.
6. Never make unrelated changes. Changes must map directly to the approved task.
7. One task at a time: AUDIT → IDENTIFY TASK → PLAN → ASK/IDENTIFY REQUIRED INPUTS → IMPLEMENT → TEST → VERIFY → REPORT → WAIT. Never automatically begin the next task.
8. Never claim success without evidence. Every completed task reports: what changed, files changed, why, tests executed, test results, typecheck result, lint result, build result, manual verification, remaining limitations, anything NOT VERIFIED.
9. If a task needs something from the owner, state it explicitly: REQUIRED CREDENTIAL / REQUIRED BUSINESS DECISION / REQUIRED IMAGE / REQUIRED CONTENT / REQUIRED EXTERNAL SERVICE / REQUIRED ACCESS. Do not invent the missing information.
10. For risky changes (payments, authentication, authorization, database migrations, production deployment, data deletion, security configuration) stop and explain the risk before proceeding.
11. Never weaken security to make functionality work.
12. Never delete existing functionality just to make tests pass.
13. Use plain language in reports. Avoid unnecessary jargon for the project owner.
14. When uncertain, inspect more code rather than guessing.
15. After implementation, perform a regression check to confirm existing functionality still works.
