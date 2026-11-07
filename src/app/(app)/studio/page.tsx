import { db } from "@/db";
import { businesses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { listScripts } from "@/actions/studio";
import StudioClient from "@/components/studio-client";

export const dynamic = "force-dynamic";

export default async function StudioPage() {
  const user = await requireUser();
  const [scriptsList, biz] = await Promise.all([
    listScripts(user.id),
    db.select({ id: businesses.id, name: businesses.name }).from(businesses).where(eq(businesses.userId, user.id)),
  ]);
  return <StudioClient scripts={scriptsList} businessOptions={biz} />;
}
