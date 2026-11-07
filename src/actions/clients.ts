"use server";

import { db } from "@/db";
import {
  businesses,
  businessAnalyses,
  conversations,
  outreachMessages,
  profiles,
  services,
  type Business,
} from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { analyzeBusiness, generateOutreachMessage, type AnalysisResult } from "@/lib/ai";
import { computeLeadScore, logActivity, notify } from "@/lib/metrics";
import { PIPELINE_STAGES } from "@/lib/utils";
import { revalidatePath } from "next/cache";

async function ownBusiness(userId: string, id: string): Promise<Business | null> {
  const rows = await db
    .select()
    .from(businesses)
    .where(and(eq(businesses.id, id), eq(businesses.userId, userId)))
    .limit(1);
  return rows[0] ?? null;
}

const STAGE_ORDER = PIPELINE_STAGES.map((s) => s.key as string);
const stageIdx = (k: string) => STAGE_ORDER.indexOf(k);

export type BusinessInput = {
  id?: string;
  name: string;
  category: string;
  location: string;
  address?: string;
  website?: string;
  instagram?: string;
  phone?: string;
  email?: string;
  decisionMaker?: string;
  contactPermission?: string;
  visualOpportunity?: string;
  estimatedDealValue?: number;
  nextAction?: string;
  nextActionDate?: string;
  notes?: string;
};

export async function saveBusiness(input: BusinessInput): Promise<{ ok?: boolean; error?: string; id?: string }> {
  const user = await requireUser();
  if (!input.name.trim()) return { error: "اسم النشاط مطلوب." };
  const p = await db.select().from(profiles).where(eq(profiles.userId, user.id)).limit(1);
  const prefs = p[0]?.preferredCategories ?? [];

  const base = {
    name: input.name.trim(),
    category: input.category || "restaurant",
    location: input.location.trim() || "karbala",
    address: (input.address ?? "").trim(),
    website: (input.website ?? "").trim(),
    instagram: (input.instagram ?? "").trim(),
    phone: (input.phone ?? "").trim(),
    email: (input.email ?? "").trim(),
    decisionMaker: (input.decisionMaker ?? "").trim(),
    contactPermission: ["unknown", "granted", "denied"].includes(input.contactPermission ?? "")
      ? input.contactPermission!
      : "unknown",
    visualOpportunity: (input.visualOpportunity ?? "").trim(),
    estimatedDealValue: String(input.estimatedDealValue ?? 0),
    nextAction: (input.nextAction ?? "").trim(),
    nextActionDate: (input.nextActionDate ?? "").trim(),
    notes: (input.notes ?? "").trim(),
    updatedAt: new Date(),
  };
  const score = computeLeadScore({ ...base, stage: "discovered" } as Partial<Business>, prefs);

  if (input.id) {
    const existing = await ownBusiness(user.id, input.id);
    if (!existing) return { error: "النشاط غير موجود." };
    const finalScore = computeLeadScore({ ...existing, ...base }, prefs);
    await db.update(businesses).set({ ...base, leadScore: finalScore }).where(eq(businesses.id, input.id));
    revalidatePath("/", "layout");
    return { ok: true, id: input.id };
  }

  const [row] = await db.insert(businesses).values({ userId: user.id, ...base, leadScore: score }).returning();
  await logActivity(user.id, "client", `أضاف جهة جديدة: ${base.name}`);
  revalidatePath("/", "layout");
  return { ok: true, id: row.id };
}

