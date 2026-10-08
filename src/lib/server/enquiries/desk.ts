/**
 * The enquiry desk. Reading an enquiry shows a visitor's name, email, phone and
 * message, so it needs `enquiries.read` (BOOKING_MANAGER, ADMIN, SUPER_ADMIN).
 */
import { inTransaction } from "@/lib/sql";
import { adminOperation } from "@/lib/server/access";
import { writeAudit } from "@/lib/server/audit";
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
      const updated = await tx<{ id: string }>`
        update enquiries set status = ${input.status} where id = ${input.id} returning id
      `;
      if (!updated[0]) throw new NotFoundError("That enquiry does not exist.");
      await writeAudit(tx, actor.userId, "enquiry.status", "enquiry", input.id, input.status);
      return { ok: true as const };
    });
  },
);
