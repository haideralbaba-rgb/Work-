import { db } from "@/db";
import { businesses, deals, expenses, payments } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { getSnapshot } from "@/lib/metrics";
import { n } from "@/lib/utils";
import RevenueClient from "@/components/revenue-client";

export const dynamic = "force-dynamic";

export default async function RevenuePage() {
  const user = await requireUser();
  const [snap, dl, py, ex, biz] = await Promise.all([
    getSnapshot(user.id),
    db.select().from(deals).where(eq(deals.userId, user.id)).orderBy(desc(deals.updatedAt)),
    db.select().from(payments).where(eq(payments.userId, user.id)).orderBy(desc(payments.createdAt)),
    db.select().from(expenses).where(eq(expenses.userId, user.id)).orderBy(desc(expenses.createdAt)),
    db.select({ id: businesses.id, name: businesses.name }).from(businesses).where(eq(businesses.userId, user.id)),
  ]);

  const dealPaid: Record<string, number> = {};
  for (const p of py) {
    if (p.dealId) dealPaid[p.dealId] = (dealPaid[p.dealId] ?? 0) + n(p.usdAmount);
  }

  return (
    <RevenueClient
      snapshot={{
        target: snap.goal.target,
        collected: snap.goal.collected,
        remaining: snap.goal.remaining,
        pct: snap.goal.pct,
        quoted: snap.revenue.quoted,
        negotiating: snap.revenue.negotiating,
        contracted: snap.revenue.contracted,
        invoiced: snap.revenue.invoiced,
        outstanding: snap.revenue.outstanding,
        expenses: snap.revenue.expenses,
        netProfit: snap.revenue.netProfit,
      }}
      rate={snap.rate}
      deals={dl}
      paymentsList={py}
      expensesList={ex}
      dealPaid={dealPaid}
      businessOptions={biz}
      weekly={snap.payments7}
    />
  );
}
