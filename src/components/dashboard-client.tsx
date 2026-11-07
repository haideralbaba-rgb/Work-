"use client";

import { ensureMissionAction, setTaskStatus } from "@/actions/tasks";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function StartMissionButton({ taskId, done }: { taskId?: string; done?: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      size="lg"
      loading={pending}
      disabled={done}
      className={cn(done && "opacity-50")}
      onClick={() =>
        start(async () => {
          if (taskId) await setTaskStatus(taskId, "in_progress");
          router.push("/mission");
        })
      }
    >
      {done ? "اكتملت — أحسنت" : "ابدأ التنفيذ الآن"}
      {!done && <ArrowLeft className="h-4 w-4" />}
    </Button>
  );
}

export function GenerateMissionButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      loading={pending}
      onClick={() =>
        start(async () => {
          await ensureMissionAction();
          router.refresh();
        })
      }
    >
      <Sparkles className="h-4 w-4" />
      ولّد مهمة اليوم
    </Button>
  );
}

export function WeeklyBars({ data }: { data: { label: string; amount: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.amount));
  return (
    <div className="flex h-20 items-end gap-1.5" dir="ltr">
      {data.map((d, i) => (
        <div key={i} className="group relative flex-1">
          <div
            className={cn("w-full transition-all", d.amount > 0 ? "bg-gold" : "bg-line/70 group-hover:bg-line2")}
            style={{ height: `${Math.max(4, (d.amount / max) * 76)}px` }}
          />
          <div className="mt-1 text-center text-[7.5px] uppercase tracking-wide text-dim">{d.label}</div>
          {d.amount > 0 && (
            <div className="fnum pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-raised border border-line px-1 py-0.5 text-[8.5px] text-gold opacity-0 group-hover:opacity-100">
              ${Math.round(d.amount)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function LinkCard({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link href={href} className={cn("block transition-transform hover:-translate-y-0.5", className)}>
      {children}
    </Link>
  );
}
