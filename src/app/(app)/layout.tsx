import { db } from "@/db";
import { notifications } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getProfile, requireUser } from "@/lib/auth";
import Shell from "@/components/shell";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const profile = await getProfile(user.id);
  if (!profile?.onboardingCompleted) redirect("/onboarding");
  const notifs = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(20);
  return (
    <Shell userName={user.name} businessName={profile.businessName} notifications={notifs}>
      {children}
    </Shell>
  );
}
