"use client";

import { saveBusiness, setOutreachStatus } from "@/actions/clients";
import ClientDetail from "@/components/client-detail";
import {
  Badge,
  Button,
  Dot,
  EmptyState,
  Field,
  Input,
  Kicker,
  Modal,
  PageHeader,
  Panel,
  Select,
  Tabs,
  Textarea,
  CopyButton,
} from "@/components/ui";
import type { Business, OutreachMessage } from "@/db/schema";
import {
  CATEGORIES,
  channelLabel,
  cn,
  outreachStatusLabel,
  PIPELINE_STAGES,
  stageLabel,
  fmtDateShort,
} from "@/lib/utils";
import { Building2, Filter, Plus, Search, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

const EMPTY_FORM = {
  name: "",
  category: "restaurant",
  location: "كربلاء",
  instagram: "",
  phone: "",
  email: "",
  website: "",
  address: "",
  decisionMaker: "",
  visualOpportunity: "",
  estimatedDealValue: 0,
  notes: "",
};

export default function ClientsBoard({
  businesses,
  outreach,
}: {
  businesses: Business[];
  outreach: OutreachMessage[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState("base");
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [selected, setSelected] = useState<Business | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [pending, start] = useTransition();
  const [outreachFilter, setOutreachFilter] = useState("all");

  const filtered = useMemo(() => {
    return businesses
      .filter((b) => (stageFilter === "all" ? true : b.stage === stageFilter))
      .filter((b) => {
        if (!search.trim()) return true;
        const q = search.trim();
        return [b.name, b.instagram, b.category, b.notes].join(" ").includes(q);
      })
      .sort((a, b) => b.leadScore - a.leadScore);
  }, [businesses, search, stageFilter]);

  const kpis = useMemo(() => {
    return {
      total: businesses.length,
      qualified: businesses.filter((b) => ["qualified", "contact_eligible"].includes(b.stage)).length,
      contacted: businesses.filter((b) => PIPELINE_STAGES.findIndex((s) => s.key === b.stage) >= 4 && b.stage !== "do_not_contact" && b.stage !== "lost").length,
      engaged: businesses.filter((b) => ["responded", "interested", "proposal_sent", "negotiation"].includes(b.stage)).length,
      won: businesses.filter((b) => b.stage === "won").length,
    };
  }, [businesses]);

  const openNew = () => {
    setForm(EMPTY_FORM);
    setFormError("");
    setEditOpen(true);
  };

  const submitBusiness = () => {
    setFormError("");
    start(async () => {
      const res = await saveBusiness({ ...form });
      if (res.error) {
        setFormError(res.error);
        return;
      }
      setEditOpen(false);
      router.refresh();
    });
  };

  const filteredOutreach = outreach.filter((o) => (outreachFilter === "all" ? true : o.status === outreachFilter));
  const bizName = (id: string | null) => businesses.find((b) => b.id === id)?.name ?? "—";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        kicker="CLIENT ACQUISITION — CRM"
        title="اكتساب العملاء"
        desc="قاعدة عملاء حقيقية: لا توهم، لا بيانات مختلقة — كل جهة هنا أدخلتها أنت وحللتها بنفسك بمساعدة الذكاء."
        actions={
          <Button onClick={openNew}>
            <Plus className="h-4 w-4" />
            أضف نشاطًا
          </Button>
        }
      />

      {/* kpis */}
      <div className="rise rise-1 grid grid-cols-2 gap-2.5 sm:grid-cols-5">
        {[
          { k: "إجمالي الجهات", v: kpis.total },
          { k: "مؤهلة", v: kpis.qualified },
          { k: "تم التواصل", v: kpis.contacted },
          { k: "متفاعلة", v: kpis.engaged },
          { k: "عملاء فعليون", v: kpis.won },
        ].map((x) => (
          <Panel key={x.k} className="px-4 py-3.5">
            <div className="fnum text-xl font-black text-fog">{x.v}</div>
            <div className="mt-0.5 text-[10px] font-semibold text-dim">{x.k}</div>
          </Panel>
        ))}
      </div>

      <Tabs
        active={tab}
        onChange={setTab}
        items={[
          { key: "base", label: "قاعدة العملاء", count: businesses.length },
          { key: "outreach", label: "سجل التواصل", count: outreach.length },
        ]}
        className="rise rise-2"
      />

      {tab === "base" && (
        <div className="rise rise-2 flex flex-col gap-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-dim" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث بالاسم أو الحساب…" className="ps-9" />
            </div>
            <div className="relative">
              <Filter className="absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-dim" />
              <Select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)} className="ps-9 sm:w-56">
                <option value="all">كل المراحل</option>
                {PIPELINE_STAGES.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.ar}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {filtered.length === 0 && (
            <EmptyState
              icon={<Building2 className="h-5 w-5" />}
              title={businesses.length === 0 ? "قاعدة العملاء فارغة" : "لا نتائج مطابقة"}
              hint={
                businesses.length === 0
                  ? "ابدأ بأول خطوة حقيقية نحو الإيراد: أضف 5 مطاعم ومقاهٍ من كربلاء تريد العمل معها فعلًا."
                  : "جرّب بحثًا مختلفًا أو أزل الفلاتر."
              }
              action={
                businesses.length === 0 ? (
                  <Button onClick={openNew} size="sm">
                    <Plus className="h-3.5 w-3.5" />
                    أضف أول جهة
                  </Button>
                ) : undefined
              }
            />
          )}

          <div className="grid gap-2">
            {filtered.map((b, i) => {
              const stage = PIPELINE_STAGES.find((s) => s.key === b.stage);
              return (
                <button
                  key={b.id}
                  onClick={() => setSelected(b)}
                  className="rise flex w-full items-center gap-3 border border-line bg-panel px-4 py-3.5 text-start transition-all hover:border-line2 hover:bg-raised cursor-pointer"
                  style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                >
                  <div className={cn(
                    "fnum grid h-10 w-12 shrink-0 place-items-center border text-sm font-black",
                    b.leadScore >= 60 ? "border-gold/40 bg-gold/10 text-gold" : "border-line bg-coal text-ash"
                  )}>
                    {b.leadScore}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[13px] font-bold text-fog">{b.name}</span>
                      {b.contactPermission === "denied" && <Badge tone="red">عدم تواصل</Badge>}
                      {b.contactPermission === "granted" && <Badge tone="green">إذن تواصل</Badge>}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[10px] text-dim">
                      <span>{CATEGORIES.find((c) => c.key === b.category)?.ar ?? b.category}</span>
                      {b.instagram && <span className="fnum truncate" dir="ltr">{b.instagram}</span>}
                    </div>
                  </div>
                  {b.nextAction && <span className="hidden max-w-44 truncate text-[9.5px] text-amber md:block">{b.nextAction}</span>}
                  <span className="flex shrink-0 items-center gap-1.5 text-[10.5px] font-semibold text-ash">
                    <Dot color={stage?.dot ?? "#666"} />
                    {stage?.ar ?? b.stage}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {tab === "outreach" && (
        <div className="rise rise-2 flex flex-col gap-3">
          <div className="flex flex-wrap gap-1.5">
            {["all", "draft", "sent", "replied", "interested", "rejected"].map((s) => (
              <button
                key={s}
                onClick={() => setOutreachFilter(s)}
                className={cn(
                  "border px-3 py-1.5 text-[10.5px] font-semibold transition-colors cursor-pointer",
                  outreachFilter === s ? "border-gold bg-gold/10 text-gold" : "border-line text-ash hover:text-fog"
                )}
              >
                {s === "all" ? "الكل" : outreachStatusLabel(s)} ({s === "all" ? outreach.length : outreach.filter((o) => o.status === s).length})
              </button>
            ))}
          </div>
          {filteredOutreach.length === 0 && (
            <EmptyState
              icon={<Users className="h-5 w-5" />}
              title="لا رسائل تواصل هنا"
              hint="ولّد رسائل مخصصة من صفحة أي عميل — تبويب «التواصل» داخل ملف الجهة."
            />
          )}
          <div className="grid gap-2">
            {filteredOutreach.map((o) => (
              <div key={o.id} className="border border-line bg-panel px-4 py-3.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[12px] font-bold text-fog">{bizName(o.businessId)}</span>
                  <Badge>{channelLabel(o.channel)}</Badge>
                  <Badge tone="gray">{fmtDateShort(o.createdAt.toISOString())}</Badge>
                  <span className="ms-auto">
                    <Select
                      value={o.status}
                      onChange={(e) =>
                        start(async () => {
                          await setOutreachStatus(o.id, e.target.value);
                          router.refresh();
                        })
                      }
                      className="h-8 w-32 text-[10.5px]"
                    >
                      {["draft", "sent", "delivered", "replied", "interested", "rejected", "suppressed"].map((s) => (
                        <option key={s} value={s}>
                          {outreachStatusLabel(s)}
                        </option>
                      ))}
                    </Select>
                  </span>
                </div>
                <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-[11.5px] leading-5 text-ash">{o.body}</p>
                <div className="mt-2 flex gap-2">
                  <CopyButton text={o.body} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* detail drawer */}
      {selected && (
        <ClientDetail
          business={selected}
          onClose={() => setSelected(null)}
        />
      )}

      {/* new business modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="إضافة نشاط تجاري" wide>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="اسم النشاط *">
            <Input autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="مطعم …" />
          </Field>
          <Field label="الفئة">
            <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>{c.ar}</option>
              ))}
            </Select>
          </Field>
          <Field label="الموقع / المنطقة">
            <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </Field>
          <Field label="العنوان">
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="الحي، الشارع…" />
          </Field>
          <Field label="حساب إنستغرام">
            <Input dir="ltr" className="text-left" value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} placeholder="@restaurant" />
          </Field>
          <Field label="الهاتف / واتساب">
            <Input dir="ltr" className="text-left" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="0770…" />
          </Field>
          <Field label="البريد الإلكتروني">
            <Input dir="ltr" className="text-left" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="صاحب القرار">
            <Input value={form.decisionMaker} onChange={(e) => setForm({ ...form, decisionMaker: e.target.value })} placeholder="الاسم أو الدور (المالك، المدير)…" />
          </Field>
          <Field label="القيمة التقديرية للصفقة ($)">
            <Input type="number" min={0} className="fnum" value={form.estimatedDealValue || ""} onChange={(e) => setForm({ ...form, estimatedDealValue: Number(e.target.value) })} />
          </Field>
          <Field label="الموقع الإلكتروني">
            <Input dir="ltr" className="text-left" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
          </Field>
          <Field label="الفرصة البصرية الملاحظة" className="sm:col-span-2" hint="ملاحظة حقيقية رأيتها في محتواهم — هذا مفتاح الرسالة الأولى">
            <Textarea value={form.visualOpportunity} onChange={(e) => setForm({ ...form, visualOpportunity: e.target.value })} placeholder="مثال: صور المنيو بإضاءة ضعيفة، والطبق المميز لا يظهر نهائيًا…" />
          </Field>
          <Field label="ملاحظات" className="sm:col-span-2">
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
        </div>
        {formError && <div className="mt-4 border border-brick/40 bg-brick/10 px-3 py-2 text-[11.5px] font-semibold text-brick">{formError}</div>}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setEditOpen(false)}>إلغاء</Button>
          <Button loading={pending} onClick={submitBusiness}>حفظ النشاط</Button>
        </div>
      </Modal>
    </div>
  );
}
