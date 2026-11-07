export function cn(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

export function n(v: string | number | null | undefined): number {
  const x = typeof v === "string" ? parseFloat(v) : v ?? 0;
  return Number.isFinite(x) ? x : 0;
}

export function fmtMoney(amount: number, currency = "USD"): string {
  const v = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.round(amount));
  return currency === "IQD" ? `${v} د.ع` : `$${v}`;
}

export function fmtUsd(amount: number): string {
  return `$${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.round(amount))}`;
}

export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function daysAgoKey(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return todayKey(d);
}

export function fmtDateAr(key: string | null | undefined): string {
  if (!key) return "—";
  const d = new Date(key.includes("T") ? key : `${key}T00:00:00`);
  if (Number.isNaN(d.getTime())) return key;
  return new Intl.DateTimeFormat("ar-IQ", { day: "numeric", month: "long", year: "numeric" }).format(d);
}

export function fmtDateShort(key: string | null | undefined): string {
  if (!key) return "—";
  const d = new Date(key.includes("T") ? key : `${key}T00:00:00`);
  if (Number.isNaN(d.getTime())) return key;
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" }).format(d);
}

export function timeAgoAr(iso: string | Date | null | undefined): string {
  if (!iso) return "";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "الآن";
  if (s < 3600) return `منذ ${Math.floor(s / 60)} د`;
  if (s < 86400) return `منذ ${Math.floor(s / 3600)} س`;
  if (s < 86400 * 30) return `منذ ${Math.floor(s / 86400)} يوم`;
  return fmtDateShort(d.toISOString());
}

/* ------------------------------- vocabularies ---------------------------- */

export const PIPELINE_STAGES = [
  { key: "discovered", ar: "مكتشَف", dot: "#6b6b6b" },
  { key: "researching", ar: "قيد البحث", dot: "#8a8a8a" },
  { key: "qualified", ar: "مؤهّل", dot: "#a9a9a9" },
  { key: "contact_eligible", ar: "جاهز للتواصل", dot: "#c9974b" },
  { key: "contacted", ar: "تم التواصل", dot: "#c7a56a" },
  { key: "responded", ar: "رَدّ", dot: "#c7a56a" },
  { key: "interested", ar: "مهتم", dot: "#dcc391" },
  { key: "proposal_sent", ar: "عرض مُرسل", dot: "#dcc391" },
  { key: "negotiation", ar: "تفاوض", dot: "#e6d2a3" },
  { key: "won", ar: "عميل فعلي", dot: "#7fae8e" },
  { key: "lost", ar: "خُسر", dot: "#c06a55" },
  { key: "do_not_contact", ar: "عدم تواصل", dot: "#5c3128" },
] as const;
export type StageKey = (typeof PIPELINE_STAGES)[number]["key"];
export const stageLabel = (k: string) => PIPELINE_STAGES.find((s) => s.key === k)?.ar ?? k;

export const CATEGORIES = [
  { key: "restaurant", ar: "مطعم" },
  { key: "cafe", ar: "مقهى / كوفي شوب" },
  { key: "bakery", ar: "مخبز / حلويات" },
  { key: "dessert", ar: "محل حلويات" },
  { key: "food_brand", ar: "براند غذائي" },
  { key: "fast_food", ar: "وجبات سريعة" },
  { key: "juice", ar: "عصائر / كوكتيل" },
  { key: "other", ar: "نشاط محلي آخر" },
] as const;
export const categoryLabel = (k: string) => CATEGORIES.find((c) => c.key === k)?.ar ?? k;

export const CHANNELS = [
  { key: "instagram", ar: "إنستغرام" },
  { key: "whatsapp", ar: "واتساب للأعمال" },
  { key: "email", ar: "بريد إلكتروني" },
] as const;
export const channelLabel = (k: string) => CHANNELS.find((c) => c.key === k)?.ar ?? k;

export const TONES = [
  { key: "professional", ar: "احترافي" },
  { key: "friendly", ar: "ودود" },
  { key: "confident", ar: "واثق" },
  { key: "direct", ar: "مباشر" },
] as const;
export const toneLabel = (k: string) => TONES.find((t) => t.key === k)?.ar ?? k;

