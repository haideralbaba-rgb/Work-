"use client";

import { setRoadmapTaskStatus } from "@/actions/tasks";
import { Badge, Button, Modal, ProgressBar, Textarea } from "@/components/ui";
import type { RoadmapTask } from "@/db/schema";
import type { PhaseView } from "@/lib/metrics";
import { cn } from "@/lib/utils";
import { CheckCircle2, ChevronDown, Circle, CircleDot, Lock, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function PhaseAccordion({
  phases,
  tasksByPhase,
  recs,
}: {
  phases: PhaseView[];
  tasksByPhase: Record<string, RoadmapTask[]>;
  recs: Record<string, string>;
}) {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(phases.find((p) => p.computedStatus === "active")?.id ?? phases[0]?.id ?? null);
  const [completing, setCompleting] = useState<RoadmapTask | null>(null);
  const [evidence, setEvidence] = useState("");
  const [pending, start] = useTransition();

  return (
    <div className="flex flex-col gap-3">
      {phases.map((phase, i) => {
        const locked = phase.computedStatus === "locked";
        const completed = phase.computedStatus === "completed";
        const open = openId === phase.id && !locked;
        const tasks = tasksByPhase[phase.id] ?? [];
        return (
          <div
            key={phase.id}
            className={cn(
              "rise border bg-panel transition-colors",
              open ? "border-gold/40" : "border-line",
              locked && "opacity-55"
            )}
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <button
              className="flex w-full items-center gap-4 px-5 py-4 text-start cursor-pointer"
              onClick={() => setOpenId(open ? null : phase.id)}
              disabled={locked}
            >
              <div
                className={cn(
                  "fnum grid h-11 w-11 shrink-0 place-items-center border text-sm font-black",
                  completed
                    ? "border-sage/50 bg-sage/10 text-sage"
                    : locked
                      ? "border-line bg-coal text-dim"
                      : "border-gold/50 bg-gold/10 text-gold"
                )}
              >
                {locked ? <Lock className="h-4 w-4" /> : String(phase.idx).padStart(2, "0")}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-ar text-[15px] font-extrabold text-fog">{phase.titleAr}</span>
                  <span className="fnum text-[9px] font-bold uppercase tracking-[0.25em] text-dim">{phase.titleEn}</span>
                  {completed && <Badge tone="green">مكتملة</Badge>}
                  {phase.computedStatus === "active" && <Badge tone="gold">نشطة</Badge>}
                  {locked && <Badge>مقفلة</Badge>}
                </div>
                <div className="mt-1 truncate text-[11px] text-ash">{phase.objectiveAr}</div>
              </div>
              <div className="hidden w-32 shrink-0 sm:block">
                <div className="fnum mb-1.5 text-end text-[11px] font-bold text-gold">{phase.progress}%</div>
                <ProgressBar value={phase.progress} />
                <div className="fnum mt-1 text-end text-[9px] text-dim">
                  {phase.doneCount}/{phase.totalCount} مهمة
                </div>
              </div>
              {!locked && (
                <ChevronDown className={cn("h-4 w-4 shrink-0 text-dim transition-transform", open && "rotate-180")} />
              )}
            </button>

            {locked && (
              <div className="flex items-center gap-2 border-t border-line/60 px-5 py-3 text-[10.5px] text-dim">
                <Lock className="h-3 w-3" /> {phase.unlockRule}
              </div>
            )}

            {open && (
              <div className="border-t border-line px-5 py-5 fadein">
                {recs[phase.id] && (
                  <div className="mb-4 flex items-start gap-2.5 border border-gold/25 bg-gold/[0.05] px-3.5 py-3">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                    <div className="text-[11.5px] leading-5">
                      <span className="font-bold text-gold">توصية المستشار: </span>
                      <span className="text-ash">{recs[phase.id]}</span>
                    </div>
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  {tasks.map((t) => {
                    const done = t.status === "done";
                    return (
                      <div
                        key={t.id}
                        className={cn(
                          "flex items-start gap-3 border px-3.5 py-3 transition-colors",
                          done ? "border-sage/20 bg-sage/[0.04]" : "border-line bg-coal"
                        )}
                      >
                        <button
                          className="mt-0.5 shrink-0 cursor-pointer"
                          onClick={() => {
                            if (done) {
                              start(async () => {
                                await setRoadmapTaskStatus(t.id, "pending", "");
                                router.refresh();
                              });
                            } else {
                              setEvidence(t.evidence || "");
                              setCompleting(t);
                            }
                          }}
                        >
                          {done ? (
                            <CheckCircle2 className="h-[17px] w-[17px] text-sage" />
                          ) : t.status === "in_progress" ? (
                            <CircleDot className="h-[17px] w-[17px] text-gold" />
                          ) : (
                            <Circle className="h-[17px] w-[17px] text-dim hover:text-gold" />
                          )}
                        </button>
                        <div className="min-w-0 flex-1">
                          <div className={cn("text-[12.5px] font-bold text-fog", done && "line-through decoration-dim")}>
                            {t.titleAr}
                          </div>
                          {t.descAr && <div className="mt-1 text-[11px] leading-5 text-ash">{t.descAr}</div>}
                          {done && t.evidence && (
                            <div className="mt-1.5 text-[10.5px] text-sage">الدليل: {t.evidence}</div>
                          )}
                        </div>
                        {!done && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEvidence(t.evidence || "");
                              setCompleting(t);
                            }}
                          >
                            إكمال
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}

      <Modal open={!!completing} onClose={() => setCompleting(null)} title="تأكيد إنجاز مهمة خارطة الطريق">
        <div className="flex flex-col gap-4">
          <div>
            <div className="text-[13px] font-bold text-fog">{completing?.titleAr}</div>
            {completing?.evidenceHint && (
              <div className="mt-2 border border-line bg-coal px-3 py-2 text-[11px] leading-5 text-ash">
                <span className="font-bold text-gold">دليل الإنجاز المطلوب: </span>
                {completing.evidenceHint}
              </div>
            )}
          </div>
          <Textarea
            autoFocus
            value={evidence}
            onChange={(e) => setEvidence(e.target.value)}
            placeholder="أدخل دليل الإنجاز: رابط، وصف، نتيجة رقمية…"
          />
          <Button
            loading={pending}
            onClick={() =>
              start(async () => {
                if (!completing) return;
                await setRoadmapTaskStatus(completing.id, "done", evidence);
                setCompleting(null);
                router.refresh();
              })
            }
          >
            <CheckCircle2 className="h-4 w-4" />
            تأكيد الإنجاز
          </Button>
        </div>
      </Modal>
    </div>
  );
}
