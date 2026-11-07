"use client";

import { deleteScript, duplicateScript, generateScriptAction, publishScript, saveScript, type ScriptInput } from "@/actions/studio";
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
  Textarea,
} from "@/components/ui";
import type { Script } from "@/db/schema";
import { cn, scriptModeLabel, SCRIPT_MODES, scriptTypeLabel, SCRIPT_TYPES, timeAgoAr } from "@/lib/utils";
import { Clapperboard, Copy, FileDown, Pencil, Plus, Send, Sparkles, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { GeneratedScript } from "@/lib/ai";

const SCRIPT_STATUSES = [
  { key: "draft", ar: "مسودة" },
  { key: "saved", ar: "جاهز" },
  { key: "published", ar: "منشور" },
];

function scriptToText(s: ScriptInput): string {
  const lines = [
    `# ${s.title}`,
    `النوع: ${scriptTypeLabel(s.type)} | النمط: ${scriptModeLabel(s.mode)}`,
    "",
    `## الهوك\n${s.hook}`,
    `## القصة / الموقف\n${s.story}`,
    `## الصراع / التوتر\n${s.conflict}`,
    `## الفكرة المحورية\n${s.insight}`,
    `## التوجيه البصري\n${s.visualDirection}`,
    `## اللقطات\n${s.shotList.map((x, i) => `${i + 1}. ${x}`).join("\n")}`,
    `## التعليق الصوتي\n${s.voiceover}`,
    `## الختام\n${s.ending}`,
    `## الكابشن\n${s.caption}`,
    `## CTA\n${s.cta}`,
  ];
  if (s.commercial && (s.commercial.cameraMovement || s.commercial.adMessage)) {
    lines.push(
      "",
      `## حركة الكاميرا\n${s.commercial.cameraMovement ?? ""}`,
      `## الإضاءة\n${s.commercial.lighting ?? ""}`,
      `## التصميم الصوتي\n${s.commercial.soundDesign ?? ""}`,
      `## ملاحظات المونتاج\n${s.commercial.editingNotes ?? ""}`,
      `## الرسالة الإعلانية الختامية\n${s.commercial.adMessage ?? ""}`
    );
  }
  return lines.join("\n\n");
}

const EMPTY_EDITOR: ScriptInput = {
  title: "",
  type: "reel",
  mode: "confident",
  language: "ar",
  topic: "",
  hook: "",
  story: "",
  conflict: "",
  insight: "",
  visualDirection: "",
  shotList: [],
  voiceover: "",
  ending: "",
  caption: "",
  cta: "",
  commercial: {},
  status: "draft",
};

export default function StudioClient({
  scripts,
  businessOptions,
}: {
  scripts: Script[];
  businessOptions: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [gen, setGen] = useState({ type: "journey", mode: "spontaneous", topic: "", language: "ar", businessId: "" });
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const [editor, setEditor] = useState<ScriptInput | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [shotsText, setShotsText] = useState("");
  const [pending, start] = useTransition();

  const openScript = (s: Script) => {
    setEditId(s.id);
    setShotsText(s.shotList.join("\n"));
    setEditor({
      title: s.title,
      type: s.type,
      mode: s.mode,
      language: s.language,
      topic: s.topic,
      hook: s.hook,
      story: s.story,
      conflict: s.conflict,
      insight: s.insight,
      visualDirection: s.visualDirection,
      shotList: s.shotList,
      voiceover: s.voiceover,
      ending: s.ending,
      caption: s.caption,
      cta: s.cta,
      commercial: s.commercial,
      status: s.status,
    });
  };

  const runGenerate = async () => {
    setGenerating(true);
    setGenError("");
    const bizName = businessOptions.find((b) => b.id === gen.businessId)?.name;
    const res = await generateScriptAction({
      type: gen.type,
      mode: gen.mode,
      topic: gen.topic,
      language: gen.language,
      businessName: bizName,
    });
    setGenerating(false);
    if (!res.script) {
      setGenError(res.error ?? "تعذّر توليد السكربت. حاول مجددًا.");
      return;
    }
    const sc: GeneratedScript = res.script;
    setEditId(null);
    setShotsText(sc.shotList.join("\n"));
    setEditor({
      ...EMPTY_EDITOR,
      title: sc.title || gen.topic || "سكربت جديد",
      type: gen.type,
      mode: gen.mode,
      language: gen.language,
      topic: gen.topic,
      hook: sc.hook,
      story: sc.story,
      conflict: sc.conflict,
      insight: sc.insight,
      visualDirection: sc.visualDirection,
      shotList: sc.shotList,
      voiceover: sc.voiceover,
      ending: sc.ending,
      caption: sc.caption,
      cta: sc.cta,
      commercial: sc.commercial ?? {},
      status: "draft",
    });
  };

  const save = (status?: string) =>
    start(async () => {
      if (!editor) return;
      const payload: ScriptInput = {
        ...editor,
        shotList: shotsText.split("\n").map((x) => x.trim()).filter(Boolean),
        status: status ?? editor.status,
      };
      const res = await saveScript({ ...payload, id: editId ?? undefined });
      if (res.id) setEditId(res.id);
      if (res.error) setGenError(res.error);
      router.refresh();
    });

  const isCommercial = editor && (editor.type === "ad" || editor.mode === "commercial");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        kicker="CONTENT STUDIO — SCRIPTWRITER ENGINE"
        title="ستوديو المحتوى"
        desc="سكربتات تعرف رحلتك الحقيقية: لا ادّعاء إنجازات لم تحدث، لا كليشيهات، لا حماس فارغ."
      />

      {/* generator */}
      <Panel className="rise rise-1 p-5">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-gold" />
          <span className="text-[13px] font-bold text-fog">مولّد السكربتات</span>
          <span className="ms-auto text-[9.5px] text-dim">يُبنى على بياناتك الفعلية: الإيراد، المرحلة، عدد العملاء</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Field label="نوع المحتوى">
            <Select value={gen.type} onChange={(e) => setGen({ ...gen, type: e.target.value })}>
              {SCRIPT_TYPES.map((t) => (
                <option key={t.key} value={t.key}>{t.ar}</option>
              ))}
            </Select>
          </Field>
          <Field label="النمط">
            <Select value={gen.mode} onChange={(e) => setGen({ ...gen, mode: e.target.value })}>
              {SCRIPT_MODES.map((m) => (
                <option key={m.key} value={m.key}>{m.ar}</option>
              ))}
            </Select>
          </Field>
          <Field label="الموضوع (اختياري)">
            <Input value={gen.topic} onChange={(e) => setGen({ ...gen, topic: e.target.value })} placeholder="اتركه فارغًا ليقرر بناءً على وضعك" />
          </Field>
          <Field label="لصالح عميل (للإعلانات)">
            <Select value={gen.businessId} onChange={(e) => setGen({ ...gen, businessId: e.target.value })}>
              <option value="">— محتوى شخصي —</option>
              {businessOptions.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="اللغة">
            <Select value={gen.language} onChange={(e) => setGen({ ...gen, language: e.target.value })}>
              <option value="ar">العربية</option>
              <option value="en">English</option>
            </Select>
          </Field>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Button onClick={runGenerate} loading={generating}>
            <Clapperboard className="h-4 w-4" />
            {generating ? "يكتب السكربت…" : "ولّد السكربت"}
          </Button>
          {generating && <span className="text-[10px] text-dim">قد يستغرق حتى 30 ثانية مع الذكاء الخارجي</span>}
        </div>
        {genError && <div className="mt-3 border border-brick/40 bg-brick/10 px-3 py-2 text-[11.5px] font-semibold text-brick">{genError}</div>}
      </Panel>

      {/* scripts grid */}
      <section className="rise rise-2">
        <Kicker className="mb-3">YOUR SCRIPTS — مكتبة السكربتات</Kicker>
        {scripts.length === 0 ? (
          <EmptyState
            icon={<Clapperboard className="h-5 w-5" />}
            title="لا سكربتات بعد"
            hint="ولّد أول سكربت من الأعلى — سيعكس مرحلتك الحقيقية من الرحلة تلقائيًا."
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {scripts.map((s) => (
              <Panel key={s.id} className="group flex flex-col p-4 transition-colors hover:border-line2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-bold text-fog">{s.title}</div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <Badge tone="gold">{scriptTypeLabel(s.type)}</Badge>
                      <Badge>{scriptModeLabel(s.mode)}</Badge>
                      <Badge tone={s.status === "published" ? "green" : s.status === "saved" ? "amber" : "gray"}>
                        {SCRIPT_STATUSES.find((x) => x.key === s.status)?.ar}
                      </Badge>
                    </div>
                  </div>
                </div>
                {s.hook && <p className="mt-3 line-clamp-2 border-s-2 border-gold/40 ps-2.5 text-[11px] leading-5 text-ash">{s.hook}</p>}
                <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                  <span className="text-[9px] text-dim">{timeAgoAr(s.updatedAt)}</span>
                  <div className="flex items-center gap-1 opacity-70 transition-opacity group-hover:opacity-100">
                    <IconBtn title="تحرير" onClick={() => openScript(s)}><Pencil className="h-3.5 w-3.5" /></IconBtn>
                    <IconBtn title="تصدير نص" onClick={() => {
                      const blob = new Blob([scriptToText({ ...s, id: s.id })], { type: "text/plain;charset=utf-8" });
                      const a = document.createElement("a");
                      a.href = URL.createObjectURL(blob);
                      a.download = `${s.title || "script"}.txt`;
                      a.click();
                    }}><FileDown className="h-3.5 w-3.5" /></IconBtn>
                    <IconBtn title="نسخة" onClick={() => start(async () => { await duplicateScript(s.id); router.refresh(); })}>
                      <Copy className="h-3.5 w-3.5" />
                    </IconBtn>
                    {s.status !== "published" && (
                      <IconBtn title="تم النشر" onClick={() => start(async () => { await publishScript(s.id); router.refresh(); })}>
                        <Send className="h-3.5 w-3.5" />
                      </IconBtn>
                    )}
                    <IconBtn title="حذف" danger onClick={() => start(async () => { await deleteScript(s.id); router.refresh(); })}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </IconBtn>
                  </div>
                </div>
              </Panel>
            ))}
          </div>
        )}
      </section>

      {/* workspace modal */}
      <Modal open={!!editor} onClose={() => setEditor(null)} title={editId ? "تحرير السكربت" : "سكربت جديد"} wide>
        {editor && (
          <div className="flex flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-[1fr_140px_140px]">
              <Field label="العنوان">
                <Input value={editor.title} onChange={(e) => setEditor({ ...editor, title: e.target.value })} />
              </Field>
              <Field label="النوع">
                <Select value={editor.type} onChange={(e) => setEditor({ ...editor, type: e.target.value })}>
                  {SCRIPT_TYPES.map((t) => (
                    <option key={t.key} value={t.key}>{t.ar}</option>
                  ))}
                </Select>
              </Field>
              <Field label="النمط">
                <Select value={editor.mode} onChange={(e) => setEditor({ ...editor, mode: e.target.value })}>
                  {SCRIPT_MODES.map((m) => (
                    <option key={m.key} value={m.key}>{m.ar}</option>
                  ))}
                </Select>
              </Field>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Field label="1 — الهوك">
                <Textarea className="min-h-16" value={editor.hook} onChange={(e) => setEditor({ ...editor, hook: e.target.value })} />
              </Field>
              <Field label="2 — القصة / الموقف">
                <Textarea className="min-h-16" value={editor.story} onChange={(e) => setEditor({ ...editor, story: e.target.value })} />
              </Field>
              <Field label="3 — الصراع / التوتر">
                <Textarea className="min-h-16" value={editor.conflict} onChange={(e) => setEditor({ ...editor, conflict: e.target.value })} />
              </Field>
              <Field label="4 — الفكرة المحورية">
                <Textarea className="min-h-16" value={editor.insight} onChange={(e) => setEditor({ ...editor, insight: e.target.value })} />
              </Field>
              <Field label="5 — التوجيه البصري">
                <Textarea className="min-h-16" value={editor.visualDirection} onChange={(e) => setEditor({ ...editor, visualDirection: e.target.value })} />
              </Field>
              <Field label="6 — قائمة اللقطات (لقطة في كل سطر)">
                <Textarea className="min-h-16" dir="auto" value={shotsText} onChange={(e) => setShotsText(e.target.value)} />
              </Field>
              <Field label="7 — التعليق الصوتي">
                <Textarea className="min-h-16" value={editor.voiceover} onChange={(e) => setEditor({ ...editor, voiceover: e.target.value })} />
              </Field>
              <Field label="8 — الختام">
                <Textarea className="min-h-16" value={editor.ending} onChange={(e) => setEditor({ ...editor, ending: e.target.value })} />
              </Field>
              <Field label="9 — الكابشن">
                <Textarea className="min-h-16" dir="auto" value={editor.caption} onChange={(e) => setEditor({ ...editor, caption: e.target.value })} />
              </Field>
              <Field label="10 — دعوة لاتخاذ إجراء (CTA)">
                <Textarea className="min-h-16" value={editor.cta} onChange={(e) => setEditor({ ...editor, cta: e.target.value })} />
              </Field>
            </div>

            {isCommercial && (
              <div className="border border-gold/25 bg-gold/[0.04] p-4">
                <div className="mb-3 text-[11px] font-bold text-gold">حقول الإنتاج الإعلاني</div>
                <div className="grid gap-3 md:grid-cols-2">
                  {(
                    [
                      ["cameraMovement", "حركة الكاميرا"],
                      ["lighting", "توجيه الإضاءة"],
                      ["soundDesign", "التصميم الصوتي"],
                      ["editingNotes", "ملاحظات المونتاج"],
                      ["adMessage", "الرسالة الإعلانية الختامية"],
                    ] as const
                  ).map(([k, label]) => (
                    <Field key={k} label={label} className={k === "adMessage" ? "md:col-span-2" : ""}>
                      <Textarea
                        className="min-h-14"
                        value={editor.commercial?.[k] ?? ""}
                        onChange={(e) => setEditor({ ...editor, commercial: { ...editor.commercial, [k]: e.target.value } })}
                      />
                    </Field>
                  ))}
                </div>
              </div>
            )}

            {genError && <div className="text-[11px] font-semibold text-brick">{genError}</div>}

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4">
              <div className="flex gap-2">
                <Button loading={pending} onClick={() => save(editor.status === "draft" ? "saved" : editor.status)}>
                  {editId ? "حفظ التعديلات" : "حفظ السكربت"}
                </Button>
                <Button variant="outline" loading={pending} onClick={() => save("draft")}>
                  حفظ كمسودة
                </Button>
              </div>
              <div className="flex gap-2">
                <CopyButton text={scriptToText({ ...editor, shotList: shotsText.split("\n").filter(Boolean) })} label="نسخ كامل" />
                <DownloadButton
                  filename={`${editor.title || "script"}.txt`}
                  text={scriptToText({ ...editor, shotList: shotsText.split("\n").filter(Boolean) })}
                />
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function IconBtn({ children, onClick, title, danger }: { children: React.ReactNode; onClick: () => void; title: string; danger?: boolean }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={cn(
        "grid h-7 w-7 place-items-center border border-transparent text-dim transition-colors hover:border-line cursor-pointer",
        danger ? "hover:text-brick" : "hover:text-gold"
      )}
    >
      {children}
    </button>
  );
}
