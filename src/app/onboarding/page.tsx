import { getProfile, requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import OnboardingWizard from "@/components/onboarding-client";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await requireUser();
  const profile = await getProfile(user.id);
  if (profile?.onboardingCompleted) redirect("/dashboard");

  return <OnboardingWizard userName={user.name} />;
}
