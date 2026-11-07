import { getProfile, getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const profile = await getProfile(user.id);
  redirect(profile?.onboardingCompleted ? "/dashboard" : "/onboarding");
}
