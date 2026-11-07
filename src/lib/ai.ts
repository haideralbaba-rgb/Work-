import type { Business, Service, Profile } from "@/db/schema";
import type { Snapshot } from "@/lib/metrics";
import { categoryLabel, fmtUsd, n, scriptModeLabel, scriptTypeLabel } from "@/lib/utils";

/* ------------------------------ core prompt ------------------------------- */

export const CORE_SYSTEM_PROMPT = `You are the strategic operating partner of an independent creative entrepreneur in Karbala, Iraq.

Your job is to help the user build a profitable commercial photography and video production business serving restaurants, cafes, bakeries and food brands.

The financial milestone is $2,000 in COLLECTED revenue. Only collected payments count.

Rules:
- Do not confuse activity with progress. Do not confuse followers with customers. Do not confuse proposals with revenue.
- Do not recommend endless preparation when direct execution is needed.
- Use the user's actual business data provided below. Never invent business facts, customer responses, achievements, or financial results.
- Never guarantee that a specific action will generate a customer or a specific amount of revenue. Be honest about uncertainty.
- Identify the single most important bottleneck and recommend the highest-impact next action.
- Break complicated objectives into executable steps.
- Adapt to the user's equipment, skill level, time, and budget.
- Challenge weak decisions respectfully. Do not simply agree with everything.
- Answer in natural, confident, conversational Arabic (Iraqi-friendly Modern Standard Arabic). No clichés, no empty motivation, no formal speeches.
- Priorities: 1) credible offer 2) strong portfolio 3) qualified prospects 4) real conversations 5) paid projects 6) excellent delivery 7) recurring relationships 8) $2,000 collected.
- Every response must end with one concrete next action prefixed with "الخطوة التالية:".`;

/* ------------------------------ openai call ------------------------------- */

async function askOpenAI(system: string, user: string): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 28000);
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: ctrl.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        temperature: 0.7,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return json.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}

/* --------------------------- context compression -------------------------- */

export function snapshotContext(snap: Snapshot): string {
  const p = snap.profile;
  const phase = snap.roadmap.find((r) => r.computedStatus !== "completed");
  return [
    `الملف التجاري: ${p?.businessName || "غير مسمّى"} — ${p?.location ?? "Karbala"} — تخصص: ${p?.specialization ?? "-"}`,
    `الهدف المالي: ${fmtUsd(snap.goal.target)} | المحصّل فعليًا: ${fmtUsd(snap.goal.collected)} (${snap.goal.pct}%) | المتبقي: ${fmtUsd(snap.goal.remaining)}`,
    `ساعات العمل المتاحة أسبوعيًا: ${p?.weeklyHours ?? "?"} | معدات: ${(p?.equipment ?? []).join("، ") || "غير محددة"}`,
    `المرحلة الحالية من الخارطة: ${phase ? `${phase.idx} — ${phase.titleAr} (${phase.progress}%)` : "مكتملة"}`,
    `قاعدة العملاء: ${snap.counts.businesses} جهة | مؤهل: ${snap.counts.qualified} | تحليلات: ${snap.counts.analyses} | محادثات نشطة: ${snap.counts.conversationsActive}`,
    `رسائل تواصل مرسلة (إجمالي/آخر 7 أيام): ${snap.counts.outreachTotal}/${snap.counts.outreachSent7d} | عروض مرسلة: ${snap.counts.proposalsSent}`,
    `صفقات مفتوحة: ${snap.counts.dealsOpen} | عملاء فعليون: ${snap.counts.activeClients} | مشاريع قيد التنفيذ: ${snap.counts.projectsInProgress} | مكتملة: ${snap.counts.completedProjects}`,
    `إيراد معروض: ${fmtUsd(snap.revenue.quoted)} | متعاقد: ${fmtUsd(snap.revenue.contracted + snap.revenue.invoiced)} | مستحقات غير محصلة: ${fmtUsd(snap.revenue.outstanding)} | مصاريف: ${fmtUsd(snap.revenue.expenses)} | صافي: ${fmtUsd(snap.revenue.netProfit)}`,
    `مهام مفتوحة: ${snap.tasks.open} | مكتملة اليوم: ${snap.tasks.doneToday} | متأخرة: ${snap.tasks.overdue.length}`,
    `محتوى منشور: ${snap.counts.publishedContent}`,
  ].join("\n");
}

