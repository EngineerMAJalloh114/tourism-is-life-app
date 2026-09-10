---
name: project-auditor
description: Systematically inspect the existing Tourism Is Life codebase before any change is made. Use for baseline audits, "understand the repo", architecture mapping, route/feature inventory, business-flow tracing, test inventory, env-var reference checks, and comparing documentation against the real implementation. Produces evidence-based findings. Read-only unless the user explicitly asks for edits.
---

# project-auditor

## Purpose
Help Claude understand the existing project **before** proposing or making changes.
This is an existing production-oriented tourism platform. It must not be rewritten.

## Core rule
**UNDERSTAND FIRST → PLAN SECOND → MODIFY THIRD.**
During an audit, do not modify application code unless the user explicitly instructs it.

## When to use
- The user asks for a baseline audit, a "state of the project" report, or "help me understand X".
- Before starting any implementation task in another skill (auditor runs first).
- When documentation and behaviour seem to disagree.

## Audit workflow
1. **Inventory the repo.** Read `package.json` (scripts, dependencies, engines), `tsconfig.json`, `vite.config.ts`, `eslint.config.mjs`, `.prettierrc`, `.env.example`, `.gitignore`, `AGENTS.md`, `README.md`, and every `*.md` status/report file. Treat all docs as *claims to verify*, not facts.
2. **Map the architecture.** Identify: frontend (`src/`), server functions / API (`server/`, TanStack Start server fns), database layer (Kysely, PGLite, `pg`, migrations in `scripts/`), auth (better-auth), background scripts (`scripts/`).
3. **Enumerate routes and features.** List every route file, its purpose, whether it is customer-facing or staff/admin, and its data dependencies.
4. **Trace key business flows** end to end (see [[tourism-platform-domain-expert]]): destination → tour → availability → reserve → checkout → pay → voucher; and the staff/admin operations flow.
5. **Inspect tests.** List unit tests (`node --test`), integration tests, and Playwright E2E specs. Record what is covered and what is not. Run `npm run typecheck`, `npm run lint`, `npm test` and record results — do not fix failures during an audit, just report them.
6. **Env-var reference check.** List every referenced environment variable name (grep for `process.env`, `import.meta.env`, env schema files, `.env.example`). Report only the **names** and whether each appears to be wired/configured. Never print a value. See global rule 3.
7. **Compare docs vs code.** For each significant claim in the docs / Gap Analysis, mark it: CONFIRMED / PARTIALLY TRUE / NOT FOUND / CONTRADICTED, with file+line evidence.
8. **Classify functionality** as: COMPLETE / PARTIAL / MISSING / BROKEN, each with evidence.

## Findings format
For every finding provide: the claim or question, the evidence (`path:line`), the verdict, the risk/impact in plain language, and a suggested (not executed) next step.

## Skill collaboration
project-auditor runs first for essentially every task. It hands verified context to the domain and engineering skills. It does not implement.

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
