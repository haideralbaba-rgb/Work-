import { getProfile, requireUser } from "@/lib/auth";
import SettingsClient from "@/components/settings-client";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();
  const profile = await getProfile(user.id);
  const hasOpenAI = !!process.env.OPENAI_API_KEY;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        kicker="SETTINGS"
        title="الإعدادات"
        desc="ملف مشروعك وتفضيلات النظام — هذه البيانات تغذي المستشار ومهام اليوم."
      />
      <SettingsClient
        email={user.email}
        hasOpenAI={hasOpenAI}
        initial={{
          businessName: profile?.businessName ?? "",
          instagram: profile?.instagram ?? "",
          location: profile?.location ?? "كربلاء، العراق",
          specialization: profile?.specialization ?? "",
          ambition: profile?.ambition ?? "",
          weeklyHours: profile?.weeklyHours ?? 20,
          financialTarget: Number(profile?.financialTarget ?? 2000),
          currency: profile?.currency ?? "USD",
          exchangeRate: Number(profile?.exchangeRate ?? 1310),
          equipment: profile?.equipment ?? [],
          notifPrefs: profile?.notifPrefs ?? {},
        }}
      />
    </div>
  );
}