/* ------------------------------ strategist -------------------------------- */

export async function strategistReply(
  message: string,
  snap: Snapshot,
  history: { role: string; content: string }[]
): Promise<string> {
  const ctx = snapshotContext(snap);
  const convo = history
    .slice(-12)
    .map((m) => `${m.role === "user" ? "المستخدم" : "المستشار"}: ${m.content}`)
    .join("\n");
  const ai = await askOpenAI(
    CORE_SYSTEM_PROMPT,
    `بيانات المستخدم الحالية:\n${ctx}\n\nآخر المحادثة:\n${convo || "(لا يوجد)"}\n\nسؤال المستخدم الآن: ${message}`
  );
  if (ai) return ai;
  return heuristicStrategist(message, snap);
}

function funnel(snap: Snapshot) {
  return {
    leads: snap.counts.businesses,
    qualified: snap.counts.qualified,
    contacted: snap.counts.outreachTotal,
    proposals: snap.counts.proposalsSent,
    deals: snap.counts.dealsWon + snap.counts.dealsOpen,
    collected: snap.goal.collected,
  };
}

function bottleneckAnalysis(snap: Snapshot): { title: string; body: string; action: string } {
  const f = funnel(snap);
  const phase1 = snap.roadmap.find((r) => r.idx === 1);
  if (phase1 && phase1.progress < 70) {
    return {
      title: "التشخيص: أساس غير مكتمل",
      body: `ما زال ${phase1.totalCount - phase1.doneCount} من ${phase1.totalCount} مهام التأسيس غير منجزة. لا يمكن بيع خدمة بلا عرض واضح وسوق أعمال — أي تواصل الآن سيهدر فرصًا حقيقية. أنهِ التأسيس أولًا، لكن بسرعة: التأسيس يُقاس بالأيام لا بالأسابيع.`,
      action: "أنجز اليوم أول مهمة تأسيس مفتوحة في خارطة الطريق، ثم انتقل للعثور على عملاء حقيقيين.",
    };
  }
  if (f.leads < 10) {
    return {
      title: "التشخيص: قاعدة عملاء شبه فارغة",
      body: `لديك ${f.leads} جهات فقط مسجلة. لا يمكن لأي استراتيجية بيع أن تعمل بلا أسماء حقيقية. كربلاء مليئة بالمطاعم والمقاهي — المشكلة ليست السوق، المشكلة أن قاعدة البيانات لم تُبنَ بعد.`,
      action: `أضف اليوم ${Math.max(5, 10 - f.leads)} مطاعم ومقاهٍ حقيقية من كربلاء إلى قاعدة العملاء مع حسابات إنستغرام الخاصة بها.`,
    };
  }
  if (f.contacted === 0) {
    return {
      title: "التشخيص: لم يبدأ البيع بعد",
      body: `قاعدة العملاء فيها ${f.leads} جهة (${f.qualified} مؤهلة) لكن لم تُرسل أي رسالة تواصل. كل التحضير السابق له قيمة صفرية حتى تبدأ محادثات حقيقية.`,
      action: "افتح قاعدة العملاء، اختر 3 جهات مؤهلة، وأرسل لكل واحدة رسالة مخصصة تذكر ملاحظة حقيقية عن محتواها الحالي.",
    };
  }
  if (f.contacted >= 8 && f.proposals === 0) {
    const replyRate = Math.round((snap.counts.conversationsActive / f.contacted) * 100);
    return {
      title: "التشخيص: الرسائل لا تتحول إلى عروض",
      body: `أرسلت ${f.contacted} رسالة ومعدل التحول إلى محادثة ${replyRate}%. إما أن الاستهداف غير دقيق، أو الرسالة تتحدث عنك بدل الحديث عن فرصتهم. راجع آخر الرسائل: هل ذكرت ملاحظة محددة عن نشاطهم؟ هل عرضت فكرة واحدة واضحة؟`,
      action: "أعد كتابة الرسالة القياسية: ملاحظة حقيقية + فكرة محددة + سؤال بسيط. جرّبها على 3 جهات جديدة اليوم.",
    };
  }
  if (f.proposals > 0 && f.deals === 0) {
    return {
      title: "التشخيص: عروض معلقة بلا إغلاق",
      body: `لديك ${f.proposals} عروض مرسلة ولا صفقة واحدة مغلقة. غالبًا المشكلة: متابعة ضعيفة، أو عرض غير واضح المخرجات، أو قفزة سعر كبيرة لعميل أول. عرض بلا متابعة خلال 48 ساعة يموت.`,
      action: "تابع اليوم كل عرض مرسل برسالة قصيرة، وقدّم نسخة أصغر من العرض (فيديو واحد مثلًا) لتقليل حاجز القرار.",
    };
  }
  if (f.deals > 0 && f.collected === 0) {
    return {
      title: "التشخيص: صفقات بلا تحصيل",
      body: `لديك ${f.deals} صفقة لكن المحصّل فعليًا $0. الصفقة الورقية ليست إيرادًا. القاعدة: لا يبدأ أي عمل قبل عربون 50%.`,
      action: "اتفق اليوم على تحصيل عربون الصفقة المفتوحة وسجّله في متتبع الإيرادات لحظة استلامه.",
    };
  }
  if (f.collected < snap.goal.target / 2) {
    return {
      title: "التشخيص: الزخم موجود — ارفع قيمة الصفقة",
      body: `حصّلت ${fmtUsd(f.collected)} من ${fmtUsd(snap.goal.target)}. للوصول أسرع: ارفع متوسط قيمة الصفقة بدل مضاعفة عدد العملاء. باقة شهرية واحدة بـ $300 تساوي ثلاث صفقات صغيرة.`,
      action: "أنشئ باقة محتوى شهرية في قسم الخدمات واعرضها على أسعد عميل سابق لديك هذا الأسبوع.",
    };
  }
  return {
    title: "التشخيص: قريب من الهدف — ركّز على التحصيل",
    body: `أنت عند ${fmtUsd(f.collected)} من ${fmtUsd(snap.goal.target)} (${snap.goal.pct}%). الآن الأولوية المطلقة: تحصيل المستحقات (${fmtUsd(snap.revenue.outstanding)}) وإغلاق الصفقات المفتوحة قبل أي نشاط جانبي.`,
    action: "راجع متتبع الإيرادات: حوّل كل مبلغ «متعاقد عليه» إلى «محصّل» هذا الأسبوع.",
  };
}

