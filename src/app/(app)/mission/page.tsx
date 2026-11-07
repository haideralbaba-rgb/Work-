import { db } from "@/db";
import { dailyMissions } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { ensureTodayMission } from "@/lib/missions";
import { fmtDateAr } from "@/lib/utils";
import { Badge, Kicker, PageHeader, Panel } from "@/components/ui";
import { GenerateMissionButton } from "@/components/dashboard-client";
import { ManualTaskForm, TaskList } from "@/components/tasks-client";
import { CheckCircle2, Crosshair, History, Target } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MissionPage() {
  const user = await requireUser();
  const data = await ensureTodayMission(user.id);
  const past = await db
    .select()
    .from(dailyMissions)
    .where(eq(dailyMissions.userId, user.id))
    .orderBy(desc(dailyMissions.date))
    .limit(8);
  const pastList = past.filter((m) => m.id !== data.mission.id);

  const doneCount = data.tasks.filter((t) => t.status === "done").length;
  const totalMinutes = data.tasks.filter((t) => t.status !== "done").reduce((s, t) => s + t.estMinutes, 0);

  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        kicker="TODAY'S MISSION — تنفيذ، لا تخطيط"
        title="مهمة اليوم"
        desc={fmtDateAr(new Date().toISOString())}
        actions={<GenerateMissionButton />}
      />

      <Panel className="rise rise-1 relative overflow-hidden p-6">
        <div className="absolute inset-y-0 start-0 w-1 bg-gold" />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2">
              <Crosshair className="h-4 w-4 text-gold" />
              <Kicker>PRIMARY MISSION</Kicker>
            </div>
            <h2 className="font-ar mt-3 text-2xl font-extrabold leading-relaxed text-fog">{data.mission.title}</h2>
            <p className="mt-2 text-[12.5px] leading-6 text-ash">{data.mission.focus}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {data.mission.status === "completed" ? (
              <Badge tone="green">
                <CheckCircle2 className="h-3 w-3" /> مكتملة
              </Badge>
            ) : (
              <Badge tone="gold">نشطة</Badge>
            )}
            <div className="fnum text-[11px] font-bold text-ash">
              {doneCount}/{data.tasks.length} مهام • ~{totalMinutes} د متبقية
            </div>
          </div>
        </div>
        <div className="mt-5 flex items-start gap-2.5 border border-gold/25 bg-gold/[0.05] px-4 py-3">
          <Target className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
          <div className="text-[12px] leading-5">
            <span className="font-bold text-gold">النتيجة القابلة للقياس اليوم: </span>
            <span className="text-fog">{data.mission.measurableResult}</span>
          </div>
        </div>
      </Panel>

      <section className="rise rise-2">
        <Kicker className="mb-3">EXECUTION LIST — قائمة التنفيذ</Kicker>
        <TaskList tasks={data.tasks} />
        <div className="mt-4">
          <ManualTaskForm />
        </div>
      </section>

      {pastList.length > 0 && (
        <section className="rise rise-3">
          <div className="mb-3 flex items-center gap-2">
            <History className="h-3.5 w-3.5 text-dim" />
            <Kicker>PREVIOUS MISSIONS — مهمات سابقة</Kicker>
          </div>
          <Panel className="p-1.5">
            {pastList.map((m) => (
              <div key={m.id} className="flex flex-wrap items-center gap-3 border-b border-line/60 px-4 py-3 last:border-0">
                <span className="fnum text-[10px] text-dim">{m.date}</span>
                <span className="flex-1 truncate text-[12px] font-semibold text-fog">{m.title}</span>
                {m.measurableResult && <span className="max-w-64 truncate text-[10px] text-ash">{m.measurableResult}</span>}
                {m.status === "completed" ? <Badge tone="green">مكتملة</Badge> : <Badge>غير مكتملة</Badge>}
              </div>
            ))}
          </Panel>
        </section>
      )}
    </div>
  );
}
