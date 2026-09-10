# Tourism Is Life — Claude Code skill system

This project is an existing production-oriented tourism platform. These skills exist to help
**understand, improve, test, secure and deploy the existing system safely** — not to rewrite it.

## Workflow (always)

AUDIT → IDENTIFY TASK → PLAN → ASK / IDENTIFY REQUIRED INPUTS → IMPLEMENT → TEST → VERIFY → REPORT → WAIT

One task at a time. Never auto-start the next task. Every skill also carries the full global-rules
block in its own `SKILL.md`.

## The 11 skills

| Skill | Use it for |
|---|---|
| `project-auditor` | Understand the repo before changing anything. Read-only evidence-based audits. |
| `tourism-platform-domain-expert` | Ground features in the real tourism business workflow. |
| `senior-full-stack-engineer` | Implement features safely in the existing TanStack Start / React 19 stack. |
| `database-postgresql-engineer` | Schema, migrations, transactions, concurrency (PostgreSQL / PGLite / Kysely). |
| `booking-commerce-engineer` | Correctness of availability → hold → checkout → payment → confirmation → voucher. |
| `payment-security-engineer` | PaymentProvider work: Stripe / Moneroo / mock, webhooks, idempotency, refunds. |
| `authentication-security-engineer` | Better Auth, sessions, OAuth, RBAC, the first-user-SUPER_ADMIN concern. |
| `qa-test-engineer` | Verify behaviour: unit / integration / Playwright E2E, typecheck, lint, build. |
| `security-reviewer` | Independent, non-destructive security review by severity. |
| `devops-production-engineer` | Production build, env vars, CI/CD, migrations, backup/restore. |
| `technical-documentation-engineer` | Keep docs matching verified code; label unverified content NOT VERIFIED. |

## Which skills for which task

- **Booking task:** project-auditor, tourism-platform-domain-expert, senior-full-stack-engineer, database-postgresql-engineer, booking-commerce-engineer, qa-test-engineer, security-reviewer
- **Payment task:** project-auditor, payment-security-engineer, booking-commerce-engineer, database-postgresql-engineer, qa-test-engineer, security-reviewer
- **Authentication task:** project-auditor, authentication-security-engineer, senior-full-stack-engineer, qa-test-engineer, security-reviewer
- **Deployment task:** project-auditor, devops-production-engineer, database-postgresql-engineer, security-reviewer, qa-test-engineer, technical-documentation-engineer
- **Documentation task:** project-auditor, technical-documentation-engineer

## Global rules (summary — full text in every SKILL.md)

1. Don't trust existing docs blindly. 2. Don't trust the Gap Analysis blindly — verify against code.
3. Never expose secrets (names + configured?/not only). 4. Never invent prices, credentials, policies,
staff/customer data, availability, images, API responses or infrastructure. 5. Preserve working
functionality. 6. No unrelated changes. 7. One task at a time. 8. No success claims without evidence.
9. State REQUIRED inputs explicitly. 10. Stop and explain risky changes first. 11. Never weaken
security to make something work. 12. Never delete functionality to pass tests. 13. Plain-language
reports. 14. When uncertain, inspect more code. 15. Regression-check after implementation.
