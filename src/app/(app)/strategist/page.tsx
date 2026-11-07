import { requireUser } from "@/lib/auth";
import { getSnapshot } from "@/lib/metrics";
import { getStrategistHistory } from "@/actions/strategist";
import StrategistChat from "@/components/strategist-client";

export const dynamic = "force-dynamic";

export default async function StrategistPage() {
  const user = await requireUser();
  const [snap, history] = await Promise.all([getSnapshot(user.id), getStrategistHistory(user.id)]);

  const phase = snap.roadmap.find((r) => r.computedStatus !== "completed");
  const context = {
    businessName: snap.profile?.businessName ?? "",
    target: snap.goal.target,
    collected: snap.goal.collected,
    pct: snap.goal.pct,
    leads: snap.counts.businesses,
    qualified: snap.counts.qualified,
    outreach: snap.counts.outreachTotal,
    proposals: snap.counts.proposalsSent,
    deals: snap.counts.dealsWon + snap.counts.dealsOpen,
    conversations: snap.counts.conversationsActive,
    openTasks: snap.tasks.open,
    overdue: snap.tasks.overdue.length,
    phaseTitle: phase ? `${String(phase.idx).padStart(2, "0")} — ${phase.titleAr}` : "اكتملت الخارطة",
    phaseProgress: phase?.progress ?? 100,
  };

  return (
    <StrategistChat
      initialMessages={history.map((m) => ({ id: m.id, role: m.role, content: m.content }))}
      context={context}
    />
  );
}
