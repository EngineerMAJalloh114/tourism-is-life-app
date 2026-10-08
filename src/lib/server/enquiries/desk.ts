/**
 * The enquiry desk. Reading an enquiry shows a visitor's name, email, phone and
 * message, so it needs `enquiries.read` (BOOKING_MANAGER, ADMIN, SUPER_ADMIN).
 */
import { inTransaction } from "@/lib/sql";
import { adminOperation } from "@/lib/server/access";
import { audit } from "@/lib/server/audit";
import { NotFoundError } from "@/lib/server/errors";

export type EnquiryRow = {
  id: string;
  type: string;
  payload: string;
  status: string;
  guest_email: string | null;
  guest_name: string | null;
  created_at: string;
};

export const listEnquiries = adminOperation("enquiries.read", async (sql) => {
  return sql<EnquiryRow>`
    select id, type, payload, status, guest_email, guest_name, created_at
    from enquiries
    order by created_at desc
    limit 100
  `;
});

export const setEnquiryStatus = adminOperation(
  "enquiries.manage",
  async (sql, actor, input: { id: string; status: "open" | "closed" }) => {
    return inTransaction(sql, async (tx) => {
      const current = await tx<{ status: string }>`
        select status from enquiries where id = ${input.id} for update
      `;
      if (!current[0]) throw new NotFoundError("That enquiry does not exist.");
      await tx`update enquiries set status = ${input.status} where id = ${input.id}`;
      await audit(tx, {
        actor,
        action: "enquiry.status",
        entity: "enquiries",
        entityId: input.id,
        before: { status: current[0].status },
        after: { status: input.status },
      });
      return { ok: true as const };
    });
  },
);
