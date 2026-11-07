"use server";

import { db } from "@/db";
import { businesses, deals, expenses, payments, profiles, proposals, services } from "@/db/schema";
import { and, desc, eq, gt, lte } from "drizzle-orm";
import { requireUser, toUsd } from "@/lib/auth";
import { logActivity, notify } from "@/lib/metrics";
import { fmtUsd, n, todayKey } from "@/lib/utils";
import { revalidatePath } from "next/cache";

async function getRateFor(userId: string): Promise<number> {
  const p = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  const r = n(p[0]?.exchangeRate);
  return r > 0 ? r : 1310;
}

/* -------------------------------- services -------------------------------- */

export type ServiceInput = {
  id?: string;
  name: string;
  type: string;
  description: string;
  deliverables: string[];
  videosCount: number;
  photosCount: number;
  productionHours: number;
  editingHours: number;
  revisions: number;
  price: number;
  currency: string;
  estimatedCost: number;
  active: boolean;
};

export async function saveService(input: ServiceInput): Promise<{ ok?: boolean; error?: string }> {
  const user = await requireUser();
  if (!input.name.trim()) return { error: "اسم الخدمة مطلوب." };
  if (input.price <= 0) return { error: "حدّد سعرًا أكبر من صفر." };
  const payload = {
    name: input.name.trim(),
    type: input.type,
    description: input.description.trim(),
    deliverables: input.deliverables.filter(Boolean),
    videosCount: Math.max(0, input.videosCount || 0),
    photosCount: Math.max(0, input.photosCount || 0),
    productionHours: String(input.productionHours || 0),
    editingHours: String(input.editingHours || 0),
    revisions: Math.max(0, input.revisions ?? 2),
    price: String(input.price),
    currency: input.currency === "IQD" ? "IQD" : "USD",
    estimatedCost: String(input.estimatedCost || 0),
    active: input.active,
  };
  if (input.id) {
    await db
      .update(services)
      .set(payload)
      .where(and(eq(services.id, input.id), eq(services.userId, user.id)));
  } else {
    await db.insert(services).values({ userId: user.id, ...payload });
    await logActivity(user.id, "service", `عرّف خدمة جديدة: ${payload.name} — ${payload.price} ${payload.currency}`);
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteService(id: string): Promise<{ ok?: boolean }> {
  const user = await requireUser();
  await db.delete(services).where(and(eq(services.id, id), eq(services.userId, user.id)));
  revalidatePath("/", "layout");
  return { ok: true };
}

/* ------------------------------- proposals -------------------------------- */

export async function buildProposalDraft(input: { serviceId: string; businessId: string }) {
  const user = await requireUser();
  const [svcRows, bizRows] = await Promise.all([
    db.select().from(services).where(and(eq(services.id, input.serviceId), eq(services.userId, user.id))).limit(1),
    db.select().from(businesses).where(and(eq(businesses.id, input.businessId), eq(businesses.userId, user.id))).limit(1),
  ]);
  const svc = svcRows[0];
  const biz = bizRows[0];
  if (!svc || !biz) return { error: "اختر خدمة وعميلًا صالحين." };

  const totalHours = n(svc.productionHours) + n(svc.editingHours);
  const timeline =
    totalHours <= 8 ? "3–5 أيام عمل من تأكيد الطلب" : totalHours <= 20 ? "7–10 أيام عمل" : "10–14 يوم عمل";
  const concept = biz.visualOpportunity
    ? `مفهوم مبني على ملاحظة حقيقية عن ${biz.name}: ${biz.visualOpportunity}`
    : `جلسة إنتاج بصرية مخصصة لـ ${biz.name} تُبرز أقوى أصنافه بصور وفيديو عالي الجودة.`;

  return {
    ok: true,
    draft: {
      title: `عرض خدمات إنتاج محتوى — ${biz.name}`,
      overview: `يقترح هذا العرض تنفيذ «${svc.name}» لصالح ${biz.name}. الهدف: رفع جودة الحضور البصري للنشاط بمحتوى احترافي قابل للنشر فورًا على منصاته.`,
      concept,
      deliverables: svc.deliverables.length
        ? svc.deliverables
        : [
            svc.videosCount > 0 ? `${svc.videosCount} فيديو قصير جاهز للنشر` : "",
            svc.photosCount > 0 ? `${svc.photosCount} صورة منتج معدّلة احترافيًا` : "",
            "تسليم بجودة عالية عبر رابط تحميل",
          ].filter(Boolean),
      timeline,
      price: n(svc.price),
      currency: svc.currency,
      paymentTerms: "50% عربون عند تأكيد المشروع، و50% عند التسليم النهائي.",
      revisionPolicy: `حتى ${svc.revisions} جولات مراجعة ضمن النطاق المتفق عليه.`,
      businessId: biz.id,
      serviceId: svc.id,
    },
  };
}

export type ProposalInput = {
  id?: string;
  businessId?: string;
  serviceId?: string;
  title: string;
  overview: string;
  concept: string;
  deliverables: string[];
  timeline: string;
  price: number;
  currency: string;
  paymentTerms: string;
  revisionPolicy: string;
};

export async function saveProposal(input: ProposalInput): Promise<{ ok?: boolean; error?: string; id?: string }> {
  const user = await requireUser();
  if (!input.title.trim()) return { error: "عنوان العرض مطلوب." };
  if (input.price <= 0) return { error: "حدّد سعرًا أكبر من صفر في العرض." };
  const payload = {
    businessId: input.businessId || null,
    serviceId: input.serviceId || null,
    title: input.title.trim(),
    overview: input.overview,
    concept: input.concept,
    deliverables: input.deliverables.filter(Boolean),
    timeline: input.timeline,
    price: String(input.price),
    currency: input.currency === "IQD" ? "IQD" : "USD",
    paymentTerms: input.paymentTerms,
    revisionPolicy: input.revisionPolicy,
  };
  if (input.id) {
    await db
      .update(proposals)
      .set(payload)
      .where(and(eq(proposals.id, input.id), eq(proposals.userId, user.id)));
    revalidatePath("/", "layout");
    return { ok: true, id: input.id };
  }
  const [row] = await db.insert(proposals).values({ userId: user.id, ...payload }).returning();
  await logActivity(user.id, "proposal", `أنشأ عرضًا: ${payload.title}`);
  revalidatePath("/", "layout");
  return { ok: true, id: row.id };
}

export async function setProposalStatus(id: string, status: string): Promise<{ ok?: boolean; error?: string }> {
  const user = await requireUser();
  if (!["draft", "sent", "accepted", "rejected", "expired"].includes(status)) return { error: "حالة غير صالحة." };
  const rows = await db.select().from(proposals).where(and(eq(proposals.id, id), eq(proposals.userId, user.id))).limit(1);
  const prop = rows[0];
  if (!prop) return { error: "العرض غير موجود." };
  const rate = await getRateFor(user.id);

  await db
    .update(proposals)
    .set({ status, sentAt: status === "sent" && !prop.sentAt ? new Date() : prop.sentAt })
    .where(eq(proposals.id, id));

  if (status === "sent" && prop.businessId) {
    const [biz] = await db.select().from(businesses).where(eq(businesses.id, prop.businessId)).limit(1);
    if (biz && ["discovered", "researching", "qualified", "contact_eligible", "contacted", "responded", "interested"].includes(biz.stage)) {
      await db.update(businesses).set({ stage: "proposal_sent", updatedAt: new Date() }).where(eq(businesses.id, biz.id));
    }
    await logActivity(user.id, "proposal", `أرسل عرضًا: ${prop.title} — ${fmtUsd(toUsd(n(prop.price), prop.currency, rate))}`);
  }

  if (status === "accepted") {
    const usdValue = toUsd(n(prop.price), prop.currency, rate);
    const [deal] = await db
      .insert(deals)
      .values({
        userId: user.id,
        businessId: prop.businessId,
        proposalId: prop.id,
        title: prop.title,
        stage: "contracted",
        value: prop.price,
        currency: prop.currency,
        usdValue: String(usdValue),
      })
      .returning();
    if (prop.businessId) {
      await db.update(businesses).set({ stage: "won", updatedAt: new Date() }).where(eq(businesses.id, prop.businessId));
    }
    await notify(user.id, "deal", "تم قبول عرض — صفقة جديدة", `${prop.title} — ${fmtUsd(usdValue)}. لا تبدأ قبل تحصيل العربون.`);
    await logActivity(user.id, "deal", `قُبل العرض وتحول إلى صفقة: ${prop.title}`, { dealId: deal.id });
    // seed a payment reminder
    await notify(user.id, "payment", "تذكير بتحصيل العربون", `صفقة ${prop.title}: حصّل 50% قبل بدء الإنتاج.`);
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteProposal(id: string): Promise<{ ok?: boolean }> {
  const user = await requireUser();
  await db.delete(proposals).where(and(eq(proposals.id, id), eq(proposals.userId, user.id)));
  revalidatePath("/", "layout");
  return { ok: true };
}

/* ---------------------------------- deals --------------------------------- */

export async function setDealStage(id: string, stage: string): Promise<{ ok?: boolean; error?: string }> {
  const user = await requireUser();
  if (!["quoted", "negotiating", "contracted", "invoiced", "won", "lost"].includes(stage)) return { error: "مرحلة غير صالحة." };
  const rows = await db.select().from(deals).where(and(eq(deals.id, id), eq(deals.userId, user.id))).limit(1);
  const deal = rows[0];
  if (!deal) return { error: "الصفقة غير موجودة." };
  await db.update(deals).set({ stage, updatedAt: new Date() }).where(eq(deals.id, id));
  if (stage === "won") {
    await notify(user.id, "deal", "صفقة مكتسبة", `${deal.title} — تأكد من جدولة التسليم وتحصيل الدفعة الأخيرة.`);
  }
  await logActivity(user.id, "deal", `حدّث مرحلة صفقة «${deal.title}» إلى ${stage}`);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function setDeliveryStatus(id: string, status: string): Promise<{ ok?: boolean; error?: string }> {
  const user = await requireUser();
  if (!["not_started", "in_production", "delivered"].includes(status)) return { error: "حالة غير صالحة." };
  const rows = await db.select().from(deals).where(and(eq(deals.id, id), eq(deals.userId, user.id))).limit(1);
  if (!rows[0]) return { error: "الصفقة غير موجودة." };
  await db.update(deals).set({ deliveryStatus: status, updatedAt: new Date() }).where(eq(deals.id, id));
  if (status === "delivered") {
    await logActivity(user.id, "delivery", `سلّم مشروع: ${rows[0].title}`);
    await notify(user.id, "deal", "اكتمل تسليم مشروع", `${rows[0].title} — اطلب شهادة العميل وإحالة الآن.`);
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteDeal(id: string): Promise<{ ok?: boolean }> {
  const user = await requireUser();
  await db.delete(deals).where(and(eq(deals.id, id), eq(deals.userId, user.id)));
  revalidatePath("/", "layout");
  return { ok: true };
}

/* --------------------------------- payments -------------------------------- */

export async function recordPayment(input: {
  dealId?: string;
  businessId?: string;
  amount: number;
  currency: string;
  method: string;
  note: string;
  receivedAt?: string;
}): Promise<{ ok?: boolean; error?: string }> {
  const user = await requireUser();
  if (!(input.amount > 0)) return { error: "أدخل مبلغًا صحيحًا أكبر من صفر." };
  const rate = await getRateFor(user.id);
  const usd = toUsd(input.amount, input.currency, rate);

  await db.insert(payments).values({
    userId: user.id,
    dealId: input.dealId || null,
    businessId: input.businessId || null,
    amount: String(input.amount),
    currency: input.currency === "IQD" ? "IQD" : "USD",
    usdAmount: String(usd),
    method: input.method || "cash",
    note: input.note.trim(),
    receivedAt: input.receivedAt || todayKey(),
  });

  await logActivity(user.id, "payment", `سجّل دفعة محصّلة: ${fmtUsd(usd)} (${input.amount} ${input.currency})`);

  // goal milestone check
  const allPayments = await db.select().from(payments).where(eq(payments.userId, user.id));
  const collected = allPayments.reduce((s, p) => s + n(p.usdAmount), 0);
  const p = await db.select().from(profiles).where(eq(profiles.userId, user.id)).limit(1);
  const target = Math.max(1, n(p[0]?.financialTarget) || 2000);
  const pct = (collected / target) * 100;
  const prevPct = ((collected - usd) / target) * 100;
  for (const mark of [25, 50, 75, 100]) {
    if (prevPct < mark && pct >= mark) {
      await notify(
        user.id,
        "goal",
        mark === 100 ? "اكتمل الهدف: $2,000 محصّلة" : `بلغت ${mark}% من هدفك المالي`,
        `المحصّل الآن ${fmtUsd(collected)} من ${fmtUsd(target)}.`
      );
    }
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deletePayment(id: string): Promise<{ ok?: boolean }> {
  const user = await requireUser();
  await db.delete(payments).where(and(eq(payments.id, id), eq(payments.userId, user.id)));
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function saveExpense(input: {
  id?: string;
  dealId?: string;
  title: string;
  amount: number;
  currency: string;
  category: string;
}): Promise<{ ok?: boolean; error?: string }> {
  const user = await requireUser();
  if (!input.title.trim()) return { error: "وصف المصروف مطلوب." };
  if (!(input.amount > 0)) return { error: "أدخل مبلغًا صحيحًا." };
  const rate = await getRateFor(user.id);
  const payload = {
    dealId: input.dealId || null,
    title: input.title.trim(),
    amount: String(input.amount),
    currency: input.currency === "IQD" ? "IQD" : "USD",
    usdAmount: String(toUsd(input.amount, input.currency, rate)),
    category: input.category || "other",
  };
  if (input.id) {
    await db.update(expenses).set(payload).where(and(eq(expenses.id, input.id), eq(expenses.userId, user.id)));
  } else {
    await db.insert(expenses).values({ userId: user.id, ...payload });
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteExpense(id: string): Promise<{ ok?: boolean }> {
  const user = await requireUser();
  await db.delete(expenses).where(and(eq(expenses.id, id), eq(expenses.userId, user.id)));
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function getPaymentsForDeals(userId: string) {
  return db.select().from(payments).where(eq(payments.userId, userId)).orderBy(desc(payments.createdAt));
}

// referenced lte/gt guard — kept for future range filters without breaking lint
void gt;
void lte;