function heuristicStrategist(message: string, snap: Snapshot): string {
  const m = message;
  const analysis = bottleneckAnalysis(snap);
  const lines: string[] = [];

  const answered =
    /(سكربت|سيناريو|سكريبت)/.test(m) ? scriptAdvice(snap) :
    /(سعر|أسعار|تسعير|كم أطلب|pricing)/i.test(m) ? pricingAdvice(snap) :
    /(محتوى|ريلز|تيك توك|انستا)/.test(m) ? contentAdvice(snap) :
    /(عميل|عملاء|زبائن|مطعم|مطاعم)/.test(m) ? clientAdvice(snap) :
    /(إيراد|فلوس|ربح|مصاري|دفع|revenue)/i.test(m) ? revenueAdvice(snap) :
    null;

  if (answered) {
    lines.push(answered, "", `**${analysis.title}**`, analysis.body, "", `الخطوة التالية: ${analysis.action}`);
  } else {
    lines.push(
      `**${analysis.title}**`,
      analysis.body,
      "",
      "قاعدة ثابتة: النشاط ليس تقدمًا. التقدم الوحيد الذي يُقاس هو: محادثات حقيقية → عروض → صفقات → مبالغ محصّلة.",
      "",
      `الخطوة التالية: ${analysis.action}`
    );
  }
  return lines.join("\n");
}

