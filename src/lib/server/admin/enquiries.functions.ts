import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { staffMiddleware } from "@/lib/server/staff-middleware";
import {
  addEnquiryNote,
  assignEnquiry,
  ENQUIRY_STATUSES,
  exportEnquiries,
  getEnquiry,
  listAssignees,
  listEnquiries,
  setEnquiryStatus,
} from "@/lib/server/enquiries/desk";

const filters = {
  q: z.string().max(100).optional(),
  status: z.enum(ENQUIRY_STATUSES).optional(),
  type: z.string().max(20).optional(),
  assignee: z.string().max(64).optional(),
};
const id = z.string().min(1).max(40);

export const adminListEnquiries = createServerFn({ method: "GET" })
  .middleware([staffMiddleware])
  .validator((d) => z.object({ ...filters, cursor: z.string().max(200).optional(), limit: z.number().int().min(1).max(100).optional() }).optional().parse(d))
  .handler(async ({ data, context }) => listEnquiries(await getSql(), context.actor, data));

export const adminGetEnquiry = createServerFn({ method: "GET" })
  .middleware([staffMiddleware])
  .validator((d) => z.object({ id }).parse(d))
  .handler(async ({ data, context }) => getEnquiry(await getSql(), context.actor, data));

export const adminSetEnquiryStatus = createServerFn({ method: "POST" })
  .middleware([staffMiddleware])
  .validator((d) => z.object({ id, status: z.enum(ENQUIRY_STATUSES) }).parse(d))
  .handler(async ({ data, context }) => setEnquiryStatus(await getSql(), context.actor, data));

export const adminListAssignees = createServerFn({ method: "GET" })
  .middleware([staffMiddleware])
  .handler(async ({ context }) => listAssignees(await getSql(), context.actor, undefined));

export const adminAssignEnquiry = createServerFn({ method: "POST" })
  .middleware([staffMiddleware])
  .validator((d) => z.object({ id, assigneeId: z.string().min(1).max(64).nullable() }).parse(d))
  .handler(async ({ data, context }) => assignEnquiry(await getSql(), context.actor, data));

export const adminAddEnquiryNote = createServerFn({ method: "POST" })
  .middleware([staffMiddleware])
  .validator((d) => z.object({ id, body: z.string().max(5000) }).parse(d))
  .handler(async ({ data, context }) => addEnquiryNote(await getSql(), context.actor, data));

export const adminExportEnquiries = createServerFn({ method: "POST" })
  .middleware([staffMiddleware])
  .validator((d) => z.object(filters).optional().parse(d))
  .handler(async ({ data, context }) => exportEnquiries(await getSql(), context.actor, data));
