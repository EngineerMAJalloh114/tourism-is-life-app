import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { listEnquiries, setEnquiryStatus } from "@/lib/server/enquiries/desk";
import { staffMiddleware } from "@/lib/server/staff-middleware";

export const adminListEnquiries = createServerFn({ method: "GET" })
  .middleware([staffMiddleware])
  .handler(async ({ context }) => listEnquiries(await getSql(), context.actor, undefined));

export const adminSetEnquiryStatus = createServerFn({ method: "POST" })
  .middleware([staffMiddleware])
  .validator((d) => z.object({ id: z.string().min(1).max(40), status: z.enum(["open", "closed"]) }).parse(d))
  .handler(async ({ data, context }) => setEnquiryStatus(await getSql(), context.actor, data));