export async function deleteBusiness(id: string): Promise<{ ok?: boolean; error?: string }> {
  const user = await requireUser();
  if (!(await ownBusiness(user.id, id))) return { error: "النشاط غير موجود." };
  await db.delete(businesses).where(eq(businesses.id, id));
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function setBusinessStage(id: string, stage: string): Promise<{ ok?: boolean; error?: string }> {
  const user = await requireUser();
  if (!STAGE_ORDER.includes(stage)) return { error: "مرحلة غير صالحة." };
  const biz = await ownBusiness(user.id, id);
  if (!biz) return { error: "النشاط غير موجود." };
  await db.update(businesses).set({ stage, updatedAt: new Date() }).where(eq(businesses.id, id));
  await logActivity(user.id, "pipeline", `نقل «${biz.name}» إلى مرحلة: ${stage}`);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function setContactPermission(id: string, value: string): Promise<{ ok?: boolean; error?: string }> {
  const user = await requireUser();
  if (!["unknown", "granted", "denied"].includes(value)) return { error: "قيمة غير صالحة." };
  if (!(await ownBusiness(user.id, id))) return { error: "النشاط غير موجود." };
  await db.update(businesses).set({ contactPermission: value, updatedAt: new Date() }).where(eq(businesses.id, id));
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function runBusinessAnalysis(
  businessId: string,
  input: string
): Promise<{ ok?: boolean; error?: string; analysis?: AnalysisResult & { id: string } }> {
  const user = await requireUser();
  if (!input.trim() || input.trim().length < 10) return { error: "اكتب ملاحظات حقيقية (10 أحرف على الأقل) قبل التحليل." };
  const biz = await ownBusiness(user.id, businessId);
  if (!biz) return { error: "النشاط غير موجود." };
  const svc = await db.select().from(services).where(eq(services.userId, user.id));
  const result = await analyzeBusiness(input, biz, svc);

  const [saved] = await db
    .insert(businessAnalyses)
    .values({
      userId: user.id,
      businessId,
      input: input.trim(),
      summary: result.summary,
      evidence: result.evidence,
      hypotheses: result.hypotheses,
      opportunities: result.opportunities,
      concept: result.concept,
      recommendedService: result.recommendedService,
      outreachDraft: result.outreachDraft,
      confidence: result.confidence,
    })
    .returning();

  const newStage = ["discovered", "researching"].includes(biz.stage) ? "qualified" : biz.stage;
  const updated: Partial<Business> = {
    analysisSummary: result.summary,
    recommendedService: result.recommendedService,
    stage: newStage,
    updatedAt: new Date(),
  };
  if (!biz.visualOpportunity && result.opportunities[0]) {
    updated.visualOpportunity = result.opportunities[0];
  }
  const merged = { ...biz, ...updated };
  updated.leadScore = computeLeadScore(merged, []);
  await db.update(businesses).set(updated).where(eq(businesses.id, businessId));
  await logActivity(user.id, "analysis", `حلّل النشاط: ${biz.name}`, { confidence: result.confidence });
  revalidatePath("/", "layout");
  return { ok: true, analysis: { ...result, id: saved.id } };
}

export async function generateOutreach(
  businessId: string,
  tone: string,
  channel: string,
  language: string
): Promise<{ ok?: boolean; error?: string; body?: string }> {
  const user = await requireUser();
  const biz = await ownBusiness(user.id, businessId);
  if (!biz) return { error: "النشاط غير موجود." };
  const body = generateOutreachMessage(biz, tone, channel, language);
  return { ok: true, body };
}

export async function saveOutreachMessage(input: {
  id?: string;
  businessId: string;
  channel: string;
  tone: string;
  language: string;
  body: string;
}): Promise<{ ok?: boolean; error?: string; id?: string }> {
  const user = await requireUser();
  if (!input.body.trim()) return { error: "نص الرسالة فارغ." };
  if (!(await ownBusiness(user.id, input.businessId))) return { error: "النشاط غير موجود." };
  if (input.id) {
    await db
      .update(outreachMessages)
      .set({ body: input.body, channel: input.channel, tone: input.tone, language: input.language })
      .where(and(eq(outreachMessages.id, input.id), eq(outreachMessages.userId, user.id)));
    revalidatePath("/", "layout");
    return { ok: true, id: input.id };
  }
  const [row] = await db
    .insert(outreachMessages)
    .values({
      userId: user.id,
      businessId: input.businessId,
      channel: input.channel,
      tone: input.tone,
      language: input.language,
      body: input.body,
    })
    .returning();
  revalidatePath("/", "layout");
  return { ok: true, id: row.id };
}

export async function setOutreachStatus(id: string, status: string): Promise<{ ok?: boolean; error?: string }> {
  const user = await requireUser();
  const valid = ["draft", "sent", "delivered", "replied", "interested", "rejected", "suppressed"];
  if (!valid.includes(status)) return { error: "حالة غير صالحة." };
  const rows = await db
    .select()
    .from(outreachMessages)
    .where(and(eq(outreachMessages.id, id), eq(outreachMessages.userId, user.id)))
    .limit(1);
  const msg = rows[0];
  if (!msg) return { error: "الرسالة غير موجودة." };

  await db
    .update(outreachMessages)
    .set({ status, sentAt: status === "sent" && !msg.sentAt ? new Date() : msg.sentAt })
    .where(eq(outreachMessages.id, id));

  if (msg.businessId) {
    const biz = await ownBusiness(user.id, msg.businessId);
    if (biz) {
      let nextStage = biz.stage;
      if (status === "sent" && stageIdx(biz.stage) < stageIdx("contacted")) nextStage = "contacted";
      if (["replied", "interested"].includes(status) && stageIdx(biz.stage) < stageIdx(status)) nextStage = status;
      if (status === "rejected" && !["won", "negotiation", "proposal_sent"].includes(biz.stage)) nextStage = "lost";
      if (status === "suppressed") nextStage = "do_not_contact";
      if (nextStage !== biz.stage) {
        await db.update(businesses).set({ stage: nextStage, updatedAt: new Date() }).where(eq(businesses.id, biz.id));
      }
      if (["replied", "interested"].includes(status)) {
        await notify(user.id, "followup", `ردّ جديد من ${biz.name}`, "سجّلت ردًا على رسالة تواصل — حان وقت تحويله إلى عرض.");
      }
    }
  }
  await logActivity(user.id, "outreach", `حدّث حالة رسالة تواصل إلى: ${status}`);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function addConversationMessage(input: {
  conversationId?: string;
  businessId: string;
  channel: string;
  direction: "in" | "out";
  body: string;
}): Promise<{ ok?: boolean; error?: string }> {
  const user = await requireUser();
  if (!input.body.trim()) return { error: "نص الرسالة فارغ." };
  const biz = await ownBusiness(user.id, input.businessId);
  if (!biz) return { error: "النشاط غير موجود." };

  const entry = { dir: input.direction, body: input.body.trim(), at: new Date().toISOString() };

  if (input.conversationId) {
    const rows = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.id, input.conversationId), eq(conversations.userId, user.id)))
      .limit(1);
    const conv = rows[0];
    if (!conv) return { error: "المحادثة غير موجودة." };
    await db
      .update(conversations)
      .set({ messages: [...conv.messages, entry], updatedAt: new Date(), status: "active" })
      .where(eq(conversations.id, conv.id));
  } else {
    await db.insert(conversations).values({
      userId: user.id,
      businessId: input.businessId,
      channel: input.channel,
      messages: [entry],
    });
  }

  if (input.direction === "in" && stageIdx(biz.stage) < stageIdx("responded")) {
    await db.update(businesses).set({ stage: "responded", updatedAt: new Date() }).where(eq(businesses.id, biz.id));
  }
  await logActivity(
    user.id,
    "conversation",
    `${input.direction === "in" ? "استلم رسالة من" : "أرسل رسالة إلى"} ${biz.name}`
  );
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function listBusinessData(businessId: string) {
  const user = await requireUser();
  const [analyses, outreach, convs] = await Promise.all([
    db
      .select()
      .from(businessAnalyses)
      .where(and(eq(businessAnalyses.businessId, businessId), eq(businessAnalyses.userId, user.id)))
      .orderBy(desc(businessAnalyses.createdAt)),
    db
      .select()
      .from(outreachMessages)
      .where(and(eq(outreachMessages.businessId, businessId), eq(outreachMessages.userId, user.id)))
      .orderBy(desc(outreachMessages.createdAt)),
    db
      .select()
      .from(conversations)
      .where(and(eq(conversations.businessId, businessId), eq(conversations.userId, user.id)))
      .orderBy(desc(conversations.updatedAt)),
  ]);
  return { analyses, outreach, conversations: convs };
}
