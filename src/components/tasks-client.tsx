"use client";

import { addTaskNote, completeTask, createManualTask, deleteTask, setTaskStatus } from "@/actions/tasks";
import { Badge, Button, EmptyState, Input, Modal, Textarea } from "@/components/ui";
import type { Task } from "@/db/schema";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock,
  Hammer,
  ListChecks,
  Pause,
  Play,
  Target,
  Trash2,
  Trophy,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

const STATUS_LABEL: Record<string, string> = {
  pending: "بانتظار",
  in_progress: "قيد التنفيذ",
  paused: "متوقفة",
  done: "مكتملة",
};

export function TaskRow({ task, compact }: { task: Task; compact?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [result, setResult] = useState(task.resultNote || "");
  const [notes, setNotes] = useState(task.notes || "");
  const [pending, start] = useTransition();

  const done = task.status === "done";

  const act = (fn: () => Promise<unknown>) => start(async () => { await fn(); router.refresh(); });

  return (
    <div className={cn("border border-line bg-panel transition-colors hover:border-line2", done && "opacity-70")}>
      <div className="flex items-center gap-3 px-3.5 py-3">
        <button
          onClick={() => (done ? act(() => setTaskStatus(task.id, "pending")) : setCompleteOpen(true))}
          className="shrink-0 cursor-pointer"
          aria-label="إكمال"
        >
          {done ? (
            <CheckCircle2 className="h-[18px] w-[18px] text-sage" />
          ) : (
            <Circle className="h-[18px] w-[18px] text-dim transition-colors hover:text-gold" />
          )}
        </button>
        <div className="min-w-0 flex-1">
          <div className={cn("truncate text-[12.5px] font-semibold text-fog", done && "line-through decoration-dim")}>
            {task.title}
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-[10px] text-dim">
            {task.kind === "primary" && (
              <span className="inline-flex items-center gap-1 text-gold">
                <Target className="h-3 w-3" /> المهمة الرئيسية
              </span>
            )}
            <span className="fnum inline-flex items-center gap-1">
              <Clock className="h-3 w-3" /> {task.estMinutes} د
            </span>
            {task.status !== "pending" && !done && (
              <Badge tone={task.status === "in_progress" ? "gold" : "gray"}>{STATUS_LABEL[task.status]}</Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!done && (
            <>
              {task.status !== "in_progress" ? (
                <Button size="sm" variant="outline" loading={pending} onClick={() => act(() => setTaskStatus(task.id, "in_progress"))}>
                  <Play className="h-3 w-3" /> ابدأ
                </Button>
              ) : (
                <Button size="sm" variant="ghost" loading={pending} onClick={() => act(() => setTaskStatus(task.id, "paused"))}>
                  <Pause className="h-3 w-3" />
                </Button>
              )}
            </>
          )}
          <button onClick={() => setOpen((v) => !v)} className="p-1.5 text-dim transition-colors hover:text-fog cursor-pointer">
            <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-line px-4 py-4 fadein">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              {task.why && (
                <div className="mb-3">
                  <div className="mb-1 text-[10px] font-bold text-gold">لماذا هذه المهمة مهمة</div>
                  <p className="text-[11.5px] leading-5 text-ash">{task.why}</p>
                </div>
              )}
              {task.steps.length > 0 && (
                <div>
                  <div className="mb-1.5 text-[10px] font-bold text-gold">خطوات التنفيذ</div>
                  <ol className="flex flex-col gap-1.5">
                    {task.steps.map((s, i) => (
                      <li key={i} className="flex gap-2 text-[11.5px] leading-5 text-fog">
                        <span className="fnum mt-0.5 grid h-4 w-4 shrink-0 place-items-center border border-line text-[9px] text-gold">
                          {i + 1}
                        </span>
                        {s}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2.5 text-[11px]">
              {task.tools && (
                <div className="flex gap-2"><span className="w-20 shrink-0 text-dim">الأدوات</span><span className="text-ash">{task.tools}</span></div>
              )}
              {task.deliverable && (
                <div className="flex gap-2"><span className="w-20 shrink-0 text-dim">المُخرَج</span><span className="text-ash">{task.deliverable}</span></div>
              )}
              {task.completionCriteria && (
                <div className="flex gap-2"><span className="w-20 shrink-0 text-dim">معيار الإكمال</span><span className="text-ash">{task.completionCriteria}</span></div>
              )}
              {task.resultNote && (
                <div className="border border-sage/25 bg-sage/[0.06] px-3 py-2 text-sage">
                  <span className="font-bold">النتيجة المسجلة: </span>
                  {task.resultNote}
                </div>
              )}
              <div>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ملاحظاتك حول هذه المهمة…"
                  className="min-h-16 text-[11.5px]"
                />
                <div className="mt-2 flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    loading={pending}
                    onClick={() => act(() => addTaskNote(task.id, notes))}
                  >
                    حفظ الملاحظات
                  </Button>
                  {!task.missionId && (
                    <Button size="sm" variant="danger" loading={pending} onClick={() => act(() => deleteTask(task.id))}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Modal open={completeOpen} onClose={() => setCompleteOpen(false)} title="إكمال المهمة">
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-2.5 border border-line bg-coal px-3.5 py-3">
            <Trophy className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
            <div className="text-[12px] leading-5 text-ash">
              سجّل النتيجة الفعلية أو دليل الإنجاز. الصدق هنا يجعل تحليلات المستشار دقيقة.
              {task.completionCriteria && (
                <div className="mt-1.5 text-gold">معيار الإكمال: {task.completionCriteria}</div>
              )}
            </div>
          </div>
          <Textarea
            autoFocus
            value={result}
            onChange={(e) => setResult(e.target.value)}
            placeholder="مثال: أرسلت 3 رسائل لمطاعم X وY وZ، ردّ واحد منها بسؤال عن السعر…"
          />
          <Button
            loading={pending}
            onClick={() =>
              act(async () => {
                await completeTask(task.id, result);
                setCompleteOpen(false);
              })
            }
          >
            <CheckCircle2 className="h-4 w-4" />
            تأكيد الإكمال
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export function TaskList({ tasks, compact }: { tasks: Task[]; compact?: boolean }) {
  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={<ListChecks className="h-5 w-5" />}
        title="لا مهام هنا بعد"
        hint="المهام تُولَّد يوميًا حسب حالة مشروعك الفعلية، أو أضف مهمة يدوية."
      />
    );
  }
  return (
    <div className="flex flex-col gap-2">
      {tasks.map((t) => (
        <TaskRow key={t.id} task={t} compact={compact} />
      ))}
    </div>
  );
}

export function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5 border border-line bg-panel px-3.5 py-3">
      <span className="text-gold">{icon}</span>
      <div>
        <div className="fnum text-sm font-bold text-fog">{value}</div>
        <div className="text-[9.5px] text-dim">{label}</div>
      </div>
    </div>
  );
}

export function ManualTaskForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [minutes, setMinutes] = useState(30);
  const [pending, start] = useTransition();
  return (
    <form
      className="flex flex-col gap-2 sm:flex-row"
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim()) return;
        start(async () => {
          await createManualTask({ title, estMinutes: minutes, dueDate: "" });
          setTitle("");
          router.refresh();
        });
      }}
    >
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="أضف مهمة تنفيذية بنفسك…" className="flex-1" />
      <div className="flex gap-2">
        <Input
          type="number"
          min={5}
          max={480}
          value={minutes || ""}
          onChange={(e) => setMinutes(Number(e.target.value))}
          className="w-20 fnum"
          title="الدقائق المتوقعة"
        />
        <Button type="submit" variant="outline" loading={pending}>
          إضافة
        </Button>
      </div>
    </form>
  );
}

export { Hammer };
