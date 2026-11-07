import { db } from "@/db";
import { dailyMissions, tasks, roadmapTasks } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getSnapshot, notify, type Snapshot } from "@/lib/metrics";
import { fmtUsd, todayKey } from "@/lib/utils";

type MissionTaskSeed = {
  title: string;
  why: string;
  steps: string[];
  estMinutes: number;
  tools: string;
  deliverable: string;
  completionCriteria: string;
  kind: "primary" | "supporting";
  roadmapTaskId?: string;
};

type MissionSeed = {
  title: string;
  focus: string;
  measurableResult: string;
  tasks: MissionTaskSeed[];
};

async function pendingFoundationTasks(userId: string) {
  const rows = await db.select().from(roadmapTasks).where(eq(roadmapTasks.userId, userId));
  return rows.filter((t) => t.status === "pending");
}

async function chooseMission(userId: string, snap: Snapshot): Promise<MissionSeed> {
  const phase1 = snap.roadmap.find((r) => r.idx === 1);
  const pending = await pendingFoundationTasks(userId);

  // 1 — Foundation not finished and still very early
  if (phase1 && phase1.progress < 70 && snap.counts.businesses < 5 && pending.length > 0) {
    const next = pending.slice(0, 4);
    return {
      title: "أكمل التأسيس — بسرعة",
      focus: `مرحلة التأسيس عند ${phase1.progress}%. أي تواصل مع عملاء قبل إتمامها يهدر فرصًا حقيقية. الهدف: أساس كامل خلال أيام، لا أسابيع.`,
      measurableResult: `إنجاز ${Math.min(2, next.length)} مهام تأسيس اليوم (${phase1.titleAr})`,
      tasks: next.map((t, i) => ({
        title: t.titleAr,
        why: t.descAr,
        steps: [
          "اقرأ وصف المهمة بعناية وحدد شكل النتيجة النهائية قبل البدء.",
          "نفّذ بتركيز كامل — أغلق كل المشتتات.",
          "سجّل دليل الإنجاز المطلوب (رابط، ملف، نص).",
          "علّم المهمة كمكتملة مع الدليل.",
        ],
        estMinutes: i === 0 ? 60 : 45,
        tools: "أدواتك الحالية + ملاحظات المنصة",
        deliverable: t.evidenceHint,
        completionCriteria: t.evidenceHint,
        kind: i === 0 ? ("primary" as const) : ("supporting" as const),
        roadmapTaskId: t.id,
      })),
    };
  }

  // 2 — Build prospect base
  if (snap.counts.businesses < 10) {
    const need = Math.max(5, 10 - snap.counts.businesses);
    return {
      title: "ابنِ قاعدة العملاء المحتملين",
      focus: `لديك ${snap.counts.businesses} جهات فقط. لا يمكن لاستراتيجية بيع أن تعمل بلا أسماء حقيقية. كربلاء مليئة بالفرص — المشكلة أنها غير مسجلة هنا بعد.`,
      measurableResult: `${need} جهات جديدة مسجلة مع حساب إنستغرام لكل منها`,
      tasks: [
        {
          title: `أضف ${need} مطاعم ومقاهٍ حقيقية من كربلاء`,
          why: "قاعدة العملاء هي وقود كل ما بعدها: التحليل، التواصل، العروض، الصفقات. بلا قاعدة، لا خط أنابيب.",
          steps: [
            "افتح إنستغرام وخرائط Google وابحث عن: مطاعم، مقاهي، مخابز، حلويات في كربلاء.",
            "لكل جهة: سجّل الاسم، الفئة، رابط إنستغرام.",
            "راقب محتواها 30 ثانية واكتب ملاحظة واحدة صادقة في حقل «الفرصة البصرية».",
            "أدخلها إلى قاعدة العملاء فورًا — لا تجمّع أسماء في ملاحظات منفصلة.",
          ],
          estMinutes: 60,
          tools: "إنستغرام، خرائط Google، قاعدة العملاء في المنصة",
          deliverable: `${need} سجلات جديدة كاملة الحد الأدنى من البيانات`,
          completionCriteria: "كل جهة لها: اسم + فئة + إنستغرام + ملاحظة فرصة واحدة",
          kind: "primary",
        },
        {
          title: "قيّم جودة المحتوى الحالي لأفضل 3 جهات",
          why: "الملاحظة الدقيقة هي مفتاح رسالة التواصل التي تُقرأ فعلًا.",
          steps: ["افتح حساب كل جهة ولاحظ: الإضاءة، التثبيت، الانتظام، التنوع.", "سجّل الفجوة الأوضح لكل واحدة."],
          estMinutes: 30,
          tools: "إنستغرام",
          deliverable: "3 ملاحظات فرص بصرية مسجلة",
          completionCriteria: "كل ملاحظة محددة وقابلة للذكر في رسالة",
          kind: "supporting",
        },
      ],
    };
  }

  // 3 — Analyze
  if (snap.counts.analyses < 3) {
    return {
      title: "حلّل عملاءك المحتملين",
      focus: `لديك ${snap.counts.businesses} جهة وتحليلان مكتملان فقط (${snap.counts.analyses}). التحليل يحوّل الاسم إلى فرصة مفهومة — وهو أساس التقييم والرسالة المخصصة.`,
      measurableResult: "3 تحليلات عميل مكتملة ومحفوظة",
      tasks: [
        {
          title: "شغّل تحليل العميل الذكي على 3 جهات من قاعدتك",
          why: "التحليل يحدد: الفرصة، الخدمة المناسبة، ومسودة الرسالة الأولى — ثلاثة أصول من إجراء واحد.",
          steps: [
            "افتح صفحة العميل في قاعدة العملاء.",
            "اكتب ملاحظاتك الحقيقية عن محتواه: الجودة، الأصناف، الانتظام.",
            "شغّل التحليل وراجع الفرق بين «المرصود» و«الفرضيات».",
            "حدّث مرحلة الجهة إلى «مؤهّل» إن كانت الفرصة واضحة.",
          ],
          estMinutes: 45,
          tools: "أداة تحليل العميل في المنصة + حساب إنستغرام للجهة",
          deliverable: "3 تحليلات محفوظة بدرجة ثقة معلنة",
          completionCriteria: "كل تحليل يتضمن فرصة محددة وخدمة مقترحة",
          kind: "primary",
        },
        {
          title: "حدّث تقييم العملاء (Lead Score) بإكمال بيانات التواصل",
          why: "التقييم يرتب أولوياتك: وقتك يذهب لأعلى 10 جهات فقط.",
          steps: ["أكمل الهاتف/صاحب القرار حيثما أمكن.", "راجع قائمة القاعدة مرتبة بالنقاط."],
          estMinutes: 25,
          tools: "قاعدة العملاء",
          deliverable: "5 جهات على الأقل بتقييم 60+",
          completionCriteria: "قائمة مرتبة حسب النقاط بدون جهات ناقصة البيانات الحرجة",
          kind: "supporting",
        },
      ],
    };
  }

  // 4 — Outreach
  if (snap.counts.contactable >= 3 && snap.counts.outreachTotal < snap.counts.businesses) {
    return {
      title: "تواصل مع 3 مطاعم مؤهلة",
      focus: "اليوم لا تحتاج فكرة جديدة. تحتاج محادثات حقيقية. 3 رسائل مخصصة أفضل من 30 رسالة منسوخة.",
      measurableResult: "3 رسائل تواصل مُرسلة ومسجلة بحالتها",
      tasks: [
        {
          title: "أرسل 3 رسائل تواصل مخصصة لجهات مؤهلة",
          why: "كل إيراد في هذا المشروع يبدأ بمحادثة. المحادثة تبدأ برسالة تذكر ملاحظة حقيقية وتعرض فكرة واحدة.",
          steps: [
            "راجع حساب إنستغرام لكل مطعم (5 دقائق لكل واحد).",
            "حدّد فرصة بصرية واحدة حقيقية لكل جهة.",
            "افتح رسالة التواصل المُعدّة في صفحة العميل.",
            "خصّص الجملة الأولى بالملاحظة الحقيقية.",
            "أرسل عبر القناة المصرّح بها (إنستغرام / واتساب أعمال / بريد).",
            "سجّل النتيجة وحالة الرسالة فورًا بعد الإرسال.",
            "حدّد موعد متابعة مسموحًا (بعد 3–4 أيام) في حقل «الإجراء التالي».",
          ],
          estMinutes: 75,
          tools: "قاعدة العملاء، كاتب التواصل الذكي، إنستغرام",
          deliverable: "3 رسائل بحالة «مُرسلة» مع تاريخ متابعة",
          completionCriteria: "كل رسالة مخصصة (ليست نسخًا حرفيًا) ومرسلة فعليًا",
          kind: "primary",
        },
        {
          title: "حضّر ردودك على الاعتراضات الثلاثة الأشهر",
          why: "«غالي»، «ما نحتاج»، «بعدين» — من يحضّر رده مسبقًا لا يتجمد في المحادثة.",
          steps: ["اكتب ردًا من سطرين لكل اعتراض يحترم العميل ويعيده للقيمة.", "احفظها في ملاحظاتك."],
          estMinutes: 20,
          tools: "ملاحظاتك",
          deliverable: "3 ردود جاهزة",
          completionCriteria: "كل رد يعترف بالاعتراض ثم يقدّم قيمة أو سؤالًا",
          kind: "supporting",
        },
      ],
    };
  }

  // 5 — Proposals
  if (snap.counts.conversationsActive > 0 && snap.counts.proposalsSent === 0) {
    return {
      title: "حوّل محادثة إلى عرض مكتوب",
      focus: `لديك ${snap.counts.conversationsActive} محادثات نشطة ولا عرض واحد مرسل. المحادثة بلا عرض واضح تبرد خلال أيام.`,
      measurableResult: "عرض سعر واحد مُرسل لأكثر محادثة وعدًا",
      tasks: [
        {
          title: "أنشئ وأرسل عرضًا واضحًا لأفضل عميل محتمل",
          why: "العرض المكتوب يحوّل الاهتمام الغامض إلى قرار محدد: مخرجات + مدة + سعر + شروط دفع.",
          steps: [
            "اختر المحادثة الأكثر وعدًا.",
            "افتح مولّد العروض واربطه بخدمة من قائمتك.",
            "راجع المخرجات والسعر — عدّل بيدك، لا الذكاء الاصطناعي يقرر سعرك.",
            "أرسل العرض عبر قناة المحادثة نفسها وسجّل حالته «مُرسل».",
            "حدّد متابعة بعد 48 ساعة.",
          ],
          estMinutes: 50,
          tools: "الخدمات والأسعار → مولّد العروض",
          deliverable: "عرض بحالة «مُرسل» مع موعد متابعة",
          completionCriteria: "العرض يتضمن مخرجات مرقّمة وسعرًا وشروط دفع",
          kind: "primary",
        },
        {
          title: "تابع المحادثات النشطة الأخرى برسالة قصيرة",
          why: "المتابعة الودودة بعد 3 أيام ترفع الردود دون إزعاج.",
          steps: ["راسل كل محادثة نشطة لم يُرَد عليها.", "سؤال واحد بسيط، لا ضغط."],
          estMinutes: 20,
          tools: "سجل المحادثات",
          deliverable: "كل محادثة نشطة لها رسالة متابعة مسجلة",
          completionCriteria: "لا محادثة نشطة بلا حركة منذ 3 أيام",
          kind: "supporting",
        },
      ],
    };
  }

  // 6 — Follow-up proposals
  if (snap.counts.proposalsSent > 0 && snap.counts.dealsWon === 0) {
    return {
      title: "أغلق: تابع العروض المعلّقة",
      focus: `لديك ${snap.counts.proposalsSent} عروض مرسلة ولا صفقة مغلقة. العرض بلا متابعة خلال 48 ساعة يموت بصمت.`,
      measurableResult: "رد واضح (قبول/رفض/تفاوض) على عرض واحد على الأقل",
      tasks: [
        {
          title: "تابع كل عرض مُرسل لم يُجَب عليه",
          why: "أغلب الصفقات تُغلق في المتابعة الأولى أو الثانية، لا في الرسالة الأولى.",
          steps: [
            "راجع قائمة العروض المرسلة.",
            "أرسل متابعة قصيرة: «هل اطلعتم على العرض؟ جاهز لأي استفسار».",
            "جهّز نسخة أصغر من العرض (فيديو واحد) لتقليل حاجز القرار عند الاعتراض على السعر.",
            "سجّل النتيجة: مهتم / تفاوض / مرفوض.",
          ],
          estMinutes: 40,
          tools: "الخدمات والأسعار، قناة التواصل نفسها",
          deliverable: "متابعة مسجلة لكل عرض معلّق",
          completionCriteria: "لا عرض مرسل بلا متابعة خلال 48 ساعة من إرساله",
          kind: "primary",
        },
      ],
    };
  }

  // 7 — Delivery
  if (snap.counts.projectsInProgress > 0) {
    return {
      title: "سلّم: مشروعك أولوية اليوم",
      focus: `لديك ${snap.counts.projectsInProgress} مشاريع قيد التنفيذ. التسليم الممتاز هو تسويقك الحقيقي: شهادة + دراسة حالة + إحالة.`,
      measurableResult: "تقدّم ملموس في التسليم: جلسة منفذة أو مونتاج مكتمل",
      tasks: [
        {
          title: "نفّذ/أكمل إنتاج المشروع المفتوح",
          why: "كل يوم تأخير في التسليم يؤخر الدفعة الأخيرة والشهادة والإحالة.",
          steps: [
            "راجع قائمة اللقطات وحدد ما تبقى بالضبط.",
            "نفّذ أو أكمل المونتاج بمعايير التسليم المتفق عليها.",
            "احفظ نسخة احتياطية فور الانتهاء.",
            "حدّث حالة التسليم في متتبع الإيرادات.",
          ],
          estMinutes: 120,
          tools: "معداتك + أداة المونتاج",
          deliverable: "المشروع جاهز للمراجعة أو التسليم",
          completionCriteria: "مخرجات مكتملة تحقق نطاق العرض المتفق عليه",
          kind: "primary",
        },
        {
          title: "وثّق كواليس اليوم لسكربت محتوى",
          why: "الكواليس أصدق محتوى تسويقي لديك — تثبت أنك تعمل فعلًا.",
          steps: ["صوّر 3–5 لقطات خلف الكواليس.", "افتح ستوديو المحتوى وولّد سكربت «كواليس تصوير»."],
          estMinutes: 25,
          tools: "هاتفك + ستوديو المحتوى",
          deliverable: "سكربت كواليس جاهز للنشر",
          completionCriteria: "سكربت محفوظ بلقطات من يوم العمل الفعلي",
          kind: "supporting",
        },
      ],
    };
  }

  // 8 — Weekly review / scaling
  return {
    title: "راجع وقرّر الخطوة التالية",
    focus: "المراجعة المنضبطة تمنع الانحراف. راقب الأرقام، حدّد الاختناق، نفّذ إجراءً واحدًا مؤثرًا.",
    measurableResult: "قرار واحد موثّق مبني على بيانات الأسبوع",
    tasks: [
      {
        title: "أجرِ مراجعة أسبوعية كاملة",
        why: "ما لا يُقاس لا يتحسن. المراجعة تكشف إن كانت المشكلة استهدافًا أو رسالة أو عرضًا أو متابعة.",
        steps: [
          "افتح صفحة المراجعة الأدائية.",
          "اقرأ مؤشرات القمع: اكتشاف → تواصل → رد → عرض → صفقة → تحصيل.",
          "حدّد أضعف حلقة واحدة فقط.",
          "اكتب قرارًا واحدًا لتحسينها هذا الأسبوع.",
        ],
        estMinutes: 30,
        tools: "صفحة المراجعة الأدائية",
        deliverable: "قرار أسبوعي واحد مسجل في الملاحظات",
        completionCriteria: "القرار مبني على رقم حقيقي من بياناتك",
        kind: "primary",
      },
      {
        title: `تابع تحصيل المستحقات (${fmtUsd(snap.revenue.outstanding)})`,
        why: "المتعاقَد عليه ليس إيرادًا. فقط المحصَّل يقرّبك من الهدف.",
        steps: ["راجع الصفقات المفتوحة.", "ذكّر بأي دفعة مستحقة برسالة مهذبة."],
        estMinutes: 15,
        tools: "متتبع الإيرادات",
        deliverable: "كل مستحق له تذكير مسجل",
        completionCriteria: "لا دفعة مستحقة بلا تذكير هذا الأسبوع",
        kind: "supporting",
      },
    ],
  };
}

