"use client";

import { clearStrategist, sendStrategistMessage } from "@/actions/strategist";
import { Badge, Button, Kicker, Panel, ThinkingDots } from "@/components/ui";
import { cn, fmtUsd } from "@/lib/utils";
import { BrainCircuit, RotateCcw, SendHorizonal, Sparkles } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";

type Msg = { id: string; role: string; content: string };

const QUICK = [
  "ما أهم خطوة يجب أن أنفذها اليوم؟",
  "لماذا لا أملك عملاء حتى الآن؟",
  "كيف أسعّر خدماتي لمطاعم كربلاء؟",
  "راجع وضعي الحالي وشخّص الاختناق",
  "أشعر أنني أخطط أكثر مما أُنفّذ",
  "كيف أحوّل محادثة مهتمة إلى صفقة مدفوعة؟",
];

function Rich({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <p className="whitespace-pre-wrap">
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? (
          <strong key={i} className="font-bold text-goldsoft">
            {p.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </p>
  );
}

export default function StrategistChat({
  initialMessages,
  context,
}: {
  initialMessages: Msg[];
  context: {
    businessName: string;
    target: number;
    collected: number;
    pct: number;
    leads: number;
    qualified: number;
    outreach: number;
    proposals: number;
    deals: number;
    conversations: number;
    openTasks: number;
    overdue: number;
    phaseTitle: string;
    phaseProgress: number;
  };
}) {
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [input, setInput] = useState("");
  const [pending, start] = useTransition();
  const [clearing, startClear] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);

  const send = (text: string) => {
    const t = text.trim();
    if (!t || pending) return;
    const optimistic: Msg = { id: `tmp-${Date.now()}`, role: "user", content: t };
    setMessages((m) => [...m, optimistic]);
    setInput("");
    start(async () => {
      const res = await sendStrategistMessage(t);
      if (res.reply) {
        setMessages((m) => [...m, { id: `rep-${Date.now()}`, role: "assistant", content: res.reply! }]);
      } else {
        setMessages((m) => [
          ...m,
          { id: `err-${Date.now()}`, role: "assistant", content: res.error ?? "تعذّر توليد رد. حاول مجددًا." },
        ]);
      }
    });
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_290px]">
      {/* chat */}
      <div className="rise flex min-h-[70vh] flex-col">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <Kicker>AI STRATEGIST — عقل المنصة</Kicker>
            <h1 className="font-ar mt-2 text-2xl font-extrabold text-fog md:text-3xl">المستشار الذكي</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            loading={clearing}
            onClick={() =>
              startClear(async () => {
                await clearStrategist();
                setMessages([]);
              })
            }
          >
            <RotateCcw className="h-3.5 w-3.5" />
            محادثة جديدة
          </Button>
        </div>

        <Panel className="flex flex-1 flex-col overflow-hidden">
          <div className="flex items-center gap-3 border-b border-line px-5 py-3.5">
            <div className="grid h-9 w-9 place-items-center border border-gold/40 bg-gold/10">
              <BrainCircuit className="h-4.5 w-4.5 text-gold" />
            </div>
            <div>
              <div className="fnum text-[12px] font-extrabold tracking-[0.14em] text-fog">INDEPENDENT STRATEGIST</div>
              <div className="text-[10px] text-ash">يقرأ بياناتك الفعلية قبل أي نصيحة • يتحداك عند اللزوم</div>
            </div>
            <span className="ms-auto flex items-center gap-1.5 text-[9.5px] text-sage">
              <span className="h-1.5 w-1.5 rounded-full bg-sage animate-pulse" /> متصل ببيانات مشروعك
            </span>
          </div>

          <div ref={scrollRef} className="chat-scroll flex-1 overflow-y-auto px-4 py-5 md:px-6">
            {messages.length === 0 && (
              <div className="mx-auto mt-6 max-w-md text-center">
                <div className="mx-auto grid h-12 w-12 place-items-center border border-gold/40 bg-gold/10">
                  <Sparkles className="h-5 w-5 text-gold" />
                </div>
                <div className="font-ar mt-4 text-lg font-bold text-fog">أنا شريكك الاستراتيجي، لا مجرد ردود</div>
                <p className="mt-2 text-[11.5px] leading-5 text-ash">
                  أرى أرقامك الفعلية: {context.leads} جهة، {context.outreach} رسالة، {context.proposals} عروض، و
                  {fmtUsd(context.collected)} محصّلة. اسألني — أو جرّب:
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {QUICK.map((q) => (
                    <button
                      key={q}
                      onClick={() => send(q)}
                      className="border border-line bg-coal px-3 py-2 text-[11px] text-ash transition-colors hover:border-gold/50 hover:text-gold cursor-pointer"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex flex-col gap-4">
              {messages.map((m) => (
                <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[86%] border px-4 py-3 text-[12.5px] leading-6 fadein md:max-w-[76%]",
                      m.role === "user"
                        ? "border-gold/30 bg-gold/[0.08] text-fog"
                        : "border-line bg-coal text-fog"
                    )}
                  >
                    {m.role === "assistant" && (
                      <div className="fnum mb-1.5 text-[8.5px] font-bold tracking-[0.25em] text-gold">STRATEGIST</div>
                    )}
                    <Rich text={m.content} />
                  </div>
                </div>
              ))}
              {pending && (
                <div className="flex justify-start">
                  <div className="border border-line bg-coal px-4 py-2.5">
                    <ThinkingDots />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-line p-3">
            <form
              className="flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="اسأل: ماذا أفعل الآن؟ كيف أغلق هذه الصفقة؟…"
                className="h-11 flex-1 border border-line bg-coal px-4 text-[13px] text-fog placeholder:text-dim outline-none focus:border-gold/60"
              />
              <Button type="submit" loading={pending} className="h-11 px-5">
                <SendHorizonal className="h-4 w-4 -scale-x-100" />
              </Button>
            </form>
          </div>
        </Panel>
      </div>

      {/* live context */}
      <div className="rise rise-1 flex flex-col gap-4">
        <div>
          <Kicker className="mb-2.5">LIVE BUSINESS CONTEXT</Kicker>
          <Panel className="p-4">
            <div className="mb-3 text-[11px] font-bold text-ash">ما يراه المستشار الآن</div>
            <div className="flex flex-col gap-2.5 text-[11px]">
              {[
                ["المشروع", context.businessName || "—"],
                ["المرحلة", context.phaseTitle],
                ["الهدف", `${fmtUsd(context.collected)} / ${fmtUsd(context.target)} (${context.pct}%)`],
                ["قاعدة العملاء", `${context.leads} جهة • ${context.qualified} مؤهلة`],
                ["رسائل التواصل", String(context.outreach)],
                ["محادثات نشطة", String(context.conversations)],
                ["عروض مرسلة", String(context.proposals)],
                ["صفقات", String(context.deals)],
                ["مهام مفتوحة/متأخرة", `${context.openTasks} / ${context.overdue}`],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between border-b border-line/50 pb-2 last:border-0">
                  <span className="text-dim">{k}</span>
                  <span className="fnum font-bold text-fog">{v}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
        <Panel className="border-gold/25 bg-gold/[0.04] p-4">
          <div className="text-[11px] font-bold text-gold">قواعد اللعبة</div>
          <ul className="mt-2 flex flex-col gap-1.5 text-[10.5px] leading-4.5 text-ash">
            <li>• النشاط ليس تقدمًا — التحصيل هو التقدم.</li>
            <li>• المتابع ليس عميلًا.</li>
            <li>• العرض ليس إيرادًا.</li>
            <li>• كل رد ينتهي بخطوة تنفيذية واحدة.</li>
          </ul>
        </Panel>
        <Badge tone="gray" className="justify-center py-2">
          يعمل بنظام ذكاء محلي + OpenAI عند توفر المفتاح
        </Badge>
      </div>
    </div>
  );
}
