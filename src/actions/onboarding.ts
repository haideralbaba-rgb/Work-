"use server";

import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { seedBusiness } from "@/lib/seed";
import { logActivity, notify } from "@/lib/metrics";
import { revalidatePath } from "next/cache";

export type OnboardingInput = {
  businessName: string;
  location: string;
  instagram: string;
  portfolioLinks: string[];
  equipment: string[];
  photoExperience: string;
  videoSkills: string;
  weeklyHours: number;
  currentServices: string[];
  preferredCategories: string[];
  currentRevenue: number;
  existingClients: number;
  monthlyExpenses: number;
  financialTarget: number;
  currency: string;
  exchangeRate: number;
  specialization: string;
  ambition: string;
};

export async function completeOnboarding(input: OnboardingInput): Promise<{ ok?: boolean; error?: string }> {
  const user = await requireUser();
  if (!input.businessName.trim()) return { error: "اسم المشروع مطلوب." };

  const existing = await db.select().from(profiles).where(eq(profiles.userId, user.id)).limit(1);
  const payload = {
    businessName: input.businessName.trim(),
    location: input.location || "karbala, iraq",
    instagram: input.instagram.trim(),
    portfolioLinks: input.portfolioLinks.filter(Boolean),
    equipment: input.equipment,
    photoExperience: input.photoExperience,
    videoSkills: input.videoSkills,
    weeklyHours: Math.max(1, Math.min(80, input.weeklyHours || 20)),
    currentServices: input.currentServices,
    preferredCategories: input.preferredCategories,
    currentRevenue: String(input.currentRevenue || 0),
    existingClients: Math.max(0, input.existingClients || 0),
    monthlyExpenses: String(input.monthlyExpenses || 0),
    financialTarget: String(Math.max(50, input.financialTarget || 2000)),
    currency: input.currency === "IQD" ? "IQD" : "USD",
    exchangeRate: String(Math.max(1, input.exchangeRate || 1310)),
    specialization: input.specialization || "food & hospitality visual content",
    ambition: input.ambition || "build a creative production studio",
    onboardingCompleted: true,
    updatedAt: new Date(),
  };

  if (existing[0]) {
    await db.update(profiles).set(payload).where(eq(profiles.userId, user.id));
  } else {
    await db.insert(profiles).values({ userId: user.id, ...payload });
  }

  await seedBusiness(user.id, payload.financialTarget ? Number(payload.financialTarget) : 2000);
  await logActivity(user.id, "onboarding", "أكمل إعداد الملف التجاري وانطلقت خارطة الطريق");
  await notify(
    user.id,
    "system",
    `أهلًا بك في INDEPENDENT OS، ${input.businessName}`,
    "خارطة طريقك نحو أول $2,000 جاهزة. ابدأ بمهمة اليوم."
  );
  revalidatePath("/", "layout");
  return { ok: true };
}