export async function ensureTodayMission(userId: string) {
  const today = todayKey();
  const existing = await db
    .select()
    .from(dailyMissions)
    .where(and(eq(dailyMissions.userId, userId), eq(dailyMissions.date, today)))
    .limit(1);
  if (existing[0]) {
    const missionTasks = await db.select().from(tasks).where(eq(tasks.missionId, existing[0].id));
    return { mission: existing[0], tasks: missionTasks, created: false };
  }

  const snap = await getSnapshot(userId);
  const seed = await chooseMission(userId, snap);

  const [mission] = await db
    .insert(dailyMissions)
    .values({
      userId,
      date: today,
      title: seed.title,
      focus: seed.focus,
      measurableResult: seed.measurableResult,
    })
    .returning();

  await db.insert(tasks).values(
    seed.tasks.map((t) => ({
      userId,
      missionId: mission.id,
      title: t.title,
      why: t.why,
      steps: t.steps,
      estMinutes: t.estMinutes,
      tools: t.tools,
      deliverable: t.deliverable,
      completionCriteria: t.completionCriteria,
      kind: t.kind,
      roadmapTaskId: t.roadmapTaskId ?? null,
      dueDate: today,
    }))
  );

  await notify(userId, "mission", "مهمتك اليوم جاهزة", seed.title);
  const missionTasks = await db.select().from(tasks).where(eq(tasks.missionId, mission.id));
  return { mission, tasks: missionTasks, created: true };
}
