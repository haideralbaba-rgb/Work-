import { db } from "@/db";
import { businesses, outreachMessages } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import ClientsBoard from "@/components/clients-client";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const user = await requireUser();
  const [biz, outreach] = await Promise.all([
    db.select().from(businesses).where(eq(businesses.userId, user.id)).orderBy(desc(businesses.updatedAt)),
    db.select().from(outreachMessages).where(eq(outreachMessages.userId, user.id)).orderBy(desc(outreachMessages.createdAt)),
  ]);
  return <ClientsBoard businesses={biz} outreach={outreach} />;
}
