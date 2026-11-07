import { db } from "@/db";
import { businesses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { computeReview, type ReviewMetrics } from "@/actions/strategist";
import { getSnapshot } from "@/lib/metrics";
import { cn, fmtUsd, PIPELINE_STAGES, stageLabel } from "@/lib/utils";
import { Kicker, PageHeader, Panel, Stat } from "@/components/ui";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

export const dynamic = "force-dynamic";

function InsightCard({ insight }: { insight: ReviewMetrics["insights"][number] }) {
  const map = {
    good: { border: "border-sage/30", bg: "bg-sage/[0.06]", icon: <CheckCircle2 className="h-4 w-4 text-sage" /> },
    warn: { border: "border-amber/30", bg: "bg-amber/[0.06]", icon: <Info className="h-4 w-4 text-amber" /> },
    bad: { border: "border-brick/40", bg: "bg-brick/[0.07]", icon: <AlertTriangle className="h-4 w-4 text-brick" /> },
  }[insight.tone];
  return (
    <div className={cn("flex items-start gap-3 border px-4 py-3.5", map.border, map.bg)}>
      <span className="mt-0.5 shrink-0">{map.icon}</span>
      <p className="text-[12px] leading-6 text-fog">{insight.text}</p>
    </div>
  );
}

function ReviewBlock({ title, review }: { title: string; review: ReviewMetrics }) {
  return (
    <Panel className="p-5">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="font-ar text-base font-extrabold text-fog">{title}</h2>
        <span className="fnum text-[9.5px] uppercase tracking-[0.25em] text-dim">{review.range}</span>
      </div>
      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-6">
        <Stat label="مهام منجزة" value={String(review.tasksCompleted)} />
        <Stat label="مهام متأخرة" value={String(review.tasksDelayed)} accent={review.tasksDelayed > 0 ? "#c06a55" : undefined} />
        <Stat label="جهات جديدة" value={String(review.newLeads)} />
        <Stat label="رسائل مرسلة" value={String(review.outreachSent)} />
        <Stat label="معدل الرد" value={`${review.responseRate}%`} accent={review.responseRate >= 20 ? "#7fae8e" : review.outreachSent > 0 ? "#c06a55" : undefined} />
        <Stat label="عروض مرسلة" value={String(review.proposalsSent)} />
        <Stat label="صفقات مغلقة" value={String(review.dealsClosed)} accent={review.dealsClosed > 0 ? "#7fae8e" : undefined} />
        <Stat label="محصَّل" value={fmtUsd(review.collected)} accent={review.collected > 0 ? "#7fae8e" : undefined} />
        <Stat label="مصاريف" value={fmtUsd(review.expenses)} />
        <Stat label="صافي" value={fmtUsd(review.profit)} accent={review.profit > 0 ? "#7fae8e" : undefined} />
        <Stat label="محتوى منشور" value={String(review.published)} />
        <Stat label="محادثات نشطة" value={String(review.activeConversations)} />
      </div>
      <div className="mt-4 flex flex-col gap-2">
        {review.insights.map((ins, i) => (
          <InsightCard key={i} insight={ins} />
        ))}
      </div>
    </Panel>
  );
}

export default async function PerformancePage() {
  const user = await requireUser();
  const [daily, weekly, snap, allBiz] = await Promise.all([
    computeReview(user.id, 1),
    computeReview(user.id, 7),
    getSnapshot(user.id),
    db.select().from(businesses).where(eq(businesses.userId, user.id)),
  ]);

  // funnel from CRM stages (only forward-facing stages)
  const funnelStages = ["discovered", "qualified", "contacted", "responded", "interested", "proposal_sent", "negotiation", "won"];
  const funnel = funnelStages.map((s) => ({
    key: s,
    label: stageLabel(s),
    count: allBiz.filter((b) => {
      const idxB = PIPELINE_STAGES.findIndex((x) => x.key === b.stage);
      const idxS = PIPELINE_STAGES.findIndex((x) => x.key === s);
      return idxB >= idxS && !["lost", "do_not_contact"].includes(b.stage);
    }).length,
  }));
  const maxFunnel = Math.max(1, funnel[0]?.count ?? 1);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        kicker="PERFORMANCE REVIEW"
        title="المراجعة الأدائية"
        desc="تشخيص بارد وصادق مبني على بياناتك المسجلة فقط. كل رأي هنا مرتبط برقم حقيقي."
      />

      {/* funnel */}
      <Panel className="rise rise-1 p-5">
        <Kicker className="mb-4">ACQUISITION FUNNEL — قمع الاكتساب</Kicker>
        <div className="flex flex-col gap-2">
          {funnel.map((f, i) => (
            <div key={f.key} className="flex items-center gap-3">
              <span className="w-20 shrink-0 text-end text-[10.5px] font-semibold text-ash">{f.label}</span>
              <div className="relative h-7 flex-1 bg-coal">
                <div
                  className={cn("h-full transition-all duration-700", f.count > 0 ? "bg-gold/85" : "bg-line/60")}
                  style={{ width: `${Math.max(f.count > 0 ? 6 : 1.5, (f.count / maxFunnel) * 100)}%` }}
                />
                <span className="fnum absolute inset-y-0 start-2 grid place-items-center text-[10px] font-black text-[#171307] mix-blend-normal" style={{ color: f.count > 0 ? "#171307" : "#636363" }}>
                  {f.count}
                </span>
              </div>
              {i > 0 && funnel[i - 1].count > 0 && (
                <span className="fnum w-12 text-[9px] text-dim">
                  {Math.round((f.count / funnel[i - 1].count) * 100)}%
                </span>
              )}
              {i === 0 && <span className="w-12" />}
            </div>
          ))}
        </div>
        <p className="mt-4 border-t border-line pt-3 text-[10px] leading-5 text-dim">
          النسب بين الصفوف هي معدلات الانتقال بين المراحل. أضعف معدل انتقال = الاختناق الحقيقي الذي يجب معالجته هذا الأسبوع.
        </p>
      </Panel>

      <div className="rise rise-2 grid gap-5 xl:grid-cols-2">
        <ReviewBlock title="مراجعة اليوم" review={daily} />
        <ReviewBlock title="مراجعة الأسبوع" review={weekly} />
      </div>

      <Panel className="rise rise-3 border-gold/25 bg-gold/[0.04] p-5">
        <Kicker>WHAT MOVES THE NUMBER</Kicker>
        <p className="mt-3 max-w-3xl text-[12.5px] leading-6 text-ash">
          حالتك الآن: {fmtUsd(snap.goal.collected)} محصّلة من {fmtUsd(snap.goal.target)}. الحلقات الوحيدة المؤثرة: محادثات جديدة →
          عروض أوضح → صفقات → تحصيل أسرع. أي نشاط خارج هذه السلسلة اليوم هو ترفٌ مؤجل.
        </p>
      </Panel>
    </div>
  );
}
