import { db } from "@/db";
import { businesses, conversations } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { getOverdueFollowups, getSnapshot } from "@/lib/metrics";
import { ensureTodayMission } from "@/lib/missions";
import { fmtUsd, fmtDateShort, timeAgoAr } from "@/lib/utils";
import { Badge, GoalRing, Kicker, Panel, Stat } from "@/components/ui";
import { LinkCard, StartMissionButton, WeeklyBars } from "@/components/dashboard-client";
import { TaskList } from "@/components/tasks-client";
import {
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  FileText,
  Flame,
  MessageSquare,
  Radio,
  Target,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const snap = await getSnapshot(user.id);
  const todayMission = await ensureTodayMission(user.id);
  const followups = await getOverdueFollowups(user.id);
  const convs = await db
    .select({ id: conversations.id, updatedAt: conversations.updatedAt, channel: conversations.channel, messages: conversations.messages, bizName: businesses.name })
    .from(conversations)
    .innerJoin(businesses, eq(conversations.businessId, businesses.id))
    .where(and(eq(conversations.userId, user.id), eq(conversations.status, "active")))
    .orderBy(desc(conversations.updatedAt))
    .limit(5);

  const phase = snap.roadmap.find((r) => r.computedStatus !== "completed");
  const primaryTask = todayMission.tasks.find((t) => t.kind === "primary" && t.status !== "done");
  const weekTotal = snap.payments7.reduce((s, p) => s + p.amount, 0);
  const pendingTasks = todayMission.tasks.filter((t) => t.status !== "done");

  return (
    <div className="flex flex-col gap-8">
      {/* hero */}
      <section className="rise flex flex-wrap items-end justify-between gap-6 border-b border-line pb-8">
        <div>
          <Kicker>COMMAND CENTER — {new Date().toLocaleDateString("en-GB", { weekday: "long" })}</Kicker>
          <h1 className="font-ar mt-4 max-w-2xl text-3xl font-extrabold leading-[1.35] text-fog md:text-[2.6rem] md:leading-[1.3]">
            أنت لا تبني مجرد عمل حر.
            <br />
            أنت تبني <span className="text-gold">شركة.</span>
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {phase && (
              <Badge tone="gold">
                المرحلة {String(phase.idx).padStart(2, "0")} — {phase.titleAr} ({phase.progress}%)
              </Badge>
            )}
            <Badge>{snap.profile?.location ?? "كربلاء، العراق"}</Badge>
            <Badge>{snap.profile?.specialization ?? "محتوى بصري للأغذية والضيافة"}</Badge>
          </div>
        </div>
        <Link href="/mission" className="group hidden items-center gap-2 text-[11px] font-semibold text-ash transition-colors hover:text-gold md:flex">
          إلى مهمة اليوم <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
        </Link>
      </section>

      {/* goal + revenue */}
      <section className="rise rise-1 grid gap-4 lg:grid-cols-5">
        <Panel className="relative overflow-hidden p-6 lg:col-span-2">
          <div className="flex items-start justify-between">
            <div>
              <Kicker>FINANCIAL MILESTONE</Kicker>
              <div className="mt-3 text-[11px] font-semibold text-ash">الهدف: إيراد محصّل فعليًا</div>
            </div>
            <Wallet className="h-4 w-4 text-dim" />
          </div>
          <div className="mt-4 flex items-center justify-center py-2">
            <GoalRing pct={snap.goal.pct}>
              <div className="text-center">
                <div className="fnum text-[26px] font-black tracking-tight text-fog">{fmtUsd(snap.goal.collected)}</div>
                <div className="fnum mt-0.5 text-[11px] font-semibold text-dim">/ {fmtUsd(snap.goal.target)}</div>
                <div className="fnum mt-1 text-[10px] font-bold text-gold">{snap.goal.pct}%</div>
              </div>
            </GoalRing>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-center">
            <div className="border border-line bg-coal px-2 py-2.5">
              <div className="fnum text-sm font-bold text-fog">{fmtUsd(snap.goal.remaining)}</div>
              <div className="mt-0.5 text-[9.5px] text-dim">المتبقي</div>
            </div>
            <div className="border border-line bg-coal px-2 py-2.5">
              <div className="fnum text-sm font-bold text-gold">{fmtUsd(weekTotal)}</div>
              <div className="mt-0.5 text-[9.5px] text-dim">محصّل آخر 7 أيام</div>
            </div>
          </div>
          <div className="mt-4">
            <WeeklyBars data={snap.payments7} />
            <div className="mt-1.5 text-center text-[9px] text-dim">الإيراد المحصّل يوميًا — من بيانات الدفعات الفعلية فقط</div>
          </div>
        </Panel>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:col-span-3">
          <Stat label="الإيراد المحصّل" value={fmtUsd(snap.revenue.collected)} icon={<Wallet className="h-3.5 w-3.5" />} accent="#7fae8e" hint="مقبوض فعليًا" />
          <Stat label="مستحقات غير محصّلة" value={fmtUsd(snap.revenue.outstanding)} icon={<Flame className="h-3.5 w-3.5" />} accent="#c9974b" hint="متعاقَد/مفوتر ولم يُقبض" />
          <Stat label="إيراد معروض (عروض)" value={fmtUsd(snap.revenue.quoted + snap.revenue.negotiating)} icon={<FileText className="h-3.5 w-3.5" />} hint="ليس إيرادًا بعد" />
          <Stat label="عملاء فعليون" value={String(snap.counts.activeClients)} icon={<Users className="h-3.5 w-3.5" />} hint="صفقة مكتسبة" />
          <Stat label="عملاء مؤهلون" value={String(snap.counts.qualified)} icon={<Target className="h-3.5 w-3.5" />} hint={`من أصل ${snap.counts.businesses} جهة`} />
          <Stat label="عروض معلّقة" value={String(snap.counts.proposalsSent)} icon={<FileText className="h-3.5 w-3.5" />} hint="بانتظار الرد" />
          <Stat label="مشاريع قيد التنفيذ" value={String(snap.counts.projectsInProgress)} icon={<Briefcase className="h-3.5 w-3.5" />} />
          <Stat label="مشاريع مكتملة" value={String(snap.counts.completedProjects)} icon={<CheckCircle2 className="h-3.5 w-3.5" />} accent="#7fae8e" />
          <Stat label="صافي الربح" value={fmtUsd(snap.revenue.netProfit)} icon={<Radio className="h-3.5 w-3.5" />} hint={`بعد مصاريف ${fmtUsd(snap.revenue.expenses)}`} />
        </div>
      </section>

      {/* next move */}
      <section className="rise rise-2">
        <Panel className="relative overflow-hidden">
          <div className="absolute inset-y-0 start-0 w-1 bg-gold" />
          <div className="p-6 md:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Kicker>YOUR NEXT MOVE — خطوتك التالية</Kicker>
              {todayMission.mission.status === "completed" && pendingTasks.length === 0 && <Badge tone="green">مهمة اليوم مكتملة</Badge>}
            </div>
            <h2 className="font-ar mt-3 text-xl font-extrabold leading-relaxed text-fog md:text-2xl">
              {primaryTask ? primaryTask.title : todayMission.mission.title}
            </h2>
            <p className="mt-2 max-w-3xl text-[12.5px] leading-6 text-ash">
              {primaryTask?.why || todayMission.mission.focus}
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto]">
              <div className="flex flex-col gap-3">
                {primaryTask && primaryTask.steps.length > 0 && (
                  <ol className="grid gap-1.5 sm:grid-cols-2">
                    {primaryTask.steps.slice(0, 6).map((s, i) => (
                      <li key={i} className="flex items-start gap-2 border border-line/70 bg-coal px-3 py-2 text-[11.5px] leading-5 text-ash">
                        <span className="fnum mt-0.5 grid h-4 w-4 shrink-0 place-items-center border border-gold/30 text-[9px] font-bold text-gold">
                          {i + 1}
                        </span>
                        {s}
                      </li>
                    ))}
                  </ol>
                )}
                <div className="flex flex-wrap gap-2 text-[10px]">
                  <Badge tone="gold">
                    <Flame className="h-3 w-3" /> النتيجة المتوقعة: {todayMission.mission.measurableResult || "تقدّم قابل للقياس"}
                  </Badge>
                  {primaryTask && <Badge>⏱ {primaryTask.estMinutes} دقيقة تقريبًا</Badge>}
                </div>
              </div>
              <div className="flex items-end">
                <StartMissionButton taskId={primaryTask?.id} done={!primaryTask && pendingTasks.length === 0} />
              </div>
            </div>
          </div>
        </Panel>
      </section>

      {/* tasks + activity columns */}
      <section className="rise rise-3 grid gap-5 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <Kicker>TODAY'S EXECUTION — مهام اليوم</Kicker>
            <Link href="/mission" className="text-[10.5px] font-semibold text-gold hover:text-goldsoft">
              التفاصيل الكاملة ←
            </Link>
          </div>
          <TaskList tasks={todayMission.tasks} compact />
        </div>

        <div className="flex flex-col gap-5 lg:col-span-2">
          {/* deadlines */}
          <div>
            <Kicker className="mb-3">DEADLINES & FOLLOW-UPS — مواعيد ومتابعات</Kicker>
            <Panel className="p-1.5">
              {snap.tasks.overdue.length === 0 && followups.length === 0 && (
                <div className="px-3 py-6 text-center text-[11px] text-dim">لا مواعيد متأخرة. استمر.</div>
              )}
              {snap.tasks.overdue.slice(0, 3).map((t) => (
                <div key={t.id} className="flex items-center gap-2.5 border-b border-line/60 px-3 py-2.5 last:border-0">
                  <Badge tone="red">متأخرة</Badge>
                  <span className="flex-1 truncate text-[11.5px] font-semibold text-fog">{t.title}</span>
                  <span className="fnum text-[9.5px] text-dim">{fmtDateShort(t.dueDate)}</span>
                </div>
              ))}
              {followups.slice(0, 5).map((b) => (
                <LinkCard key={b.id} href="/clients" className="flex items-center gap-2.5 border-b border-line/60 px-3 py-2.5 last:border-0">
                  <Badge tone="amber">متابعة</Badge>
                  <span className="flex-1 truncate text-[11.5px] font-semibold text-fog">{b.name}</span>
                  <span className="max-w-28 truncate text-[9.5px] text-dim">{b.nextAction}</span>
                </LinkCard>
              ))}
            </Panel>
          </div>

          {/* conversations */}
          <div>
            <Kicker className="mb-3">ACTIVE CONVERSATIONS — محادثات نشطة</Kicker>
            <Panel className="p-1.5">
              {convs.length === 0 && (
                <div className="px-3 py-6 text-center text-[11px] leading-5 text-dim">
                  لا محادثات نشطة بعد. سجّل ردود العملاء هنا لتبقى الصورة دقيقة.
                </div>
              )}
              {convs.map((c) => {
                const last = c.messages[c.messages.length - 1];
                return (
                  <LinkCard key={c.id} href="/clients" className="flex items-center gap-2.5 border-b border-line/60 px-3 py-2.5 last:border-0">
                    <MessageSquare className="h-3.5 w-3.5 shrink-0 text-gold" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[11.5px] font-bold text-fog">{c.bizName}</div>
                      {last && <div className="truncate text-[9.5px] text-dim">{last.body}</div>}
                    </div>
                    <span className="shrink-0 text-[9px] text-dim">{timeAgoAr(c.updatedAt)}</span>
                  </LinkCard>
                );
              })}
            </Panel>
          </div>

          {/* activity */}
          <div>
            <Kicker className="mb-3">LATEST ACTIVITY — آخر النشاطات</Kicker>
            <Panel className="p-1.5">
              {snap.recentActivity.length === 0 && (
                <div className="px-3 py-6 text-center text-[11px] text-dim">سيظهر سجل نشاطك الحقيقي هنا.</div>
              )}
              {snap.recentActivity.slice(0, 7).map((a) => (
                <div key={a.id} className="flex items-center gap-2.5 border-b border-line/60 px-3 py-2 last:border-0">
                  <span className="h-1 w-1 shrink-0 rounded-full bg-gold" />
                  <span className="flex-1 truncate text-[11px] text-ash">{a.summary}</span>
                  <span className="shrink-0 text-[9px] text-dim">{timeAgoAr(a.createdAt)}</span>
                </div>
              ))}
            </Panel>
          </div>
        </div>
      </section>
    </div>
  );
}
