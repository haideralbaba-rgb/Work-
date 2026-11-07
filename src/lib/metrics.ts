import { db } from "@/db";
import {
  activityLogs,
  businesses,
  businessAnalyses,
  conversations,
  deals,
  expenses,
  notifications,
  outreachMessages,
  payments,
  profiles,
  proposals,
  roadmapPhases,
  roadmapTasks,
  scripts,
  contentProjects,
  tasks,
  dailyMissions,
  type ActivityLog,
  type Business,
  type Profile,
  type RoadmapPhase,
  type Task,
} from "@/db/schema";
import { and, desc, eq, gte, ne } from "drizzle-orm";
import { n, todayKey, daysAgoKey } from "@/lib/utils";

/* ------------------------------ side effects ------------------------------ */

export async function logActivity(
  userId: string,
  type: string,
  summary: string,
  meta: Record<string, string | number | boolean | null> = {}
) {
  await db.insert(activityLogs).values({ userId, type, summary, meta });
}

export async function notify(userId: string, type: string, title: string, body = "") {
  const p = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  const prefs = p[0]?.notifPrefs ?? {};
  if (prefs[type] === false) return;
  await db.insert(notifications).values({ userId, type, title, body });
}

/* ------------------------------- lead score ------------------------------- */

export function computeLeadScore(
  b: Partial<Business>,
  preferredCategories: string[] = []
): number {
  let score = 0;
  if (b.instagram && b.instagram.trim()) score += 15;
  if (b.phone && b.phone.trim()) score += 15;
  if (b.email && b.email.trim()) score += 5;
  if (b.decisionMaker && b.decisionMaker.trim()) score += 20;
  if (b.visualOpportunity && b.visualOpportunity.trim().length > 10) score += 20;
  if (b.analysisSummary && b.analysisSummary.trim().length > 10) score += 5;
  if (b.category && preferredCategories.includes(b.category)) score += 10;
  if ((b.location ?? "").toLowerCase().includes("karbala") || (b.location ?? "").includes("كربلاء")) score += 10;
  return Math.min(100, score);
}

/* --------------------------------- roadmap -------------------------------- */

export type PhaseView = RoadmapPhase & {
  progress: number;
  doneCount: number;
  totalCount: number;
  computedStatus: "locked" | "active" | "completed";
};

export async function getPhasesWithProgress(userId: string): Promise<PhaseView[]> {
  const phases = await db
    .select()
    .from(roadmapPhases)
    .where(eq(roadmapPhases.userId, userId))
    .orderBy(roadmapPhases.idx);
  const allTasks = await db.select().from(roadmapTasks).where(eq(roadmapTasks.userId, userId));
  const views: PhaseView[] = [];
  let prevProgress = 100;
  for (const ph of phases) {
    const ts = allTasks.filter((t) => t.phaseId === ph.id);
    const done = ts.filter((t) => t.status === "done").length;
    const progress = ts.length === 0 ? 0 : Math.round((done / ts.length) * 100);
    const computedStatus: PhaseView["computedStatus"] =
      progress === 100 ? "completed" : prevProgress >= 70 ? "active" : "locked";
    views.push({ ...ph, progress, doneCount: done, totalCount: ts.length, computedStatus });
    prevProgress = progress;
  }
  return views;
}

export async function getCurrentPhase(userId: string): Promise<PhaseView | null> {
  const views = await getPhasesWithProgress(userId);
  return views.find((v) => v.computedStatus !== "completed") ?? views[views.length - 1] ?? null;
}

/* -------------------------------- snapshot -------------------------------- */

export type RevenueSeries = { day: string; label: string; amount: number }[];

