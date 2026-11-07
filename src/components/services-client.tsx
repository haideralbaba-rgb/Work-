"use client";

import {
  buildProposalDraft,
  deleteProposal,
  deleteService,
  saveProposal,
  saveService,
  setProposalStatus,
  type ProposalInput,
} from "@/actions/money";
import {
  Badge,
  Button,
  CopyButton,
  DownloadButton,
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
} from "@/components/ui";
import type { Proposal, Service } from "@/db/schema";
import { cn, fmtMoney, fmtDateShort, n, proposalStatusLabel, SERVICE_TYPES, serviceTypeLabel } from "@/lib/utils";
import { FileText, Pencil, Plus, Tags, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type ServiceForm = {
  name: string;
  type: string;
  description: string;
  deliverablesText: string;
  videosCount: number;
  photosCount: number;
  productionHours: number;
  editingHours: number;
  revisions: number;
  price: number;
  currency: string;
  estimatedCost: number;
};

const EMPTY_SERVICE: ServiceForm = {
  name: "",
  type: "ad_video",
  description: "",
  deliverablesText: "",
  videosCount: 1,
  photosCount: 0,
  productionHours: 4,
  editingHours: 4,
  revisions: 2,
  price: 150,
  currency: "USD",
  estimatedCost: 20,
};

function marginOf(s: { price: string | number; estimatedCost: string | number }) {
  const p = n(s.price);
  const c = n(s.estimatedCost);
  if (p <= 0) return 0;
  return Math.round(((p - c) / p) * 100);
}

export default function ServicesClient({
  services,
  proposals,
  businessOptions,
}: {
  services: Service[];
  proposals: Proposal[];
  businessOptions: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState("services");
  const [pending, start] = useTransition();

  // service builder
  const [svcOpen, setSvcOpen] = useState(false);
  const [svcId, setSvcId] = useState<string | null>(null);
  const [form, setForm] = useState<ServiceForm>(EMPTY_SERVICE);
  const [formErr, setFormErr] = useState("");

  // proposal builder
  const [propOpen, setPropOpen] = useState(false);
  const [propId, setPropId] = useState<string | null>(null);
  const [genSel, setGenSel] = useState({ serviceId: "", businessId: "" });
  const [propForm, setPropForm] = useState<ProposalInput | null>(null);
  const [propErr, setPropErr] = useState("");
  const [viewing, setViewing] = useState<Proposal | null>(null);
  const [building, setBuilding] = useState(false);

  const openNewService = () => {
    setSvcId(null);
    setForm(EMPTY_SERVICE);
    setFormErr("");
    setSvcOpen(true);
  };

  const openEditService = (s: Service) => {
    setSvcId(s.id);
    setForm({
      name: s.name,
      type: s.type,
      description: s.description,
      deliverablesText: s.deliverables.join("\n"),
      videosCount: s.videosCount,
      photosCount: s.photosCount,
      productionHours: n(s.productionHours),
      editingHours: n(s.editingHours),
      revisions: s.revisions,
      price: n(s.price),
      currency: s.currency,
      estimatedCost: n(s.estimatedCost),
    });
    setFormErr("");
    setSvcOpen(true);
  };

  const submitService = () => {
    start(async () => {
      const res = await saveService({
        id: svcId ?? undefined,
        name: form.name,
        type: form.type,
        description: form.description,
        deliverables: form.deliverablesText.split("\n").map((x) => x.trim()).filter(Boolean),
        videosCount: form.videosCount,
        photosCount: form.photosCount,
        productionHours: form.productionHours,
        editingHours: form.editingHours,
        revisions: form.revisions,
        price: form.price,
        currency: form.currency,
        estimatedCost: form.estimatedCost,
        active: true,
      });
      if (res.error) {
        setFormErr(res.error);
        return;
      }
      setSvcOpen(false);
      router.refresh();
    });
  };

  const openNewProposal = () => {
    setPropId(null);
    setPropForm(null);
    setGenSel({ serviceId: services[0]?.id ?? "", businessId: businessOptions[0]?.id ?? "" });
    setPropErr("");
    setPropOpen(true);
  };

  const buildDraft = async () => {
    setBuilding(true);
    setPropErr("");
    const res = await buildProposalDraft(genSel);
    setBuilding(false);
    if ("error" in res && res.error) {
      setPropErr(res.error);
      return;
    }
    if ("draft" in res && res.draft) {
      setPropForm({
        title: res.draft.title,
        overview: res.draft.overview,
        concept: res.draft.concept,
        deliverables: res.draft.deliverables,
        timeline: res.draft.timeline,
        price: res.draft.price,
        currency: res.draft.currency,
        paymentTerms: res.draft.paymentTerms,
        revisionPolicy: res.draft.revisionPolicy,
        businessId: res.draft.businessId,
        serviceId: res.draft.serviceId,
      });
    }
  };

  const submitProposal = () => {
    if (!propForm) return;
    start(async () => {
      const res = await saveProposal({ ...propForm, id: propId ?? undefined });
      if (res.error) {
        setPropErr(res.error);
        return;
      }
      setPropOpen(false);
      router.refresh();
    });
  };

  const bizName = (id: string | null) => businessOptions.find((b) => b.id === id)?.name ?? "—";
  const margin = marginOf({ price: form.price, estimatedCost: form.estimatedCost });

  const proposalText = (p: Proposal) =>
    [
      `عرض خدمات إنتاج محتوى — ${p.title}`,
      `العميل: ${bizName(p.businessId)}`,
      "",
      "نظرة عامة:",
      p.overview,
      "",
      "المفهوم الإبداعي:",
      p.concept,
      "",
      "المخرجات:",
      ...p.deliverables.map((d, i) => `${i + 1}. ${d}`),
      "",
      `المدة الزمنية: ${p.timeline}`,
      `الاستثمار: ${p.price} ${p.currency}`,
      `شروط الدفع: ${p.paymentTerms}`,
      `سياسة المراجعة: ${p.revisionPolicy}`,
    ].join("\n");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        kicker="SERVICES & PRICING"
        title="الخدمات والأسعار"
        desc="عرّف خدماتك بهوامش ربح واضحة، وحوّلها إلى عروض مكتوبة بضغطة واحدة. الذكاء يقترح — القرار دائمًا لك."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={openNewProposal} disabled={services.length === 0 || businessOptions.length === 0}>
              <FileText className="h-4 w-4" />
              عرض جديد
            </Button>
            <Button onClick={openNewService}>
              <Plus className="h-4 w-4" />
              خدمة جديدة
            </Button>
          </div>
        }
      />

      <Tabs
        className="rise rise-1"
        active={tab}
        onChange={setTab}
        items={[
          { key: "services", label: "الخدمات", count: services.length },
          { key: "proposals", label: "العروض", count: proposals.length },
        ]}
      />

      {tab === "services" && (
        <div className="rise rise-1">
          {services.length === 0 ? (
            <EmptyState
              icon={<Tags className="h-5 w-5" />}
              title="لا خدمات معرّفة بعد"
              hint="ابدأ بخدمة واحدة واضحة: فيديو إعلاني واحد بسعر محدد. العرض الواضح أساس كل بيع."
              action={<Button size="sm" onClick={openNewService}>عرّف أول خدمة</Button>}
            />
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {services.map((s) => {
                const m = marginOf(s);
                return (
                  <Panel key={s.id} className="group flex flex-col p-4 transition-colors hover:border-line2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-[13.5px] font-bold text-fog">{s.name}</div>
                        <div className="mt-1 text-[10px] text-dim">{serviceTypeLabel(s.type)}</div>
                      </div>
                      <Badge tone={m >= 60 ? "green" : m >= 30 ? "amber" : "red"} className="fnum shrink-0">
                        هامش {m}%
                      </Badge>
                    </div>
                    <div className="fnum mt-3 text-2xl font-black text-gold">
                      {fmtMoney(n(s.price), s.currency)}
                    </div>
                    <div className="mt-1.5 text-[10px] text-dim">
                      تكلفة تقديرية {fmtMoney(n(s.estimatedCost), s.currency)} • صافي {fmtMoney(n(s.price) - n(s.estimatedCost), s.currency)}
                    </div>
                    {(s.videosCount > 0 || s.photosCount > 0) && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {s.videosCount > 0 && <Badge>{s.videosCount} فيديو</Badge>}
                        {s.photosCount > 0 && <Badge>{s.photosCount} صورة</Badge>}
                        <Badge>{n(s.productionHours) + n(s.editingHours)} ساعة عمل</Badge>
                        <Badge>{s.revisions} مراجعات</Badge>
                      </div>
                    )}
                    {s.deliverables.length > 0 && (
                      <ul className="mt-2.5 flex flex-col gap-1">
                        {s.deliverables.slice(0, 3).map((d, i) => (
                          <li key={i} className="flex gap-1.5 text-[10.5px] text-ash">
                            <span className="mt-1.5 h-0.5 w-0.5 rounded-full bg-gold" /> {d}
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="mt-auto flex items-center gap-1 border-t border-line pt-3">
                      <Button size="sm" variant="ghost" onClick={() => openEditService(s)}>
                        <Pencil className="h-3.5 w-3.5" /> تعديل
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-brick hover:text-brick"
                        loading={pending}
                        onClick={() => start(async () => { await deleteService(s.id); router.refresh(); })}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </Panel>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === "proposals" && (
        <div className="rise rise-1">
          {proposals.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-5 w-5" />}
              title="لا عروض مرسلة"
              hint="العرض المكتوب يحوّل الاهتمام الغامض إلى قرار محدد. أنشئ عرضك الأول من خدمة + عميل."
              action={<Button size="sm" onClick={openNewProposal} disabled={services.length === 0 || businessOptions.length === 0}>ولّد عرضًا</Button>}
            />
          ) : (
            <div className="grid gap-2">
              {proposals.map((p) => (
                <div key={p.id} className="flex flex-wrap items-center gap-3 border border-line bg-panel px-4 py-3.5">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-bold text-fog">{p.title}</div>
                    <div className="mt-0.5 text-[10px] text-dim">
                      {bizName(p.businessId)} • {fmtDateShort(p.createdAt.toISOString())}
                    </div>
                  </div>
                  <span className="fnum text-sm font-black text-gold">{fmtMoney(n(p.price), p.currency)}</span>
                  <Select
                    value={p.status}
                    className="h-8 w-32 text-[10.5px]"
                    onChange={(e) =>
                      start(async () => {
                        await setProposalStatus(p.id, e.target.value);
                        router.refresh();
                      })
                    }
                  >
                    {["draft", "sent", "accepted", "rejected", "expired"].map((s) => (
                      <option key={s} value={s}>{proposalStatusLabel(s)}</option>
                    ))}
                  </Select>
                  <Button size="sm" variant="outline" onClick={() => setViewing(p)}>عرض</Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-brick"
                    onClick={() => start(async () => { await deleteProposal(p.id); router.refresh(); })}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* service builder modal */}
      <Modal open={svcOpen} onClose={() => setSvcOpen(false)} title={svcId ? "تعديل الخدمة" : "بناء خدمة جديدة"} wide>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="اسم الخدمة *">
            <Input autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="جلسة محتوى مطعم" />
          </Field>
          <Field label="النوع">
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {SERVICE_TYPES.map((t) => (
                <option key={t.key} value={t.key}>{t.ar}</option>
              ))}
            </Select>
          </Field>
          <Field label="الوصف" className="sm:col-span-2">
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <Field label="المخرجات (سطر لكل مُخرَج)" className="sm:col-span-2">
            <Textarea
              value={form.deliverablesText}
              onChange={(e) => setForm({ ...form, deliverablesText: e.target.value })}
              placeholder={"3 فيديوهات عمودية 9:16\n20 صورة معدّلة\nنشر على إنستغرام العميل"}
            />
          </Field>
          <Field label="عدد الفيديوهات">
            <Input type="number" min={0} className="fnum" value={form.videosCount || ""} onChange={(e) => setForm({ ...form, videosCount: Number(e.target.value) })} />
          </Field>
          <Field label="عدد الصور">
            <Input type="number" min={0} className="fnum" value={form.photosCount || ""} onChange={(e) => setForm({ ...form, photosCount: Number(e.target.value) })} />
          </Field>
          <Field label="ساعات الإنتاج">
            <Input type="number" min={0} className="fnum" value={form.productionHours || ""} onChange={(e) => setForm({ ...form, productionHours: Number(e.target.value) })} />
          </Field>
          <Field label="ساعات المونتاج">
            <Input type="number" min={0} className="fnum" value={form.editingHours || ""} onChange={(e) => setForm({ ...form, editingHours: Number(e.target.value) })} />
          </Field>
          <Field label="حد المراجعات">
            <Input type="number" min={0} max={10} className="fnum" value={form.revisions} onChange={(e) => setForm({ ...form, revisions: Number(e.target.value) })} />
          </Field>
          <Field label="العملة">
            <Select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
              <option value="USD">USD $</option>
              <option value="IQD">IQD د.ع</option>
            </Select>
          </Field>
          <Field label="السعر *">
            <Input type="number" min={0} className="fnum" value={form.price || ""} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
          </Field>
          <Field label="التكلفة التقديرية (تنقل/إكسسوارات/وقت)">
            <Input type="number" min={0} className="fnum" value={form.estimatedCost || ""} onChange={(e) => setForm({ ...form, estimatedCost: Number(e.target.value) })} />
          </Field>
        </div>
        <div className={cn(
          "mt-4 border px-4 py-3 text-[11.5px] font-semibold",
          margin >= 60 ? "border-sage/30 bg-sage/[0.06] text-sage" : margin >= 30 ? "border-amber/30 bg-amber/[0.06] text-amber" : "border-brick/30 bg-brick/[0.06] text-brick"
        )}>
          هامش الربح الحالي: {margin}% — صافي {fmtMoney(form.price - form.estimatedCost, form.currency)} لكل طلب.
          {margin < 30 && " الهامش منخفض: ارفع السعر أو قلّص النطاق."}
        </div>
        {formErr && <div className="mt-3 border border-brick/40 bg-brick/10 px-3 py-2 text-[11.5px] font-semibold text-brick">{formErr}</div>}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setSvcOpen(false)}>إلغاء</Button>
          <Button loading={pending} onClick={submitService}>{svcId ? "حفظ التعديلات" : "حفظ الخدمة"}</Button>
        </div>
      </Modal>

      {/* proposal builder modal */}
      <Modal open={propOpen} onClose={() => setPropOpen(false)} title="مولّد العروض" wide>
        {!propForm ? (
          <div className="flex flex-col gap-4">
            <p className="text-[11.5px] leading-5 text-ash">
              اختر خدمة وعميلًا — سأبني مسودة عرض كاملة (مخرجات + مدة + سعر من تعريف خدمتك). السعر النهائي قرارك دائمًا.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="الخدمة">
                <Select value={genSel.serviceId} onChange={(e) => setGenSel({ ...genSel, serviceId: e.target.value })}>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} — {fmtMoney(n(s.price), s.currency)}</option>
                  ))}
                </Select>
              </Field>
              <Field label="العميل">
                <Select value={genSel.businessId} onChange={(e) => setGenSel({ ...genSel, businessId: e.target.value })}>
                  {businessOptions.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </Select>
              </Field>
            </div>
            {propErr && <div className="border border-brick/40 bg-brick/10 px-3 py-2 text-[11.5px] font-semibold text-brick">{propErr}</div>}
            <Button onClick={buildDraft} loading={building}>ابنِ المسودة</Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="عنوان العرض">
                <Input value={propForm.title} onChange={(e) => setPropForm({ ...propForm, title: e.target.value })} />
              </Field>
              <Field label="المدة الزمنية">
                <Input value={propForm.timeline} onChange={(e) => setPropForm({ ...propForm, timeline: e.target.value })} />
              </Field>
            </div>
            <Field label="نظرة عامة">
              <Textarea value={propForm.overview} onChange={(e) => setPropForm({ ...propForm, overview: e.target.value })} />
            </Field>
            <Field label="المفهوم الإبداعي">
              <Textarea value={propForm.concept} onChange={(e) => setPropForm({ ...propForm, concept: e.target.value })} />
            </Field>
            <Field label="المخرجات (سطر لكل مُخرَج)">
              <Textarea value={propForm.deliverables.join("\n")} onChange={(e) => setPropForm({ ...propForm, deliverables: e.target.value.split("\n") })} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="السعر">
                <Input type="number" min={0} className="fnum" value={propForm.price || ""} onChange={(e) => setPropForm({ ...propForm, price: Number(e.target.value) })} />
              </Field>
              <Field label="العملة">
                <Select value={propForm.currency} onChange={(e) => setPropForm({ ...propForm, currency: e.target.value })}>
                  <option value="USD">USD</option>
                  <option value="IQD">IQD</option>
                </Select>
              </Field>
              <Field label="&nbsp;">
                <Button variant="outline" onClick={() => setPropForm(null)} className="h-10">إعادة الاختيار</Button>
              </Field>
            </div>
            <Field label="شروط الدفع">
              <Input value={propForm.paymentTerms} onChange={(e) => setPropForm({ ...propForm, paymentTerms: e.target.value })} />
            </Field>
            <Field label="سياسة المراجعة">
              <Input value={propForm.revisionPolicy} onChange={(e) => setPropForm({ ...propForm, revisionPolicy: e.target.value })} />
            </Field>
            {propErr && <div className="border border-brick/40 bg-brick/10 px-3 py-2 text-[11.5px] font-semibold text-brick">{propErr}</div>}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setPropOpen(false)}>إلغاء</Button>
              <Button loading={pending} onClick={submitProposal}>حفظ العرض</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* proposal document view */}
      <Modal open={!!viewing} onClose={() => setViewing(null)} title="مستند العرض" wide>
        {viewing && (
          <div className="flex flex-col gap-5">
            <div className="border border-gold/25 bg-coal p-6">
              <div className="fnum text-[9px] font-bold uppercase tracking-[0.35em] text-gold">PROPOSAL</div>
              <h3 className="mt-2 text-xl font-extrabold text-fog">{viewing.title}</h3>
              <div className="mt-1 text-[11px] text-dim">إلى: {bizName(viewing.businessId)} • {fmtDateShort(viewing.createdAt.toISOString())}</div>

              <div className="mt-5 flex flex-col gap-4 text-[12px] leading-6 text-ash">
                <div>
                  <div className="mb-1 text-[10px] font-bold text-gold">نظرة عامة</div>
                  {viewing.overview}
                </div>
                {viewing.concept && (
                  <div>
                    <div className="mb-1 text-[10px] font-bold text-gold">المفهوم الإبداعي</div>
                    {viewing.concept}
                  </div>
                )}
                <div>
                  <div className="mb-1.5 text-[10px] font-bold text-gold">المخرجات</div>
                  <ul className="flex flex-col gap-1">
                    {viewing.deliverables.map((d, i) => (
                      <li key={i} className="flex gap-2 text-fog">
                        <span className="fnum text-gold">{String(i + 1).padStart(2, "0")}.</span> {d}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="border border-line px-3 py-2.5">
                    <div className="text-[9.5px] text-dim">المدة الزمنية</div>
                    <div className="mt-0.5 font-semibold text-fog">{viewing.timeline}</div>
                  </div>
                  <div className="border border-line px-3 py-2.5">
                    <div className="text-[9.5px] text-dim">الاستثمار</div>
                    <div className="fnum mt-0.5 text-lg font-black text-gold">{fmtMoney(n(viewing.price), viewing.currency)}</div>
                  </div>
                  <div className="border border-line px-3 py-2.5">
                    <div className="text-[9.5px] text-dim">شروط الدفع</div>
                    <div className="mt-0.5 text-[11px] leading-5 text-fog">{viewing.paymentTerms}</div>
                  </div>
                  <div className="border border-line px-3 py-2.5">
                    <div className="text-[9.5px] text-dim">سياسة المراجعة</div>
                    <div className="mt-0.5 text-[11px] leading-5 text-fog">{viewing.revisionPolicy}</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Badge tone={viewing.status === "accepted" ? "green" : viewing.status === "sent" ? "gold" : "gray"}>
                {proposalStatusLabel(viewing.status)}
              </Badge>
              <div className="flex gap-2">
                <CopyButton text={proposalText(viewing)} label="نسخ العرض" />
                <DownloadButton filename={`proposal-${bizName(viewing.businessId)}.txt`} text={proposalText(viewing)} />
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
