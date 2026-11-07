import { db } from "@/db";
import { roadmapTasks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { getPhasesWithProgress, getSnapshot } from "@/lib/metrics";
import { fmtUsd } from "@/lib/utils";
import { Kicker, PageHeader, Panel } from "@/components/ui";
import { PhaseAccordion } from "@/components/roadmap-client";
import { Flag } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function RoadmapPage() {
  const user = await requireUser();
  const [phases, allTasks, snap] = await Promise.all([
    getPhasesWithProgress(user.id),
    db.select().from(roadmapTasks).where(eq(roadmapTasks.userId, user.id)),
    getSnapshot(user.id),
  ]);

  const tasksByPhase: Record<string, typeof allTasks> = {};
  for (const t of allTasks) {
    (tasksByPhase[t.phaseId] ??= []).push(t);
  }
  for (const k of Object.keys(tasksByPhase)) {
    tasksByPhase[k].sort((a, b) => a.idx - b.idx);
  }

  const recs: Record<string, string> = {};
  for (const p of phases) {
    const next = (tasksByPhase[p.id] ?? []).find((t) => t.status !== "done");
    if (p.computedStatus === "completed") recs[p.id] = "المرحلة مكتملة. حافظ على الزخم وانتقل للمرحلة التالية.";
    else if (next) recs[p.id] = `أولويتك الآن: «${next.titleAr}». ${next.evidenceHint ? `دليل الإنجاز: ${next.evidenceHint}.` : ""}`;
  }

  const overall = phases.length ? Math.round(phases.reduce((s, p) => s + p.progress, 0) / phases.length) : 0;

  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        kicker="MY ROADMAP — THE PATH TO $2,000"
        title="خارطة الطريق نحو أول $2,000"
        desc="خمس مراحل تنفيذية. المراحل لا تُفتح بمرور الوقت، بل بإنجاز حقيقي موثّق بالأدلة."
      />

      <Panel className="rise rise-1 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Flag className="h-4 w-4 text-gold" />
            <div>
              <div className="text-[12px] font-bold text-fog">التقدم الكلي في الخطة</div>
              <div className="mt-0.5 text-[10.5px] text-ash">
                محصّل فعليًا {fmtUsd(snap.goal.collected)} من {fmtUsd(snap.goal.target)} — الإجراءات تقود الإيراد، لا العكس.
              </div>
            </div>
          </div>
          <div className="fnum text-3xl font-black text-gold">{overall}%</div>
        </div>
      </Panel>

      <PhaseAccordion phases={phases} tasksByPhase={tasksByPhase} recs={recs} />
    </div>
  );
}