export type Snapshot = {
  profile: Profile | null;
  rate: number;
  goal: { target: number; collected: number; remaining: number; pct: number };
  revenue: {
    quoted: number;
    negotiating: number;
    contracted: number;
    invoiced: number;
    collected: number;
    outstanding: number;
    expenses: number;
    netProfit: number;
  };
  counts: {
    businesses: number;
    qualified: number;
    analyses: number;
    contactable: number;
    activeClients: number;
    proposalsSent: number;
    proposalsDraft: number;
    dealsOpen: number;
    dealsWon: number;
    projectsInProgress: number;
    completedProjects: number;
    conversationsActive: number;
    publishedContent: number;
    outreachTotal: number;
    outreachSent7d: number;
    leads7d: number;
  };
  tasks: { open: number; doneToday: number; overdue: Task[] };
  roadmap: PhaseView[];
  currentPhaseIdx: number;
  payments7: RevenueSeries;
  recentActivity: ActivityLog[];
};

export async function getSnapshot(userId: string): Promise<Snapshot> {
  const [profileRows, allBiz, allDeals, allPayments, allExpenses, allProposals, allOutreach, allConvs, allTasks, allScripts, allContent, analyses, activity] =
    await Promise.all([
      db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1),
      db.select().from(businesses).where(eq(businesses.userId, userId)),
      db.select().from(deals).where(eq(deals.userId, userId)),
      db.select().from(payments).where(eq(payments.userId, userId)).orderBy(desc(payments.createdAt)),
      db.select().from(expenses).where(eq(expenses.userId, userId)),
      db.select().from(proposals).where(eq(proposals.userId, userId)),
      db.select().from(outreachMessages).where(eq(outreachMessages.userId, userId)),
      db.select().from(conversations).where(eq(conversations.userId, userId)),
      db.select().from(tasks).where(eq(tasks.userId, userId)),
      db.select().from(scripts).where(eq(scripts.userId, userId)),
      db.select().from(contentProjects).where(eq(contentProjects.userId, userId)),
      db.select().from(businessAnalyses).where(eq(businessAnalyses.userId, userId)),
      db.select().from(activityLogs).where(eq(activityLogs.userId, userId)).orderBy(desc(activityLogs.createdAt)).limit(12),
    ]);

  const profile = profileRows[0] ?? null;
  const rate = Math.max(1, n(profile?.exchangeRate) || 1310);
  const toUsd = (amount: number, currency: string) => (currency === "IQD" ? amount / rate : amount);

  const collected = allPayments.reduce((s, p) => s + n(p.usdAmount), 0);
  const expenseTotal = allExpenses.reduce((s, e) => s + n(e.usdAmount), 0);

  const proposalsSentList = allProposals.filter((p) => p.status === "sent");
  const quotedProposals = proposalsSentList.reduce((s, p) => s + toUsd(n(p.price), p.currency), 0);
  const dealsByStage = (k: string) => allDeals.filter((d) => d.stage === k);
  const quotedDeals = dealsByStage("quoted").reduce((s, d) => s + n(d.usdValue), 0);
  const negotiating = dealsByStage("negotiating").reduce((s, d) => s + n(d.usdValue), 0);
  const contracted = dealsByStage("contracted").reduce((s, d) => s + n(d.usdValue), 0);
  const invoiced = dealsByStage("invoiced").reduce((s, d) => s + n(d.usdValue), 0);

  const openDeals = allDeals.filter((d) => ["contracted", "invoiced", "won"].includes(d.stage));
  let outstanding = 0;
  for (const d of openDeals) {
    const paid = allPayments.filter((p) => p.dealId === d.id).reduce((s, p) => s + n(p.usdAmount), 0);
    outstanding += Math.max(0, n(d.usdValue) - paid);
  }

  const target = Math.max(1, n(profile?.financialTarget) || 2000);
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400_000);

  const payments7: RevenueSeries = [];
  for (let i = 6; i >= 0; i--) {
    const key = daysAgoKey(i);
    const label = new Date(`${key}T00:00:00`).toLocaleDateString("en-GB", { weekday: "short" });
    const amount = allPayments
      .filter((p) => (p.receivedAt || todayKey(p.createdAt)) === key)
      .reduce((s, p) => s + n(p.usdAmount), 0);
    payments7.push({ day: key, label, amount });
  }

  const roadmap = await getPhasesWithProgress(userId);
  const currentPhase = roadmap.find((v) => v.computedStatus !== "completed");
  const today = todayKey();

  const qualified = allBiz.filter((b) => ["qualified", "contact_eligible"].includes(b.stage)).length;
  const contactable = allBiz.filter(
    (b) => ["qualified", "contact_eligible"].includes(b.stage) && b.contactPermission !== "denied"
  ).length;

  return {
    profile,
    rate,
    goal: {
      target,
      collected,
      remaining: Math.max(0, target - collected),
      pct: Math.min(100, Math.round((collected / target) * 100)),
    },
    revenue: {
      quoted: quotedProposals + quotedDeals,
      negotiating,
      contracted,
      invoiced,
      collected,
      outstanding,
      expenses: expenseTotal,
      netProfit: collected - expenseTotal,
    },
    counts: {
      businesses: allBiz.length,
      qualified,
      analyses: analyses.length,
      contactable,
      activeClients: allBiz.filter((b) => b.stage === "won").length,
      proposalsSent: proposalsSentList.length,
      proposalsDraft: allProposals.filter((p) => p.status === "draft").length,
      dealsOpen: allDeals.filter((d) => !["lost"].includes(d.stage) && d.stage !== "won").length,
      dealsWon: allDeals.filter((d) => d.stage === "won").length,
      projectsInProgress: allDeals.filter(
        (d) => ["contracted", "invoiced", "won"].includes(d.stage) && d.deliveryStatus !== "delivered"
      ).length,
      completedProjects: allDeals.filter((d) => d.deliveryStatus === "delivered").length,
      conversationsActive: allConvs.filter((c) => c.status === "active").length,
      publishedContent:
        allContent.filter((c) => c.status === "published").length +
        allScripts.filter((s) => s.status === "published").length,
      outreachTotal: allOutreach.filter((o) => !["draft", "suppressed"].includes(o.status)).length,
      outreachSent7d: allOutreach.filter(
        (o) => !["draft", "suppressed"].includes(o.status) && o.sentAt && o.sentAt >= sevenDaysAgo
      ).length,
      leads7d: allBiz.filter((b) => b.createdAt >= sevenDaysAgo).length,
    },
    tasks: {
      open: allTasks.filter((t) => t.status !== "done").length,
      doneToday: allTasks.filter((t) => t.status === "done" && t.completedAt && todayKey(t.completedAt) === today)
        .length,
      overdue: allTasks.filter((t) => t.status !== "done" && t.dueDate && t.dueDate < today),
    },
    roadmap,
    currentPhaseIdx: currentPhase?.idx ?? 5,
    payments7,
    recentActivity: activity,
  };
}

/* ------------------------------ missions fetch ---------------------------- */

export async function getTodayMission(userId: string) {
  const today = todayKey();
  const rows = await db
    .select()
    .from(dailyMissions)
    .where(and(eq(dailyMissions.userId, userId), eq(dailyMissions.date, today)))
    .limit(1);
  const mission = rows[0] ?? null;
  if (!mission) return null;
  const missionTasks = await db
    .select()
    .from(tasks)
    .where(eq(tasks.missionId, mission.id))
    .orderBy(tasks.createdAt);
  return { mission, tasks: missionTasks };
}

export async function getOverdueFollowups(userId: string) {
  const today = todayKey();
  return db
    .select()
    .from(businesses)
    .where(
      and(
        eq(businesses.userId, userId),
        ne(businesses.nextActionDate, ""),
        ne(businesses.stage, "lost"),
        ne(businesses.stage, "do_not_contact")
      )
    )
    .orderBy(desc(businesses.updatedAt))
    .then((rows) => rows.filter((b) => b.nextActionDate && b.nextActionDate <= today));
}
