"use client";

import { deleteDeal, deleteExpense, deletePayment, recordPayment, saveExpense, setDealStage, setDeliveryStatus } from "@/actions/money";
import { WeeklyBars } from "@/components/dashboard-client";
import {
  Badge,
  Button,
  EmptyState,
  Field,
  GoalRing,
  Input,
  Kicker,
  Modal,
  PageHeader,
  Panel,
  ProgressBar,
  Select,
  Stat,
  Tabs,
  Textarea,
} from "@/components/ui";
import type { Deal, Expense, Payment } from "@/db/schema";
import { cn, dealStageLabel, deliveryLabel, expenseCatLabel, fmtDateShort, fmtMoney, fmtUsd, methodLabel, n, PAYMENT_METHODS, EXPENSE_CATS, todayKey } from "@/lib/utils";
import { Banknote, Plus, Receipt, Trash2, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Snap = {
  target: number;
  collected: number;
  remaining: number;
  pct: number;
  quoted: number;
  negotiating: number;
  contracted: number;
  invoiced: number;
  outstanding: number;
  expenses: number;
  netProfit: number;
};

export default function RevenueClient({
  snapshot,
  rate,
  deals,
  paymentsList,
  expensesList,
  dealPaid,
  businessOptions,
  weekly,
}: {
  snapshot: Snap;
  rate: number;
  deals: Deal[];
  paymentsList: Payment[];
  expensesList: Expense[];
  dealPaid: Record<string, number>;
  businessOptions: { id: string; name: string }[];
  weekly: { day: string; label: string; amount: number }[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState("deals");
  const [pending, start] = useTransition();

  const [payOpen, setPayOpen] = useState(false);
  const [payForm, setPayForm] = useState({ dealId: "", businessId: "", amount: 0, currency: "USD", method: "cash", note: "", receivedAt: todayKey() });
  const [payErr, setPayErr] = useState("");

  const [expOpen, setExpOpen] = useState(false);
  const [expForm, setExpForm] = useState({ dealId: "", title: "", amount: 0, currency: "USD", category: "other" });
  const [expErr, setExpErr] = useState("");

  const bizName = (id: string | null) => businessOptions.find((b) => b.id === id)?.name ?? null;
  const usdPreview = payForm.amount > 0 ? (payForm.currency === "IQD" ? payForm.amount / rate : payForm.amount) : 0;

  const pipeline = [
    { label: "معروض (عروض)", value: snapshot.quoted, color: "#8a8a8a", hint: "لا يُحسب إيرادًا" },
    { label: "قيد التفاوض", value: snapshot.negotiating, color: "#c9974b", hint: "لا يُحسب إيرادًا" },
    { label: "متعاقَد عليه", value: snapshot.contracted, color: "#dcc391", hint: "لا يُحسب إيرادًا" },
    { label: "مُفوتر", value: snapshot.invoiced, color: "#e6d2a3", hint: "لا يُحسب إيرادًا" },
    { label: "محصّل فعليًا", value: snapshot.collected, color: "#7fae8e", hint: "الوحيد الذي يُحسب للهدف" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        kicker="REVENUE TRACKER — المال الحقيقي فقط"
        title="متتبع الإيرادات"
        desc="فرق واضح بين المعروض والمتعاقد والمحصَّل. الهدف لا يتقدم إلا بالمقبوض الفعلي."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setExpForm({ dealId: "", title: "", amount: 0, currency: "USD", category: "other" }); setExpErr(""); setExpOpen(true); }}>
              <Receipt className="h-4 w-4" />
              مصروف
            </Button>
            <Button onClick={() => { setPayForm({ dealId: "", businessId: "", amount: 0, currency: "USD", method: "cash", note: "", receivedAt: todayKey() }); setPayErr(""); setPayOpen(true); }}>
              <Plus className="h-4 w-4" />
              سجّل دفعة محصّلة
            </Button>
          </div>
        }
      />

      {/* goal + pipeline */}
      <section className="rise rise-1 grid gap-4 lg:grid-cols-3">
        <Panel className="flex items-center gap-5 p-5">
          <GoalRing pct={snapshot.pct} size={128} stroke={5}>
            <div className="text-center">
              <div className="fnum text-lg font-black text-fog">{snapshot.pct}%</div>
            </div>
          </GoalRing>
          <div>
            <Kicker>GOAL</Kicker>
            <div className="fnum mt-1.5 text-2xl font-black text-fog">{fmtUsd(snapshot.collected)}</div>
            <div className="fnum text-[11px] text-dim">/ {fmtUsd(snapshot.target)}</div>
            <div className="mt-2 text-[10.5px] text-ash">المتبقي {fmtUsd(snapshot.remaining)}</div>
          </div>
          <div className="ms-auto hidden sm:block">
            <WeeklyBars data={weekly} />
          </div>
        </Panel>
        <div className="grid grid-cols-2 gap-3 lg:col-span-2">
          <Stat label="مستحقات غير محصّلة" value={fmtUsd(snapshot.outstanding)} hint="تابعها — هي أقرب مال لك" accent="#c9974b" />
          <Stat label="مصاريف مسجلة" value={fmtUsd(snapshot.expenses)} accent="#c06a55" />
          <Stat label="صافي الربح" value={fmtUsd(snapshot.netProfit)} accent={snapshot.netProfit >= 0 ? "#7fae8e" : "#c06a55"} hint="محصَّل ناقص مصاريف" />
          <Stat label="قيمة في خط الأنابيب" value={fmtUsd(snapshot.quoted + snapshot.negotiating + snapshot.contracted + snapshot.invoiced)} hint="محتملة، ليست إيرادًا بعد" />
        </div>
      </section>

      {/* revenue maturity strip */}
      <section className="rise rise-2">
        <Kicker className="mb-2.5">REVENUE MATURITY — نضج الإيراد</Kicker>
        <Panel className="grid grid-cols-2 divide-line sm:grid-cols-5 sm:divide-x sm:divide-x-reverse">
          {pipeline.map((p, i) => (
            <div key={p.label} className={cn("px-4 py-4", i === pipeline.length - 1 && "bg-sage/[0.05]")}>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.color }} />
                <span className="text-[10px] font-bold text-ash">{p.label}</span>
              </div>
              <div className="fnum mt-1.5 text-lg font-black" style={{ color: p.color }}>
                {fmtUsd(p.value)}
              </div>
              <div className="mt-0.5 text-[8.5px] text-dim">{p.hint}</div>
            </div>
          ))}
        </Panel>
      </section>

      <Tabs
        className="rise rise-3"
        active={tab}
        onChange={setTab}
        items={[
          { key: "deals", label: "الصفقات", count: deals.length },
          { key: "payments", label: "الدفعات المحصّلة", count: paymentsList.length },
          { key: "expenses", label: "المصاريف", count: expensesList.length },
        ]}
      />

      {tab === "deals" && (
        <div className="rise rise-3">
          {deals.length === 0 ? (
            <EmptyState
              icon={<BriefcaseIcon />}
              title="لا صفقات بعد"
              hint="الصفقات تتولد تلقائيًا عند قبول عرض، أو تُدار هنا فور وجودها."
            />
          ) : (
            <div className="grid gap-2">
              {deals.map((d) => {
                const paid = dealPaid[d.id] ?? 0;
                const pct = n(d.usdValue) > 0 ? Math.min(100, Math.round((paid / n(d.usdValue)) * 100)) : 0;
                return (
                  <Panel key={d.id} className="p-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-bold text-fog">{d.title}</div>
                        <div className="mt-0.5 text-[10px] text-dim">
                          {bizName(d.businessId) ?? "بدون عميل مربوط"} • {fmtDateShort(d.createdAt.toISOString())}
                        </div>
                      </div>
                      <div className="text-left">
                        <div className="fnum text-sm font-black text-gold">{fmtMoney(n(d.value), d.currency)}</div>
                        <div className="fnum text-[9px] text-dim">{fmtUsd(n(d.usdValue))}</div>
                      </div>
                      <Select value={d.stage} className="h-8 w-32 text-[10.5px]" onChange={(e) => start(async () => { await setDealStage(d.id, e.target.value); router.refresh(); })}>
                        {["quoted", "negotiating", "contracted", "invoiced", "won", "lost"].map((s) => (
                          <option key={s} value={s}>{dealStageLabel(s)}</option>
                        ))}
                      </Select>
                      <Select value={d.deliveryStatus} className="h-8 w-32 text-[10.5px]" onChange={(e) => start(async () => { await setDeliveryStatus(d.id, e.target.value); router.refresh(); })}>
                        {["not_started", "in_production", "delivered"].map((s) => (
                          <option key={s} value={s}>{deliveryLabel(s)}</option>
                        ))}
                      </Select>
                      <Button size="sm" variant="ghost" className="text-brick" onClick={() => start(async () => { await deleteDeal(d.id); router.refresh(); })}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <ProgressBar value={pct} className="flex-1" />
                      <span className="fnum text-[10px] font-bold text-sage">
                        محصَّل {fmtUsd(paid)} ({pct}%)
                      </span>
                    </div>
                  </Panel>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === "payments" && (
        <div className="rise rise-3">
          {paymentsList.length === 0 ? (
            <EmptyState
              icon={<Banknote className="h-5 w-5" />}
              title="لا دفعات محصّلة بعد"
              hint="أول دفعة — ولو 20$ عربون — تشغّل عدّاد الهدف. سجّل ما تقبضه فعلًا فقط."
            />
          ) : (
            <Panel>
              {paymentsList.map((p) => (
                <div key={p.id} className="flex flex-wrap items-center gap-3 border-b border-line/60 px-4 py-3.5 last:border-0">
                  <div className="grid h-9 w-9 place-items-center border border-sage/30 bg-sage/10">
                    <Banknote className="h-4 w-4 text-sage" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="fnum text-[13.5px] font-black text-fog">
                      {fmtMoney(n(p.amount), p.currency)}
                      <span className="ms-2 text-[10px] font-semibold text-sage">≈ {fmtUsd(n(p.usdAmount))}</span>
                    </div>
                    <div className="mt-0.5 flex flex-wrap gap-2 text-[9.5px] text-dim">
                      <span>{methodLabel(p.method)}</span>
                      {bizName(p.businessId) && <span>• {bizName(p.businessId)}</span>}
                      {p.note && <span>• {p.note}</span>}
                    </div>
                  </div>
                  <span className="fnum text-[10px] text-dim">{fmtDateShort(p.receivedAt)}</span>
                  <Button size="sm" variant="ghost" className="text-brick" onClick={() => start(async () => { await deletePayment(p.id); router.refresh(); })}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </Panel>
          )}
        </div>
      )}

      {tab === "expenses" && (
        <div className="rise rise-3">
          {expensesList.length === 0 ? (
            <EmptyState
              icon={<Receipt className="h-5 w-5" />}
              title="لا مصاريف مسجلة"
              hint="سجّل مصاريف المشاريع (تنقل، إكسسوارات، اشتراكات) لتعرف ربحك الحقيقي."
            />
          ) : (
            <Panel>
              {expensesList.map((e2) => (
                <div key={e2.id} className="flex flex-wrap items-center gap-3 border-b border-line/60 px-4 py-3.5 last:border-0">
                  <div className="grid h-9 w-9 place-items-center border border-brick/30 bg-brick/10">
                    <Receipt className="h-4 w-4 text-brick" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[12.5px] font-bold text-fog">{e2.title}</div>
                    <div className="mt-0.5 text-[9.5px] text-dim">{expenseCatLabel(e2.category)} • {fmtDateShort(e2.createdAt.toISOString())}</div>
                  </div>
                  <span className="fnum text-[13px] font-black text-brick">−{fmtMoney(n(e2.amount), e2.currency)}</span>
                  <Button size="sm" variant="ghost" className="text-brick" onClick={() => start(async () => { await deleteExpense(e2.id); router.refresh(); })}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </Panel>
          )}
        </div>
      )}

      {/* payment modal */}
      <Modal open={payOpen} onClose={() => setPayOpen(false)} title="تسجيل دفعة محصّلة فعليًا">
        <div className="flex flex-col gap-4">
          <div className="border border-gold/25 bg-gold/[0.05] px-3.5 py-2.5 text-[10.5px] leading-5 text-goldsoft">
            سجّل فقط ما وصلك فعلًا نقدًا أو تحويلًا. الوعود والعروض لا تُحتسب نحو هدف الـ $2,000.
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="الصفقة المرتبطة (اختياري)">
              <Select value={payForm.dealId} onChange={(e) => setPayForm({ ...payForm, dealId: e.target.value, businessId: deals.find((d) => d.id === e.target.value)?.businessId ?? payForm.businessId })}>
                <option value="">— دفعة غير مرتبطة —</option>
                {deals.filter((d) => d.stage !== "lost").map((d) => (
                  <option key={d.id} value={d.id}>{d.title} ({fmtMoney(n(d.value), d.currency)})</option>
                ))}
              </Select>
            </Field>
            <Field label="العميل (اختياري)">
              <Select value={payForm.businessId} onChange={(e) => setPayForm({ ...payForm, businessId: e.target.value })}>
                <option value="">—</option>
                {businessOptions.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="المبلغ *">
              <Input type="number" min={0} className="fnum" value={payForm.amount || ""} onChange={(e) => setPayForm({ ...payForm, amount: Number(e.target.value) })} />
            </Field>
            <Field label="العملة">
              <Select value={payForm.currency} onChange={(e) => setPayForm({ ...payForm, currency: e.target.value })}>
                <option value="USD">USD $</option>
                <option value="IQD">IQD د.ع</option>
              </Select>
            </Field>
            <Field label="طريقة التحصيل">
              <Select value={payForm.method} onChange={(e) => setPayForm({ ...payForm, method: e.target.value })}>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.key} value={m.key}>{m.ar}</option>
                ))}
              </Select>
            </Field>
            <Field label="تاريخ الاستلام">
              <Input type="date" value={payForm.receivedAt} onChange={(e) => setPayForm({ ...payForm, receivedAt: e.target.value })} />
            </Field>
          </div>
          <Field label="ملاحظة (عربون / دفعة أخيرة / قسط…)">
            <Input value={payForm.note} onChange={(e) => setPayForm({ ...payForm, note: e.target.value })} />
          </Field>
          {payForm.currency === "IQD" && payForm.amount > 0 && (
            <div className="fnum border border-line bg-coal px-3.5 py-2.5 text-[11px] text-ash">
              ≈ <span className="font-black text-gold">{fmtUsd(usdPreview)}</span> بسعر صرف {rate.toLocaleString()} — أقساط جزئية مدعومة بالكامل.
            </div>
          )}
          {payErr && <div className="border border-brick/40 bg-brick/10 px-3 py-2 text-[11.5px] font-semibold text-brick">{payErr}</div>}
          <Button
            loading={pending}
            onClick={() =>
              start(async () => {
                const res = await recordPayment({
                  dealId: payForm.dealId || undefined,
                  businessId: payForm.businessId || undefined,
                  amount: payForm.amount,
                  currency: payForm.currency,
                  method: payForm.method,
                  note: payForm.note,
                  receivedAt: payForm.receivedAt,
                });
                if (res.error) { setPayErr(res.error); return; }
                setPayOpen(false);
                router.refresh();
              })
            }
          >
            <Wallet className="h-4 w-4" />
            تأكيد التحصيل
          </Button>
        </div>
      </Modal>

      {/* expense modal */}
      <Modal open={expOpen} onClose={() => setExpOpen(false)} title="تسجيل مصروف">
        <div className="flex flex-col gap-4">
          <Field label="الوصف *">
            <Input autoFocus value={expForm.title} onChange={(e) => setExpForm({ ...expForm, title: e.target.value })} placeholder="تنقل لجلسة تصوير مطعم…" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="المبلغ *">
              <Input type="number" min={0} className="fnum" value={expForm.amount || ""} onChange={(e) => setExpForm({ ...expForm, amount: Number(e.target.value) })} />
            </Field>
            <Field label="العملة">
              <Select value={expForm.currency} onChange={(e) => setExpForm({ ...expForm, currency: e.target.value })}>
                <option value="USD">USD</option>
                <option value="IQD">IQD</option>
              </Select>
            </Field>
            <Field label="الفئة">
              <Select value={expForm.category} onChange={(e) => setExpForm({ ...expForm, category: e.target.value })}>
                {EXPENSE_CATS.map((c) => (
                  <option key={c.key} value={c.key}>{c.ar}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="مرتبط بصفقة؟ (اختياري)">
            <Select value={expForm.dealId} onChange={(e) => setExpForm({ ...expForm, dealId: e.target.value })}>
              <option value="">— مصروف عام —</option>
              {deals.map((d) => (
                <option key={d.id} value={d.id}>{d.title}</option>
              ))}
            </Select>
          </Field>
          {expErr && <div className="border border-brick/40 bg-brick/10 px-3 py-2 text-[11.5px] font-semibold text-brick">{expErr}</div>}
          <Button
            loading={pending}
            onClick={() =>
              start(async () => {
                const res = await saveExpense({
                  title: expForm.title,
                  amount: expForm.amount,
                  currency: expForm.currency,
                  category: expForm.category,
                  dealId: expForm.dealId || undefined,
                });
                if (res.error) { setExpErr(res.error); return; }
                setExpOpen(false);
                router.refresh();
              })
            }
          >
            حفظ المصروف
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function BriefcaseIcon() {
  return <Wallet className="h-5 w-5" />;
}
