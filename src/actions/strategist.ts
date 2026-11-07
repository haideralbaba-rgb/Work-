"use server";

import { db } from "@/db";
import { aiConversations, goals, notifications, profiles } from "@/db/schema";
import { and, asc, desc, eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { strategistReply } from "@/lib/ai";
import { getSnapshot, logActivity } from "@/lib/metrics";
import { n, todayKey, daysAgoKey } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export async function sendStrategistMessage(
  content: string
): Promise<{ ok?: boolean; error?: string; reply?: string }> {
  const user = await requireUser();
  const text = content.trim();
  if (!text) return { error: "اكتب سؤالًا أولًا." };
  if (text.length > 2000) return { error: "الرسالة طويلة جدًا (الحد 2000 حرف)." };

  await db.insert(aiConversations).values({ userId: user.id, role: "user", content: text });

  const historyRows = await db
    .select()
    .from(aiConversations)
    .where(eq(aiConversations.userId, user.id))
    .orderBy(desc(aiConversations.createdAt))
    .limit(24);
  const history = historyRows.reverse().map((r) => ({ role: r.role, content: r.content }));

  const snap = await getSnapshot(user.id);
  const reply = await strategistReply(text, snap, history);

  await db.insert(aiConversations).values({ userId: user.id, role: "assistant", content: reply });
  revalidatePath("/strategist");
  return { ok: true, reply };
}

export async function getStrategistHistory(userId: string) {
  return db
    .select()
    .from(aiConversations)
    .where(eq(aiConversations.userId, userId))
    .orderBy(asc(aiConversations.createdAt))
    .limit(60);
}

export async function clearStrategist(): Promise<{ ok: boolean }> {
  const user = await requireUser();
  await db.delete(aiConversations).where(eq(aiConversations.userId, user.id));
  revalidatePath("/strategist");
  return { ok: true };
}

export async function markNotificationsRead(): Promise<{ ok: boolean }> {
  const user = await requireUser();
  await db.update(notifications).set({ read: true }).where(eq(notifications.userId, user.id));
  revalidatePath("/", "layout");
  return { ok: true };
}

export type SettingsInput = {
  businessName: string;
  instagram: string;
  location: string;
  specialization: string;
  ambition: string;
  weeklyHours: number;
  financialTarget: number;
  currency: string;
  exchangeRate: number;
  equipment: string[];
  notifPrefs: Record<string, boolean>;
};

export async function updateSettings(input: SettingsInput): Promise<{ ok?: boolean; error?: string }> {
  const user = await requireUser();
  if (!input.businessName.trim()) return { error: "اسم المشروع مطلوب." };
  await db
    .update(profiles)
    .set({
      businessName: input.businessName.trim(),
      instagram: input.instagram.trim(),
      location: input.location.trim() || "karbala, iraq",
      specialization: input.specialization.trim(),
      ambition: input.ambition.trim(),
      weeklyHours: Math.max(1, Math.min(80, input.weeklyHours || 20)),
      financialTarget: String(Math.max(50, input.financialTarget || 2000)),
      currency: input.currency === "IQD" ? "IQD" : "USD",
      exchangeRate: String(Math.max(1, input.exchangeRate || 1310)),
      equipment: input.equipment,
      notifPrefs: input.notifPrefs,
      updatedAt: new Date(),
    })
    .where(eq(profiles.userId, user.id));

  const g = await db.select().from(goals).where(eq(goals.userId, user.id)).limit(1);
  if (g[0]) {
    await db
      .update(goals)
      .set({ target: String(Math.max(50, input.financialTarget || 2000)) })
      .where(eq(goals.id, g[0].id));
  }
  await logActivity(user.id, "settings", "حدّث إعدادات المشروع");
  revalidatePath("/", "layout");
  return { ok: true };
}

/* ---------------------------- performance review --------------------------- */

export type ReviewMetrics = {
  range: string;
  tasksCompleted: number;
  tasksDelayed: number;
  newLeads: number;
  outreachSent: number;
  replied: number;
  responseRate: number;
  activeConversations: number;
  proposalsSent: number;
  dealsClosed: number;
  collected: number;
  expenses: number;
  profit: number;
  published: number;
  insights: { tone: "good" | "warn" | "bad"; text: string }[];
};

export async function computeReview(userId: string, days: number): Promise<ReviewMetrics> {
  const since = new Date(Date.now() - days * 86400_000);
  const snap = await getSnapshot(userId);
  const { tasks, businesses, outreachMessages, proposals, deals, payments, expenses, scripts, contentProjects } =
    await import("@/db/schema");
  const [t, biz, om, pr, dl, py, ex, sc, cp] = await Promise.all([
    db.select().from(tasks).where(eq(tasks.userId, userId)),
    db.select().from(businesses).where(eq(businesses.userId, userId)),
    db.select().from(outreachMessages).where(eq(outreachMessages.userId, userId)),
    db.select().from(proposals).where(eq(proposals.userId, userId)),
    db.select().from(deals).where(eq(deals.userId, userId)),
    db.select().from(payments).where(eq(payments.userId, userId)),
    db.select().from(expenses).where(eq(expenses.userId, userId)),
    db.select().from(scripts).where(eq(scripts.userId, userId)),
    db.select().from(contentProjects).where(eq(contentProjects.userId, userId)),
  ]);

  const completed = t.filter((x) => x.status === "done" && x.completedAt && x.completedAt >= since).length;
  const today = todayKey();
  const delayed = t.filter((x) => x.status !== "done" && x.dueDate && x.dueDate < today).length;
  const newLeads = biz.filter((x) => x.createdAt >= since).length;
  const sentList = om.filter((x) => !["draft", "suppressed"].includes(x.status));
  const sent = sentList.filter((x) => (x.sentAt ?? x.createdAt) >= since).length;
  const replied = sentList.filter((x) => ["replied", "interested"].includes(x.status)).length;
  const responseRate = sentList.length ? Math.round((replied / sentList.length) * 100) : 0;
  const props = pr.filter((x) => x.sentAt && x.sentAt >= since).length;
  const won = dl.filter((x) => x.stage === "won" && x.updatedAt >= since).length;
  const collectedList = py.filter((x) => (x.receivedAt || todayKey(x.createdAt)) >= daysAgoKey(days - 1));
  const collected = collectedList.reduce((s, x) => s + n(x.usdAmount), 0);
  const spent = ex.filter((x) => x.createdAt >= since).reduce((s, x) => s + n(x.usdAmount), 0);
  const published =
    sc.filter((x) => x.status === "published" && x.updatedAt >= since).length +
    cp.filter((x) => x.status === "published" && x.publishedAt >= daysAgoKey(days - 1)).length;

  const insights: ReviewMetrics["insights"] = [];

  if (newLeads >= 5 && sent === 0) {
    insights.push({
      tone: "warn",
      text: `تكتشف جهات بشكل جيد (${newLeads} جديدة) لكن لم تُرسل أي رسالة تواصل في هذه الفترة. الاكتشاف بلا تواصل لا يدرّ إيرادًا — حوّل الاكتشاف إلى رسائل اليوم.`,
    });
  }
  if (sent >= 5 && responseRate < 20) {
    insights.push({
      tone: "bad",
      text: `أرسلت ${sent} رسالة ومعدل الرد ${responseRate}% — منخفض. قبل زيادة العدد، حسّن الاستهداف والجملة الأولى: ملاحظة حقيقية محددة عن كل نشاط، لا مجاملات عامة.`,
    });
  }
  if (sent >= 5 && responseRate >= 20) {
    insights.push({
      tone: "good",
      text: `معدل الرد ${responseRate}% على ${sent} رسائل — مؤشر صحي. الحلقة التالية: تحويل الردود إلى عروض مكتوبة بسرعة.`,
    });
  }
  if (snap.counts.conversationsActive >= 3 && pr.filter((x) => x.status === "sent").length === 0) {
    insights.push({
      tone: "warn",
      text: `لديك ${snap.counts.conversationsActive} محادثات نشطة ولا عرض مرسل. عرضك التجاري يحتاج وضوحًا أكبر: مخرجات مرقّمة + سعر + شروط دفع في مستند واحد.`,
    });
  }
  if (won === 0 && pr.filter((x) => x.status === "sent").length >= 3) {
    insights.push({
      tone: "warn",
      text: "عروض مرسلة بلا إغلاق. راجع شروط الدفع (عربون 50%) وقدّم نسخة أصغر من العرض لتقليل حاجز القرار الأول.",
    });
  }
  if (collected > 0) {
    insights.push({
      tone: "good",
      text: `حصّلت ${collected.toFixed(0)}$ خلال الفترة — إيراد حقيقي مسجّل. وثّق هذه النتيجة الآن: شهادة عميل + دراسة حالة قصيرة.`,
    });
  }
  if (completed > 0 && completed < 3 && days >= 7) {
    insights.push({
      tone: "bad",
      text: `أنجزت ${completed} مهام فقط هذا الأسبوع. الالتزام التنفيذي هو الاختناق الحالي — قلّل التخطيط وارفع ساعات التنفيذ المباشر.`,
    });
  }
  if (insights.length === 0) {
    insights.push({
      tone: "warn",
      text: "لا توجد بيانات كافية في هذه الفترة لاستخلاص نمط واضح. سجّل أنشطتك الحقيقية (جهات، رسائل، عروض، دفعات) ليقوم النظام بتشخيص الاختناق بدقة.",
    });
  }

  return {
    range: days === 1 ? "اليوم" : `آخر ${days} أيام`,
    tasksCompleted: completed,
    tasksDelayed: delayed,
    newLeads,
    outreachSent: sent,
    replied,
    responseRate,
    activeConversations: snap.counts.conversationsActive,
    proposalsSent: props,
    dealsClosed: won,
    collected,
    expenses: spent,
    profit: collected - spent,
    published,
    insights,
  };
}