function scriptAdvice(snap: Snapshot): string {
  return `السكربتات الآن يجب أن تخدم هدفين: بناء الثقة (حسابك هو واجهة مكتبك) وتوثيق الرحلة بصدق. وضعك الحالي: ${fmtUsd(snap.goal.collected)} محصّلة و${snap.counts.activeClients} عملاء — اكتب من هذا الواقع، لا فوقه. افتح «ستوديو المحتوى»، اختر نوع «رحلة بناء المشروع» بنمط «عفوي»، وسأبني لك سكربتًا كاملًا بهوك ولقطات وتعليق صوتي.`;
}

function pricingAdvice(snap: Snapshot): string {
  const avgDeal = snap.counts.dealsWon > 0 ? Math.round(snap.goal.collected / snap.counts.dealsWon) : 0;
  return `التسعير الصحيح = (وقت الإنتاج + المونتاج) × قيمة ساعتك + التكاليف، ثم مقارنة بالسوق المحلي في كربلاء. ${avgDeal > 0 ? `متوسط صفقتك الحالي ${fmtUsd(avgDeal)} — ` : ""}لا تبدأ بأقل مما يجعلك تسلّم بجودة عالية، ولا تخفض السعر عند الاعتراض — قلّص النطاق (فيديو واحد بدل ثلاثة). سجّل خدماتك في «الخدمات والأسعار» مع التكلفة التقديرية وسأحسب لك هامش الربح فورًا.`;
}

function contentAdvice(snap: Snapshot): string {
  return `القاعدة الآن: 70% من طاقتك لاكتساب العملاء و30% للمحتوى الشخصي — لأن المحتوى بدون عملاء هواية، والعملاء بدون محتوى أصعب لكنه تجارة. انشر 2–3 قطع أسبوعيًا توثّق رحلتك الحقيقية: ${snap.counts.businesses} جهة مكتشفة، ${snap.counts.outreachTotal} رسالة مرسلة، ${fmtUsd(snap.goal.collected)} محصّلة. هذه الأرقام الحقيقية هي أقوى محتوى لديك.`;
}

function clientAdvice(snap: Snapshot): string {
  const f = funnel(snap);
  return `وضع خط العملاء لديك: ${f.leads} مكتشفة → ${f.qualified} مؤهلة → ${f.contacted} تم التواصل معها → ${f.proposals} عروض → ${f.deals} صفقات → ${fmtUsd(f.collected)} محصّلة. أضعف حلقة في هذا السلسل هي أولويتك الوحيدة اليوم — ولا شيء غيرها.`;
}

function revenueAdvice(snap: Snapshot): string {
  return `الصورة المالية: محصّل ${fmtUsd(snap.revenue.collected)} • متعاقد غير محصّل ${fmtUsd(snap.revenue.outstanding)} • معروض ${fmtUsd(snap.revenue.quoted)} • مصاريف ${fmtUsd(snap.revenue.expenses)} • صافي ${fmtUsd(snap.revenue.netProfit)}. تذكّر: العرض ليس إيرادًا، والعقد ليس تحصيلًا. الأرقام التي في البنك هي فقط ما يقرّبك من الـ ${fmtUsd(snap.goal.target)}.`;
}

/* ------------------------------ script writer ----------------------------- */

export type ScriptParams = {
  type: string;
  mode: string;
  topic: string;
  language: string;
  businessName?: string;
};

export type GeneratedScript = {
  title: string;
  hook: string;
  story: string;
  conflict: string;
  insight: string;
  visualDirection: string;
  shotList: string[];
  voiceover: string;
  ending: string;
  caption: string;
  cta: string;
  commercial: {
    cameraMovement?: string;
    lighting?: string;
    soundDesign?: string;
    editingNotes?: string;
    adMessage?: string;
  };
};

