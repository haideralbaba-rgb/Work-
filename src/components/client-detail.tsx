"use client";

import {
  addConversationMessage,
  deleteBusiness,
  generateOutreach,
  listBusinessData,
  runBusinessAnalysis,
  saveBusiness,
  saveOutreachMessage,
  setBusinessStage,
  setContactPermission,
  setOutreachStatus,
} from "@/actions/clients";
import type { AnalysisResult } from "@/lib/ai";
import {
  Badge,
  Button,
  CopyButton,
  Field,
  Input,
  Modal,
  Panel,
  Select,
  Spinner,
  Tabs,
  Textarea,
} from "@/components/ui";
import type { Business, BusinessAnalysis, Conversation, OutreachMessage } from "@/db/schema";
import {
  CATEGORIES,
  channelLabel,
  cn,
  outreachStatusLabel,
  PIPELINE_STAGES,
  timeAgoAr,
  toneLabel,
  TONES,
  CHANNELS,
} from "@/lib/utils";
import { BrainCircuit, FlaskConical, MessageSquare, Send, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

type DetailData = {
  analyses: BusinessAnalysis[];
  outreach: OutreachMessage[];
  conversations: Conversation[];
};

export default function ClientDetail({ business, onClose }: { business: Business; onClose: () => void }) {
  const router = useRouter();
  const [tab, setTab] = useState("overview");
  const [data, setData] = useState<DetailData | null>(null);
  const [pending, start] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  // analysis state
  const [analysisInput, setAnalysisInput] = useState("");
  const [analysisErr, setAnalysisErr] = useState("");
  const [analyzing, setAnalyzing] = useState(false);

  // outreach composer
  const [tone, setTone] = useState("professional");
  const [channel, setChannel] = useState("instagram");
  const [language, setLanguage] = useState("ar");
  const [draft, setDraft] = useState("");
  const [generating, setGenerating] = useState(false);
  const [composerMsg, setComposerMsg] = useState("");

  // conversation
  const [convDir, setConvDir] = useState<"out" | "in">("out");
  const [convBody, setConvBody] = useState("");

  // overview edits
  const [nextAction, setNextAction] = useState(business.nextAction);
  const [nextActionDate, setNextActionDate] = useState(business.nextActionDate);

  useEffect(() => {
    listBusinessData(business.id).then(setData).catch(() => setData({ analyses: [], outreach: [], conversations: [] }));
  }, [business.id]);

  const refresh = () => {
    router.refresh();
    listBusinessData(business.id).then(setData).catch(() => undefined);
  };

  const latest = data?.analyses[0] ?? null;
  const stage = PIPELINE_STAGES.find((s) => s.key === business.stage);

  return (
    <div className="fixed inset-0 z-50">
      <button className="absolute inset-0 bg-black/70 backdrop-blur-[2px] fadein" onClick={onClose} aria-label="إغلاق" />
      <div className="absolute inset-y-0 end-0 flex w-full max-w-xl flex-col border-s border-line bg-coal shadow-2xl slidein-r">
        {/* header */}
        <div className="border-b border-line px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-lg font-extrabold text-fog">{business.name}</h2>
                <Badge tone="gold" className="fnum">{business.leadScore} نقطة</Badge>
              </div>
              <div className="mt-1 text-[10.5px] text-dim">
                {CATEGORIES.find((c) => c.key === business.category)?.ar} • {business.location} • آخر تحديث {timeAgoAr(business.updatedAt)}
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 text-ash hover:text-fog cursor-pointer">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Field label="مرحلة الصفقة" className="flex-1">
              <Select
                value={business.stage}
                onChange={(e) =>
                  start(async () => {
                    await setBusinessStage(business.id, e.target.value);
                    refresh();
                  })
                }
              >
                {PIPELINE_STAGES.map((s) => (
                  <option key={s.key} value={s.key}>{s.ar}</option>
                ))}
              </Select>
            </Field>
            <Field label="إذن التواصل" className="w-36">
              <Select
                value={business.contactPermission}
                onChange={(e) =>
                  start(async () => {
                    await setContactPermission(business.id, e.target.value);
                    refresh();
                  })
                }
              >
                <option value="unknown">غير محدد</option>
                <option value="granted">مسموح</option>
                <option value="denied">مرفوض</option>
              </Select>
            </Field>
          </div>
        </div>

        <Tabs
          className="px-4"
          active={tab}
          onChange={setTab}
          items={[
            { key: "overview", label: "نظرة عامة" },
            { key: "analysis", label: "التحليل", count: data?.analyses.length ?? 0 },
            { key: "outreach", label: "التواصل", count: data?.outreach.length ?? 0 },
            { key: "conversation", label: "المحادثة", count: data?.conversations.reduce((s, c) => s + c.messages.length, 0) ?? 0 },
          ]}
        />

        <div className="flex-1 overflow-y-auto p-5">
          {tab === "overview" && (
            <div className="flex flex-col gap-4 fadein">
              <div className="grid grid-cols-2 gap-3 text-[11.5px]">
                {[
                  ["إنستغرام", business.instagram || "—"],
                  ["الهاتف", business.phone || "—"],
                  ["البريد", business.email || "—"],
                  ["صاحب القرار", business.decisionMaker || "—"],
                  ["العنوان", business.address || "—"],
                  ["الموقع الإلكتروني", business.website || "—"],
                ].map(([k, v]) => (
                  <div key={k} className="border border-line bg-panel px-3 py-2.5">
                    <div className="text-[9.5px] text-dim">{k}</div>
                    <div className="mt-1 font-semibold text-fog break-all" dir="auto">{v}</div>
                  </div>
                ))}
              </div>

              {business.visualOpportunity && (
                <Panel className="border-gold/25 bg-gold/[0.05] p-3.5">
                  <div className="text-[10px] font-bold text-gold">الفرصة البصرية الحالية</div>
                  <p className="mt-1.5 text-[11.5px] leading-5 text-fog">{business.visualOpportunity}</p>
                </Panel>
              )}
              {business.recommendedService && (
                <Panel className="p-3.5">
                  <div className="text-[10px] font-bold text-gold">الخدمة الموصى بها</div>
                  <p className="mt-1.5 text-[11.5px] leading-5 text-fog">{business.recommendedService}</p>
                </Panel>
              )}
              {business.notes && (
                <Panel className="p-3.5">
                  <div className="text-[10px] font-bold text-dim">ملاحظات</div>
                  <p className="mt-1.5 whitespace-pre-wrap text-[11.5px] leading-5 text-ash">{business.notes}</p>
                </Panel>
              )}

              <div className="grid grid-cols-[1fr_130px] gap-3">
                <Field label="الإجراء التالي">
                  <Input value={nextAction} onChange={(e) => setNextAction(e.target.value)} placeholder="مثال: متابعة رد واتساب" />
                </Field>
                <Field label="موعده">
                  <Input type="date" value={nextActionDate} onChange={(e) => setNextActionDate(e.target.value)} />
                </Field>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  loading={pending}
                  onClick={() =>
                    start(async () => {
                      await saveBusiness({
                        id: business.id,
                        name: business.name,
                        category: business.category,
                        location: business.location,
                        instagram: business.instagram,
                        phone: business.phone,
                        email: business.email,
                        website: business.website,
                        address: business.address,
                        decisionMaker: business.decisionMaker,
                        visualOpportunity: business.visualOpportunity,
                        estimatedDealValue: Number(business.estimatedDealValue || 0),
                        notes: business.notes,
                        nextAction,
                        nextActionDate,
                      });
                      refresh();
                    })
                  }
                >
                  حفظ الإجراء التالي
                </Button>
                <Button size="sm" variant="danger" onClick={() => setConfirmDelete(true)}>
                  <Trash2 className="h-3.5 w-3.5" />
                  حذف
                </Button>
              </div>

              <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="حذف النشاط">
                <p className="text-[12px] leading-6 text-ash">
                  سيُحذف «{business.name}» وكل تحليلاته ورسائله ومحادثاته نهائيًا. هذا الإجراء لا يمكن التراجع عنه.
                </p>
                <div className="mt-4 flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setConfirmDelete(false)}>إلغاء</Button>
                  <Button
                    variant="danger"
                    loading={pending}
                    onClick={() =>
                      start(async () => {
                        await deleteBusiness(business.id);
                        setConfirmDelete(false);
                        onClose();
                        router.refresh();
                      })
                    }
                  >
                    حذف نهائي
                  </Button>
                </div>
              </Modal>
            </div>
          )}

          {tab === "analysis" && (
            <div className="flex flex-col gap-4 fadein">
              <Panel className="p-4">
                <div className="mb-2 flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-gold" />
                  <span className="text-[12px] font-bold text-fog">تحليل العميل الذكي</span>
                </div>
                <p className="mb-3 text-[10.5px] leading-4.5 text-ash">
                  اكتب ملاحظاتك الحقيقية عن حسابهم ومحتواهم (الجودة، الانتظام، الأصناف الظاهرة). الذكاء يفصل بين المرصود والافتراض ولا يختلق حقائق.
                </p>
                <Textarea
                  value={analysisInput}
                  onChange={(e) => setAnalysisInput(e.target.value)}
                  placeholder="مثال: آخر منشور قبل أسبوعين، الصور داكنة ومنقولة من واتساب، طبق الشيف المميز غير ظاهر، لديهم خدمة توصيل…"
                  className="min-h-28"
                />
                {analysisErr && <div className="mt-2 text-[11px] font-semibold text-brick">{analysisErr}</div>}
                <Button
                  className="mt-3"
                  loading={analyzing}
                  onClick={async () => {
                    setAnalyzing(true);
                    setAnalysisErr("");
                    const res = await runBusinessAnalysis(business.id, analysisInput);
                    setAnalyzing(false);
                    if (res.error) {
                      setAnalysisErr(res.error);
                      return;
                    }
                    setAnalysisInput("");
                    refresh();
                  }}
                >
                  <BrainCircuit className="h-4 w-4" />
                  حلّل الآن
                </Button>
              </Panel>

              {latest && <AnalysisCard a={latest} onUseDraft={(t) => { setDraft(t); setTab("outreach"); }} />}

              {(data?.analyses.length ?? 0) > 1 && (
                <div className="text-[10px] font-bold text-dim">تحليلات سابقة: {data!.analyses.length - 1}</div>
              )}
            </div>
          )}

          {tab === "outreach" && (
            <div className="flex flex-col gap-4 fadein">
              <Panel className="p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Send className="h-4 w-4 text-gold" />
                  <span className="text-[12px] font-bold text-fog">كاتب التواصل الذكي</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Field label="القناة">
                    <Select value={channel} onChange={(e) => setChannel(e.target.value)}>
                      {CHANNELS.map((c) => (
                        <option key={c.key} value={c.key}>{c.ar}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="النبرة">
                    <Select value={tone} onChange={(e) => setTone(e.target.value)}>
                      {TONES.map((t) => (
                        <option key={t.key} value={t.key}>{t.ar}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="اللغة">
                    <Select value={language} onChange={(e) => setLanguage(e.target.value)}>
                      <option value="ar">العربية</option>
                      <option value="en">English</option>
                    </Select>
                  </Field>
                </div>
                <Button
                  className="mt-3"
                  variant="outline"
                  loading={generating}
                  onClick={async () => {
                    setGenerating(true);
                    const res = await generateOutreach(business.id, tone, channel, language);
                    setGenerating(false);
                    if (res.body) setDraft(res.body);
                  }}
                >
                  ولّد مسودة مخصصة
                </Button>
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="mt-3 min-h-40"
                  placeholder="المسودة تظهر هنا — عدّلها بأسلوبك قبل الحفظ أو الإرسال…"
                />
                {composerMsg && <div className="mt-2 text-[11px] font-semibold text-sage">{composerMsg}</div>}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    loading={pending}
                    disabled={!draft.trim()}
                    onClick={() =>
                      start(async () => {
                        const res = await saveOutreachMessage({ businessId: business.id, channel, tone, language, body: draft });
                        if (res.error) setComposerMsg(res.error);
                        else {
                          setComposerMsg("حُفظت المسودة. أرسلها عبر القناة الرسمية ثم غيّر حالتها إلى «مُرسلة».");
                          refresh();
                        }
                      })
                    }
                  >
                    حفظ المسودة
                  </Button>
                  <CopyButton text={draft} label="نسخ النص" />
                </div>
                <p className="mt-3 border-t border-line pt-3 text-[9.5px] leading-4 text-dim">
                  يُرسل فقط عبر القنوات الرسمية وبإذن تواصل صالح. نحترم قواعد المنصات وحدود الإرسال وطلبات التوقف — الحالة «موقوف» تمنع أي متابعة.
                </p>
              </Panel>

              {(data?.outreach ?? []).map((o) => (
                <Panel key={o.id} className="p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{channelLabel(o.channel)}</Badge>
                    <Badge tone="gray">{toneLabel(o.tone)}</Badge>
                    <span className="text-[9.5px] text-dim">{timeAgoAr(o.createdAt)}</span>
                    <span className="ms-auto">
                      <Select
                        value={o.status}
                        className="h-8 w-32 text-[10.5px]"
                        onChange={(e) =>
                          start(async () => {
                            await setOutreachStatus(o.id, e.target.value);
                            refresh();
                          })
                        }
                      >
                        {["draft", "sent", "delivered", "replied", "interested", "rejected", "suppressed"].map((s) => (
                          <option key={s} value={s}>{outreachStatusLabel(s)}</option>
                        ))}
                      </Select>
                    </span>
                  </div>
                  <p className="mt-2.5 whitespace-pre-wrap text-[11.5px] leading-5.5 text-ash">{o.body}</p>
                  <div className="mt-2"><CopyButton text={o.body} /></div>
                </Panel>
              ))}
            </div>
          )}

          {tab === "conversation" && (
            <div className="flex flex-col gap-4 fadein">
              <Panel className="p-4">
                <div className="mb-3 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-gold" />
                  <span className="text-[12px] font-bold text-fog">سجل المحادثة</span>
                </div>
                <div className="flex flex-col gap-2">
                  {(data?.conversations ?? []).flatMap((c) =>
                    c.messages.map((m, i) => (
                      <div key={`${c.id}-${i}`} className={cn("flex", m.dir === "out" ? "justify-start" : "justify-end")}>
                        <div
                          className={cn(
                            "max-w-[85%] border px-3 py-2 text-[11.5px] leading-5",
                            m.dir === "out" ? "border-line bg-panel text-fog" : "border-gold/30 bg-gold/[0.07] text-fog"
                          )}
                        >
                          <div className="mb-1 text-[8.5px] font-bold text-dim">
                            {m.dir === "out" ? "أنت" : business.name} • {timeAgoAr(m.at)}
                          </div>
                          {m.body}
                        </div>
                      </div>
                    ))
                  )}
                  {(data?.conversations ?? []).every((c) => c.messages.length === 0) && (
                    <div className="py-4 text-center text-[10.5px] text-dim">لا رسائل مسجلة. سجّل الردود الحقيقية هنا.</div>
                  )}
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <Select value={convDir} onChange={(e) => setConvDir(e.target.value as "in" | "out")} className="w-36">
                    <option value="out">أرسلتُ</option>
                    <option value="in">استلمتُ</option>
                  </Select>
                  <Input
                    value={convBody}
                    onChange={(e) => setConvBody(e.target.value)}
                    placeholder="نص الرسالة كما حدثت…"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && convBody.trim()) {
                        start(async () => {
                          await addConversationMessage({
                            businessId: business.id,
                            conversationId: data?.conversations[0]?.id,
                            channel: business.instagram ? "instagram" : "whatsapp",
                            direction: convDir,
                            body: convBody,
                          });
                          setConvBody("");
                          refresh();
                        });
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    loading={pending}
                    disabled={!convBody.trim()}
                    onClick={() =>
                      start(async () => {
                        await addConversationMessage({
                          businessId: business.id,
                          conversationId: data?.conversations[0]?.id,
                          channel: "instagram",
                          direction: convDir,
                          body: convBody,
                        });
                        setConvBody("");
                        refresh();
                      })
                    }
                  >
                    سجّل
                  </Button>
                </div>
              </Panel>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AnalysisCard({ a, onUseDraft }: { a: AnalysisResult | BusinessAnalysis; onUseDraft: (t: string) => void }) {
  return (
    <Panel className="p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] font-bold text-fog">نتيجة التحليل</span>
        <Badge tone={a.confidence >= 60 ? "green" : "amber"} className="fnum">ثقة {a.confidence}%</Badge>
      </div>
      <p className="mt-2 text-[11.5px] leading-5.5 text-fog">{a.summary}</p>

      <div className="mt-4 flex flex-col gap-3">
        <Section title="أدلة مرصودة (حقائق من ملاحظاتك)" items={a.evidence} tone="#7fae8e" />
        <Section title="فرضيات الذكاء (تحتاج تحققًا)" items={a.hypotheses} tone="#c9974b" />
        <Section title="فرص المحتوى المحتملة" items={a.opportunities} tone="#c7a56a" />
      </div>

      {a.concept && (
        <div className="mt-4 border border-line bg-coal px-3 py-2.5">
          <div className="text-[9.5px] font-bold text-gold">المفهوم الإبداعي المقترح</div>
          <p className="mt-1 text-[11.5px] leading-5 text-fog">{a.concept}</p>
        </div>
      )}
      {a.recommendedService && (
        <div className="mt-2 border border-line bg-coal px-3 py-2.5">
          <div className="text-[9.5px] font-bold text-gold">الخدمة المناسبة</div>
          <p className="mt-1 text-[11.5px] leading-5 text-fog">{a.recommendedService}</p>
        </div>
      )}
      {a.outreachDraft && (
        <div className="mt-2 border border-gold/25 bg-gold/[0.05] px-3 py-2.5">
          <div className="text-[9.5px] font-bold text-gold">مسودة رسالة مقترحة</div>
          <p className="mt-1 whitespace-pre-wrap text-[11.5px] leading-5 text-fog">{a.outreachDraft}</p>
          <div className="mt-2 flex gap-2">
            <Button size="sm" variant="subtle" onClick={() => onUseDraft(a.outreachDraft)}>
              استخدمها في التواصل
            </Button>
            <CopyButton text={a.outreachDraft} />
          </div>
        </div>
      )}
    </Panel>
  );
}

function Section({ title, items, tone }: { title: string; items: string[]; tone: string }) {
  if (!items?.length) return null;
  return (
    <div>
      <div className="mb-1.5 text-[10px] font-bold" style={{ color: tone }}>{title}</div>
      <ul className="flex flex-col gap-1">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2 text-[11px] leading-5 text-ash">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full" style={{ background: tone }} />
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}
