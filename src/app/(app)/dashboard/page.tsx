import { db } from "@/db";
import { businesses, conversations } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { getOverdueFollowups, getSnapshot } from "@/lib/metrics";
import { ensureTodayMission } from "@/lib/missions";
import { fmtUsd, fmtDateShort, timeAgoAr } from "@/lib/utils";
import { Badge, GoalRing, Kicker, Panel, Stat } from "@/components/ui";
import { SpotlightCard } from "@/components/motion-ui";
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
  Sparkles,
  Target,
  TrendingUp,
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
    .select({
      id: conversations.id,
      updatedAt: conversations.updatedAt,
      channel: conversations.channel,
      messages: conversations.messages,
      bizName: businesses.name,
    })
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
      {/* hero banner */}
      <section className="rise flex flex-wrap items-end justify-between gap-6 border-b border-white/[0.08] pb-8">
        <div>
          <div className="flex items-center gap-2.5">
            <Kicker>COMMAND CENTER — {new Date().toLocaleDateString("en-GB", { weekday: "long" })}</Kicker>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] animate-pulse" />
              نظام نشط
            </span>
          </div>
          <h1 className="font-ar mt-4 max-w-2xl text-3xl font-black leading-[1.35] text-fog md:text-[2.65rem] md:leading-[1.3] bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
            أنت لا تبني مجرد عمل حر.
            <br />
            أنت تبني <span className="text-gold underline decoration-gold/30 underline-offset-8">شركة.</span>
          </h1>
          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            {phase && (
              <Badge tone="gold">
                المرحلة {String(phase.idx).padStart(2, "0")} — {phase.titleAr} ({phase.progress}%)
              </Badge>
            )}
            <Badge tone="gray">{snap.profile?.location ?? "كربلاء، العراق"}</Badge>
            <Badge tone="gray">{snap.profile?.specialization ?? "محتوى بصري للأغذية والضيافة"}</Badge>
          </div>
        </div>
        <Link
          href="/mission"
          className="group flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs font-bold text-slate-300 transition-all hover:border-gold/40 hover:bg-gold/[0.06] hover:text-gold"
        >
          <span>إلى مهمة اليوم</span>
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
        </Link>
      </section>

      {/* goal milestone & metrics grid */}
      <section className="rise rise-1 grid gap-5 lg:grid-cols-5">
        <SpotlightCard className="p-6 md:p-7 lg:col-span-2">
          <div className="flex items-start justify-between">
            <div>
              <Kicker>FINANCIAL MILESTONE</Kicker>
              <div className="mt-2 text-xs font-bold text-fog">الهدف المالي: إيراد محصّل فعلياً</div>
            </div>
            <div className="grid h-8 w-8 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-gold">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-5 flex items-center justify-center py-3">
            <GoalRing pct={snap.goal.pct}>
              <div className="text-center">
                <div className="fnum text-[28px] font-black tracking-tight text-fog">{fmtUsd(snap.goal.collected)}</div>
                <div className="fnum mt-0.5 text-xs font-semibold text-dim">/ {fmtUsd(snap.goal.target)}</div>
                <div className="fnum mt-1 text-[11px] font-extrabold text-gold">{snap.goal.pct}%</div>
              </div>
            </GoalRing>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2.5 text-center">
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 shadow-inner">
              <div className="fnum text-sm font-bold text-fog">{fmtUsd(snap.goal.remaining)}</div>
              <div className="mt-0.5 text-[10px] text-dim">المتبقي للهدف</div>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 shadow-inner">
              <div className="fnum text-sm font-bold text-gold">{fmtUsd(weekTotal)}</div>
              <div className="mt-0.5 text-[10px] text-dim">محصّل آخر 7 أيام</div>
            </div>
          </div>
          <div className="mt-5">
            <WeeklyBars data={snap.payments7} />
            <div className="mt-2 text-center text-[10px] text-dim">الإيراد المحصّل يومياً — بيانات الدفعات الفعلية المؤكدة</div>
          </div>
        </SpotlightCard>

        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:col-span-3">
          <Stat
            label="الإيراد المحصّل"
            value={fmtUsd(snap.revenue.collected)}
            icon={<Wallet className="h-4 w-4 text-emerald-400" />}
            accent="#34d399"
            hint="مقبوض فعلياً"
          />
          <Stat
            label="مستحقات غير محصلة"
            value={fmtUsd(snap.revenue.outstanding)}
            icon={<Flame className="h-4 w-4 text-amber-400" />}
            accent="#fbbf24"
            hint="متعاقَد/مفوتر بانتظار القبض"
          />
          <Stat
            label="إيراد معروض (عروض)"
            value={fmtUsd(snap.revenue.quoted + snap.revenue.negotiating)}
            icon={<FileText className="h-4 w-4 text-slate-300" />}
            hint="عروض ومفاوضات جارية"
          />
          <Stat
            label="عملاء فعليون"
            value={String(snap.counts.activeClients)}
            icon={<Users className="h-4 w-4 text-gold" />}
            accent="#f3d38c"
            hint="صفقات مكتسبة"
          />
          <Stat
            label="عملاء مؤهلون"
            value={String(snap.counts.qualified)}
            icon={<Target className="h-4 w-4 text-sky-400" />}
            hint={`من أصل ${snap.counts.businesses} جهة مستهدفة`}
          />
          <Stat
            label="عروض معلّقة"
            value={String(snap.counts.proposalsSent)}
            icon={<FileText className="h-4 w-4 text-slate-300" />}
            hint="بانتظار موافقة العميل"
          />
          <Stat
            label="مشاريع قيد التنفيذ"
            value={String(snap.counts.projectsInProgress)}
            icon={<Briefcase className="h-4 w-4 text-indigo-400" />}
            accent="#818cf8"
          />
          <Stat
            label="مشاريع مكتملة"
            value={String(snap.counts.completedProjects)}
            icon={<CheckCircle2 className="h-4 w-4 text-emerald-400" />}
            accent="#34d399"
          />
          <Stat
            label="صافي الربح"
            value={fmtUsd(snap.revenue.netProfit)}
            icon={<Radio className="h-4 w-4 text-emerald-400" />}
            accent="#34d399"
            hint={`بعد مصاريف ${fmtUsd(snap.revenue.expenses)}`}
          />
        </div>
      </section>

      {/* next move highlight card */}
      <section className="rise rise-2">
        <SpotlightCard className="border-gold/30 shadow-[0_0_35px_rgba(243,211,140,0.08)]">
          <div className="p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Kicker>YOUR NEXT MOVE — خطوتك التالية</Kicker>
              {todayMission.mission.status === "completed" && pendingTasks.length === 0 && (
                <Badge tone="green">مهمة اليوم مكتملة بنجاح</Badge>
              )}
            </div>
            <h2 className="font-ar mt-3 text-xl font-extrabold leading-relaxed text-fog md:text-2xl">
              {primaryTask ? primaryTask.title : todayMission.mission.title}
            </h2>
            <p className="mt-2.5 max-w-3xl text-[13px] leading-6 text-ash">
              {primaryTask?.why || todayMission.mission.focus}
            </p>

            <div className="mt-6 grid gap-5 md:grid-cols-[1fr_auto]">
              <div className="flex flex-col gap-3.5">
                {primaryTask && primaryTask.steps.length > 0 && (
                  <ol className="grid gap-2 sm:grid-cols-2">
                    {primaryTask.steps.slice(0, 6).map((s, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 text-[12px] leading-5 text-ash"
                      >
                        <span className="fnum mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-lg border border-gold/30 bg-gold/10 text-[10px] font-bold text-gold">
                          {i + 1}
                        </span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ol>
                )}
                <div className="flex flex-wrap gap-2 text-[10.5px]">
                  <Badge tone="gold">
                    <Flame className="h-3 w-3" /> النتيجة المتوقعة: {todayMission.mission.measurableResult || "تقدم ملموس"}
                  </Badge>
                  {primaryTask && <Badge tone="gray">⏱ {primaryTask.estMinutes} دقيقة تقريباً</Badge>}
                </div>
              </div>
              <div className="flex items-end">
                <StartMissionButton taskId={primaryTask?.id} done={!primaryTask && pendingTasks.length === 0} />
              </div>
            </div>
          </div>
        </SpotlightCard>
      </section>

      {/* tasks + activity columns */}
      <section className="rise rise-3 grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="mb-3.5 flex items-center justify-between">
            <Kicker>TODAY'S EXECUTION — مهام اليوم</Kicker>
            <Link href="/mission" className="text-xs font-bold text-gold hover:text-goldsoft transition-colors flex items-center gap-1">
              <span>التفاصيل الكاملة</span>
              <span>←</span>
            </Link>
          </div>
          <TaskList tasks={todayMission.tasks} compact />
        </div>

        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* deadlines */}
          <div>
            <Kicker className="mb-3.5">DEADLINES & FOLLOW-UPS — مواعيد ومتابعات</Kicker>
            <Panel className="p-2">
              {snap.tasks.overdue.length === 0 && followups.length === 0 && (
                <div className="px-4 py-8 text-center text-xs text-dim">
                  لا مواعيد متأخرة حالياً. ممتاز، واصل التنفيذ.
                </div>
              )}
              {snap.tasks.overdue.slice(0, 3).map((t) => (
                <div key={t.id} className="flex items-center gap-3 rounded-xl border-b border-white/[0.06] px-3.5 py-3 last:border-0 hover:bg-white/[0.02]">
                  <Badge tone="red">متأخرة</Badge>
                  <span className="flex-1 truncate text-xs font-semibold text-fog">{t.title}</span>
                  <span className="fnum text-[10px] text-dim">{fmtDateShort(t.dueDate)}</span>
                </div>
              ))}
              {followups.slice(0, 5).map((b) => (
                <LinkCard
                  key={b.id}
                  href="/clients"
                  className="flex items-center gap-3 rounded-xl border-b border-white/[0.06] px-3.5 py-3 last:border-0 hover:bg-white/[0.02]"
                >
                  <Badge tone="amber">متابعة</Badge>
                  <span className="flex-1 truncate text-xs font-semibold text-fog">{b.name}</span>
                  <span className="max-w-28 truncate text-[10px] text-dim">{b.nextAction}</span>
                </LinkCard>
              ))}
            </Panel>
          </div>

          {/* conversations */}
          <div>
            <Kicker className="mb-3.5">ACTIVE CONVERSATIONS — محادثات نشطة</Kicker>
            <Panel className="p-2">
              {convs.length === 0 && (
                <div className="px-4 py-8 text-center text-xs leading-5 text-dim">
                  لا محادثات نشطة بعد. سجّل ردود العملاء لتبقى الرؤية واضحة.
                </div>
              )}
              {convs.map((c) => {
                const last = c.messages[c.messages.length - 1];
                return (
                  <LinkCard
                    key={c.id}
                    href="/clients"
                    className="flex items-center gap-3 rounded-xl border-b border-white/[0.06] px-3.5 py-3 last:border-0 hover:bg-white/[0.02]"
                  >
                    <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-gold/30 bg-gold/10 text-gold">
                      <MessageSquare className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-bold text-fog">{c.bizName}</div>
                      {last && <div className="truncate text-[10px] text-dim">{last.body}</div>}
                    </div>
                    <span className="shrink-0 text-[10px] text-dim">{timeAgoAr(c.updatedAt)}</span>
                  </LinkCard>
                );
              })}
            </Panel>
          </div>

          {/* activity */}
          <div>
            <Kicker className="mb-3.5">LATEST ACTIVITY — آخر النشاطات</Kicker>
            <Panel className="p-2">
              {snap.recentActivity.length === 0 && (
                <div className="px-4 py-8 text-center text-xs text-dim">
                  سيظهر سجل نشاطك التنفيذي الحقيقي هنا.
                </div>
              )}
              {snap.recentActivity.slice(0, 7).map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-3 rounded-xl border-b border-white/[0.06] px-3.5 py-2.5 last:border-0 hover:bg-white/[0.02]"
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold shadow-[0_0_6px_#f3d38c]" />
                  <span className="flex-1 truncate text-xs text-ash">{a.summary}</span>
                  <span className="shrink-0 text-[10px] text-dim">{timeAgoAr(a.createdAt)}</span>
                </div>
              ))}
            </Panel>
          </div>
        </div>
      </section>
    </div>
  );
}