export async function generateScript(params: ScriptParams, snap: Snapshot): Promise<GeneratedScript> {
  const p = snap.profile;
  const ctx = snapshotContext(snap);
  const ai = await askOpenAI(
    `${CORE_SYSTEM_PROMPT}

أنت الآن كاتب سكربتات محترف. اكتب سكربتًا بالعربية الطبيعية (عامية عراقية راقية مفهومة) لصانع محتوى يوثّق رحلته في بناء استوديو إنتاج في كربلاء. ممنوع: الخطابات التحفيزية، الكليشيهات، ادّعاء إنجازات لم تحدث، الهوكات المتكررة.
استجب فقط بـ JSON بهذا الشكل بالضبط:
{"title":"","hook":"","story":"","conflict":"","insight":"","visualDirection":"","shotList":["",""],"voiceover":"","ending":"","caption":"","cta":"","commercial":{"cameraMovement":"","lighting":"","soundDesign":"","editingNotes":"","adMessage":""}}`,
    `بيانات الرحلة الحالية:\n${ctx}\n\nاطلب سكربت: النوع=${scriptTypeLabel(params.type)} | النمط=${scriptModeLabel(params.mode)} | الموضوع=${params.topic || "من اختيارك بناءً على بيانات الرحلة"} | اللغة=${params.language === "en" ? "English" : "العربية"}${params.businessName ? ` | لصالح: ${params.businessName}` : ""}`
  );
  if (ai) {
    try {
      const json = JSON.parse(ai.replace(/```json|```/g, "").trim()) as GeneratedScript;
      return {
        title: json.title ?? "",
        hook: json.hook ?? "",
        story: json.story ?? "",
        conflict: json.conflict ?? "",
        insight: json.insight ?? "",
        visualDirection: json.visualDirection ?? "",
        shotList: Array.isArray(json.shotList) ? json.shotList : [],
        voiceover: json.voiceover ?? "",
        ending: json.ending ?? "",
        caption: json.caption ?? "",
        cta: json.cta ?? "",
        commercial: json.commercial ?? {},
      };
    } catch {
      /* fall through to heuristic */
    }
  }
  return heuristicScript(params, snap, p);
}

