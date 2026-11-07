import { db } from "@/db";
import { businesses, proposals, services } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import ServicesClient from "@/components/services-client";

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const user = await requireUser();
  const [svc, prop, biz] = await Promise.all([
    db.select().from(services).where(eq(services.userId, user.id)).orderBy(desc(services.createdAt)),
    db.select().from(proposals).where(eq(proposals.userId, user.id)).orderBy(desc(proposals.createdAt)),
    db.select({ id: businesses.id, name: businesses.name }).from(businesses).where(eq(businesses.userId, user.id)),
  ]);
  return <ServicesClient services={svc} proposals={prop} businessOptions={biz} />;
}
