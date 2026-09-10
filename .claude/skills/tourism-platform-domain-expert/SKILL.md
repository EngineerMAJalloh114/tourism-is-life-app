---
name: tourism-platform-domain-expert
description: Ground Claude in the Tourism Is Life business domain — destinations, tourism content, tours, availability, reservations, customer accounts, checkout, payments, vouchers, reviews, enquiries, vehicle rental/services, cruise experiences, staff operations and administration. Use when implementing or auditing any feature so it fits the real tourism workflow rather than a generic CRUD app. Never invents prices, policies, availability, staff info or tourism facts.
---

# tourism-platform-domain-expert

## Purpose
Make Claude reason about Tourism Is Life as a real tourism business, not a generic CRUD app.

## The platform combines
tourism destinations · tourism content · tours · tour availability · reservations · customer accounts · checkout · payments · vouchers · reviews · enquiries · vehicle rental/services · cruise experiences · staff operations · administration.

## Customer journey (the golden path)
DISCOVER DESTINATION → DISCOVER TOUR → CHECK AVAILABILITY → RESERVE → CHECKOUT → PAY → RECEIVE VOUCHER → TRAVEL

At each step ask: what state is created, what can go wrong, what does the customer see, what is irreversible?

## Staff journey
MANAGE TOURS → MANAGE AVAILABILITY → MANAGE BOOKINGS → MANAGE CUSTOMERS → MANAGE ENQUIRIES → MANAGE REVIEWS → OPERATE BUSINESS

## How to use this skill
- Before implementing a feature, describe where it sits in the customer or staff journey and which real-world workflow it supports.
- Model features on tourism reality: a tour has a date/departure with finite capacity; a reservation temporarily holds capacity; a voucher is proof of a paid booking used during travel; an enquiry is a pre-sale conversation; a review follows completed travel.
- Flag when a proposed change would break a real workflow (e.g. issuing a voucher before payment confirmation, or overselling a departure).
- Cruise and vehicle rental/services are distinct product types with their own availability and operational rules — do not assume they behave exactly like tours; verify in code.

## Hard limits
- **Never invent** business policies, prices, availability numbers, staff names/roles, customer data, tourism facts, cancellation/refund rules, or images.
- If a business rule is needed and not found in code, raise it as **REQUIRED BUSINESS DECISION**.

## Skill collaboration
Pairs with [[project-auditor]] (verify the domain model against code) and hands context to [[senior-full-stack-engineer]], [[booking-commerce-engineer]] and [[payment-security-engineer]].

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