function heuristicScript(params: ScriptParams, snap: Snapshot, p: Profile | null): GeneratedScript {
  const name = p?.businessName || "مشروعي";
  const collected = fmtUsd(snap.goal.collected);
  const target = fmtUsd(snap.goal.target);
  const phase = snap.roadmap.find((r) => r.computedStatus !== "completed");
  const topic = params.topic || "رحلة بناء مشروع إنتاج إبداعي في كربلاء";
  const isAd = params.type === "ad" || params.mode === "commercial";
  const biz = params.businessName || "المطعم";

  if (isAd) {
    return {
      title: `إعلان: ${topic} — ${biz}`,
      hook: `لقطة ماكرو بطيئة للطبق والبخار يتصاعد — بلا أي كلام في أول ثانيتين.`,
      story: `${biz} عنده منتج يستاهل يتشاف بطريقة مختلفة. هالفيديو يخلي الناس «تجوع» وهي تتفرج.`,
      conflict: "أغلب إعلانات المطاعم صور ثابتة وموسيقى عامة — الزبون يتجاوزها بدون ما يحس بشيء.",
      insight: "الناس ما تشتري طبق، تشتري الإحساس اللي قبل الطبق: الجوع، الفضول، الرغبة.",
      visualDirection: "إضاءة جانبية دافئة (نافذة أو softbox)، خلفية داكنة، ألوان الطعام هي البطلة. إيقاع مونتاج سريع (0.5–1 ث للقطة) مع لقطات slow motion مختارة.",
      shotList: [
        "لقطة مقرّبة: المكوّن الرئيسي وهو يُجهّز (تقطيع/سكب/شوي)",
        "حركة كاميرا دائرية حول الطبق النهائي",
        "لقطة بخار أو صلصة تُسكب — slow motion",
        "تفاعل حقيقي: يد تلتقط اللقمة أو مجموعة على الطاولة",
        "لقطة واسعة أخيرة: الطبق + شعار " + biz,
      ],
      voiceover: `«جوعان؟ هذي مو بس صورة. ${biz} — تعال وجرب بنفسك.»`,
      ending: "شاشة سوداء مع اسم المطعم والموقع، وساوند افكت بسيط.",
      caption: `${biz} | الطعم اللي يستاهل التجربة 📍 كربلاء`,
      cta: "احجز طاولتك / اطلب الآن — الرابط بالبايو.",
      commercial: {
        cameraMovement: "Gimbal بطيء + حركة Push-in على لحظات الذروة، ولقطة Orbit واحدة حول الطبق الرئيسي.",
        lighting: "مصدر رئيسي جانبي 45° + إضاءة خلفية خافتة للفصل. درجة حرارة لونية دافئة 3200–4300K.",
        soundDesign: "أصوات حقيقية من المطبخ (قرمشة، سكب، همس شعلة) + مقطع موسيقي خافت بإيقاع 90–100 BPM.",
        editingNotes: "المونتاج على إيقاع الموسيقى، اللقطات 0.5–1.5 ثانية، تصحيح لوني يبرز الأحمر والذهبي في الطعام.",
        adMessage: `${biz} — تجربة تبدأ من أول لقطة.`,
      },
    };
  }

  const journeyBase = snap.goal.collected === 0
    ? `بدأت من الصفر: ${snap.counts.businesses > 0 ? `${snap.counts.businesses} جهة اكتشفتها` : "قاعدة عملاء أبنيها يوميًا"}، ${snap.counts.outreachTotal > 0 ? `${snap.counts.outreachTotal} رسالة أرسلتها` : "رسائل أولى بالطريق"}، والهدف واضح: أول ${target} إيراد محصّل.`
    : `حتى الآن حصّلت ${collected} من ${target} — والطريق صار أوضح: ${snap.counts.activeClients} عملاء و${snap.counts.publishedContent} محتويات منشورة.`;

  return {
    title: `${scriptModeLabel(params.mode)}: ${topic}`,
    hook: params.mode === "spontaneous"
      ? "«صراحة؟ محد يحچي وياك عن هالجزء من الرحلة…»"
      : "«الكل يريد يفتح مشروع. القليل يعرف شون يبدأ بأول عميل.»",
    story: `اليوم في ${name}: ${journeyBase} المرحلة الحالية: ${phase ? phase.titleAr : "التوسع"} — وهذا هو الشغل الحقيقي، مو المحتوى اللامع اللي تشوفه عادة.`,
    conflict: "أصعب شي مو التصوير نفسه — أصعب شي إنك تقنع صاحب مطعم مشغول إن صورة أحسن تعني مبيعات أحسن، قبل ما يشوف أي نتيجة.",
    insight: "اكتشفت إن العميل ما يشتري «فيديو». يشتري صورتك في باله عن مطعمه بعد شغلك. لما فهمت هالشي، تغيّرت طريقة حچيي كلها.",
    visualDirection: params.mode === "cinematic"
      ? "إضاءة طبيعية منخفضة، درجات لونية خافتة، لقطات يد تهتز قليلًا للمصداقية، وB-Roll من الشغل الفعلي."
      : "كاميرا ثابتة على مستوى النظر، خلفية ورشة العمل الحقيقية، إضاءة بسيطة وواضحة — الصدق قبل الجمال.",
    shotList: [
      "لقطة افتتاحية: وجه مباشر للكاميرا مع الهوك",
      "B-Roll: تجهيز المعدات / مراجعة قائمة اللقطات",
      "لقطة شاشة أو دفتر: الرقم الحقيقي للرحلة اليوم",
      "لقطة من موقع التصوير (إن وجدت)",
      "لقطة ختامية وجهًا للكاميرا مع الخلاصة",
    ],
    voiceover: `«${journeyBase} أنا ما أسوي هالمحتوى عشان أبين ناجح. أسويه عشان أوثق شلون تنبنى شركة من كربلاء، خطوة خطوة. تابع الرحلة، والجاي أهم.»`,
    ending: "سؤال للجمهور: «إنت لو بمكاني، شنو أول خطوة تسويها؟»",
    caption: `📍 كربلاء | ${topic} — الهدف: ${target} إيراد حقيقي. التقدم: ${collected}. #رحلة_بناء #تصوير_تجاري #كربلاء`,
    cta: "تابع الحساب لمتابعة الرحلة، وإذا عندك مطعم في كربلاء — راسلني.",
    commercial: {},
  };
}

/* ---------------------------- business analysis --------------------------- */