export const OUTREACH_STATUSES = [
  { key: "draft", ar: "مسودة" },
  { key: "sent", ar: "مُرسلة" },
  { key: "delivered", ar: "تم التسليم" },
  { key: "replied", ar: "رَدّ" },
  { key: "interested", ar: "مهتم" },
  { key: "rejected", ar: "رَفَض" },
  { key: "suppressed", ar: "موقوف" },
] as const;
export const outreachStatusLabel = (k: string) => OUTREACH_STATUSES.find((s) => s.key === k)?.ar ?? k;

export const SCRIPT_TYPES = [
  { key: "reel", ar: "ريلز إنستغرام" },
  { key: "tiktok", ar: "تيك توك" },
  { key: "short", ar: "يوتيوب شورتس" },
  { key: "bts", ar: "كواليس تصوير" },
  { key: "case_study", ar: "دراسة حالة عميل" },
  { key: "ad", ar: "إعلان تجاري" },
  { key: "educational", ar: "محتوى تعليمي" },
  { key: "journey", ar: "رحلة بناء المشروع" },
] as const;
export const scriptTypeLabel = (k: string) => SCRIPT_TYPES.find((t) => t.key === k)?.ar ?? k;

export const SCRIPT_MODES = [
  { key: "confident", ar: "قوي وواثق" },
  { key: "spontaneous", ar: "عفوي" },
  { key: "educational", ar: "تعليمي" },
  { key: "cinematic", ar: "سينمائي" },
  { key: "commercial", ar: "إعلاني" },
  { key: "journey", ar: "رحلة شخصية" },
] as const;
export const scriptModeLabel = (k: string) => SCRIPT_MODES.find((m) => m.key === k)?.ar ?? k;

export const SERVICE_TYPES = [
  { key: "ad_video", ar: "فيديو إعلاني واحد" },
  { key: "product_photo", ar: "تصوير منتجات" },
  { key: "content_session", ar: "جلسة محتوى مطعم" },
  { key: "monthly_package", ar: "باقة محتوى شهرية" },
  { key: "custom", ar: "حزمة إنتاج مخصصة" },
] as const;
export const serviceTypeLabel = (k: string) => SERVICE_TYPES.find((t) => t.key === k)?.ar ?? k;

export const DEAL_STAGES = [
  { key: "quoted", ar: "سعري معروض" },
  { key: "negotiating", ar: "قيد التفاوض" },
  { key: "contracted", ar: "متعاقَد عليه" },
  { key: "invoiced", ar: "مُفوتر" },
  { key: "won", ar: "مكتسب" },
  { key: "lost", ar: "خاسر" },
] as const;
export const dealStageLabel = (k: string) => DEAL_STAGES.find((s) => s.key === k)?.ar ?? k;

export const DELIVERY_STATUSES = [
  { key: "not_started", ar: "لم يبدأ" },
  { key: "in_production", ar: "قيد الإنتاج" },
  { key: "delivered", ar: "تم التسليم" },
] as const;
export const deliveryLabel = (k: string) => DELIVERY_STATUSES.find((s) => s.key === k)?.ar ?? k;

export const PAYMENT_METHODS = [
  { key: "cash", ar: "نقد" },
  { key: "zaincash", ar: "زين كاش" },
  { key: "fastpay", ar: "فاست بي" },
  { key: "bank", ar: "تحويل مصرفي" },
  { key: "other", ar: "أخرى" },
] as const;
export const methodLabel = (k: string) => PAYMENT_METHODS.find((m) => m.key === k)?.ar ?? k;

export const EXPENSE_CATS = [
  { key: "equipment", ar: "معدات" },
  { key: "transport", ar: "تنقّل" },
  { key: "software", ar: "برامج واشتراكات" },
  { key: "marketing", ar: "تسويق" },
  { key: "props", ar: "إكسسوارات تصوير" },
  { key: "other", ar: "أخرى" },
] as const;
export const expenseCatLabel = (k: string) => EXPENSE_CATS.find((c) => c.key === k)?.ar ?? k;

export const PROPOSAL_STATUSES = [
  { key: "draft", ar: "مسودة" },
  { key: "sent", ar: "مُرسل" },
  { key: "accepted", ar: "مقبول" },
  { key: "rejected", ar: "مرفوض" },
  { key: "expired", ar: "منتهي" },
] as const;
export const proposalStatusLabel = (k: string) => PROPOSAL_STATUSES.find((s) => s.key === k)?.ar ?? k;