export type AnalysisResult = {
  summary: string;
  evidence: string[];
  hypotheses: string[];
  opportunities: string[];
  concept: string;
  recommendedService: string;
  outreachDraft: string;
  confidence: number;
};

export async function analyzeBusiness(
  input: string,
  business: Business | null,
  userServices: Service[]
): Promise<AnalysisResult> {
  const ai = await askOpenAI(
    `${CORE_SYSTEM_PROMPT}

حلّل النشاط التجاري التالي بناءً فقط على الملاحظات المُدخلة. فرّق بدقة بين حقائق مرصودة (من النص) وفرضيات (استنتاجاتك). لا تدّعِ أن محتواهم سيئ ما لم تذكر الملاحظات ذلك. استجب فقط بـ JSON:
{"summary":"","evidence":[""],"hypotheses":[""],"opportunities":[""],"concept":"","recommendedService":"","outreachDraft":"","confidence":50}`,
    `اسم النشاط: ${business?.name ?? "غير محدد"} | الفئة: ${business ? categoryLabel(business.category) : "غير محددة"} | الموقع: ${business?.location ?? "كربلاء"}\nملاحظات المستخدم: ${input}`
  );
  if (ai) {
    try {
      const j = JSON.parse(ai.replace(/```json|```/g, "").trim()) as AnalysisResult;
      return {
        summary: j.summary ?? "",
        evidence: Array.isArray(j.evidence) ? j.evidence : [],
        hypotheses: Array.isArray(j.hypotheses) ? j.hypotheses : [],
        opportunities: Array.isArray(j.opportunities) ? j.opportunities : [],
        concept: j.concept ?? "",
        recommendedService: j.recommendedService ?? "",
        outreachDraft: j.outreachDraft ?? "",
        confidence: Math.min(95, Math.max(10, n(j.confidence) || 50)),
      };
    } catch {
      /* fallthrough */
    }
  }
  return heuristicAnalysis(input, business, userServices);
}

function heuristicAnalysis(input: string, business: Business | null, userServices: Service[]): AnalysisResult {
  const cat = business ? categoryLabel(business.category) : "مطعم";
  const name = business?.name ?? "هذا النشاط";
  const text = input.trim();
  const evidence: string[] = [];
  const hypotheses: string[] = [];
  const opportunities: string[] = [];

  const sentences = text.split(/[.\n،؛]+/).map((s) => s.trim()).filter((s) => s.length > 3);
  for (const s of sentences.slice(0, 6)) evidence.push(`مرصود (من ملاحظاتك): ${s}`);

  const poor = /(ضعيف|سيئ|قديم|عشوائي|غير واضح|باهت|ماكو تصوير|بدون محتوى|محدث|قديمة)/.test(text);
  const hasMenu = /(منيو|قائمة|أصناف|أطباق)/.test(text);
  const hasInsta = /(انستا|إنستا|instagram)/i.test(text);

  if (poor) evidence.push("مرصود: ذُكر أن جودة المحتوى الحالي منخفضة أو غير منتظمة.");
  else hypotheses.push(`فرضية: لم تُذكر جودة المحتوى الحالي — تحقق من حسابهم قبل افتراض ضعفه.`);
  if (hasMenu) hypotheses.push(`فرضية: وجود منيو متنوع يعني فرصة لسلسلة «طبق اليوم» بدل إعلان واحد.`);
  if (hasInsta) evidence.push("مرصود: لديهم حضور على إنستغرام.");
  else hypotheses.push("فرضية: قناة إنستغرام غير مؤكدة — تحقق قبل اختيار قناة التواصل.");

  opportunities.push(`لقطة بطل (Hero Shot) للطبق الأشهر في ${name} — قابلة للاستخدام إعلانًا وبروفايل.`);
  opportunities.push("فيديو قصير 15–20 ثانية يوثّق لحظة تحضير الطبق — الأعلى تفاعلًا في محتوى الطعام.");
  if (hasMenu) opportunities.push("جلسة تصوير منيو كاملة تخدمهم في الطلبات والقائمة الإلكترونية.");
  opportunities.push("محتوى «كواليس المطبخ» يبني ثقة ويظهر النظافة والحِرفة.");

  const monthly = userServices.find((s) => s.type === "monthly_package");
  const session = userServices.find((s) => s.type === "content_session");
  const recommendedService = monthly && hasMenu ? monthly.name : session ? session.name : userServices[0]?.name ?? "جلسة محتوى مطعم (3 فيديوهات + 15 صورة)";

  const concept = poor
    ? `حملة «المذاق كما يجب أن يُرى»: إعادة تصوير الأصناف الرئيسية بإضاءة طبيعية دافئة وزوايا ماكرو، مع فيديو تحضير واحد بطيء الإيقاع.`
    : `قصة «من المطبخ إلى الطاولة»: يوم كامل داخل ${name} — التحضير، الطبخ، التقديم — بروح سينمائية خفيفة.`;

  const firstEvidence = sentences[0] ?? `نشاطكم في مجال ${cat}`;
  const outreachDraft = `السلام عليكم، أنا مصوّر محتوى تجاري متخصص بالمطاعم في كربلاء. لاحظت ${firstEvidence} — وعندي فكرة محتوى محددة ممكن تفيدكم أعرضها عليكم بخمس دقائق؟`;

  return {
    summary: `${name} — ${cat} في ${business?.location ?? "كربلاء"}. ${text.length > 120 ? text.slice(0, 120) + "…" : text}`,
    evidence: evidence.length ? evidence : ["مرصود: لا توجد ملاحظات مفصلة بعد — التحليل مبني على حد أدنى من المدخلات."],
    hypotheses,
    opportunities,
    concept,
    recommendedService,
    outreachDraft,
    confidence: Math.min(80, 35 + Math.round(text.length / 15)),
  };
}

/* ------------------------------ outreach writer --------------------------- */

export function generateOutreachMessage(
  business: Business,
  tone: string,
  channel: string,
  language: string
): string {
  const name = business.name;
  const cat = categoryLabel(business.category);
  const obs =
    business.visualOpportunity ||
    (business.analysisSummary ? business.analysisSummary.split(".")[0] : "") ||
    `نشاطكم كـ${cat} في ${business.location}`;
  const idea = business.recommendedService
    ? `عندي فكرة محددة: ${business.recommendedService}`
    : "عندي فكرة محتوى قصيرة مصممة لنشاطكم تحديدًا";

  const openers: Record<string, string> = {
    professional: "السلام عليكم وتحية طيبة،",
    friendly: "أهلاً!",
    confident: "مرحبًا،",
    direct: "مرحبًا — سأكون مباشرًا،",
  };
  const closers: Record<string, string> = {
    professional: "إن كان الموضوع يهمّكم، يسعدني أن أرسل الفكرة كاملة في رسالة واحدة قصيرة. مع خالص التقدير.",
    friendly: "إذا حابين تسمعون الفكرة دزولي رد بسيط وأرسلها فورًا 😊".replace(" 😊", " —"),
    confident: "خمس دقائق من وقتكم تكفي لتقييم الفكرة. أنتظر ردكم.",
    direct: "نعم أو لا — أي رد يُحترم. شكرًا لوقتكم.",
  };
  const opener = openers[tone] ?? openers.professional;
  const closer = closers[tone] ?? closers.professional;

  const ar = `${opener}
أنا مصوّر وصانع محتوى تجاري متخصص بالمطاعم والمقاهي في كربلاء.
كنت أتابع ${name} ولاحظت: ${obs}.
${idea} — وأعتقد أنها تستطيع رفع مستوى حضوركم البصري وجلب زبائن جدد.
${closer}`;

  if (language === "en") {
    return `${openers[tone] ? "" : ""}Hello,
I'm a commercial photographer & video producer specializing in restaurants and cafes in Karbala.
I came across ${name} and noticed: ${obs}.
${idea} — I believe it can measurably improve your visual presence.
If relevant, I'd be glad to send the full idea in one short message. Thank you for your time.`;
  }
  if (channel === "email") {
    return `الموضوع: فكرة محتوى محددة لـ ${name}\n\n${ar}`;
  }
  return ar;
}
