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
    <div className="flex h-20 items-end gap-2 pt-2" dir="ltr">
      {data.map((d, i) => (
        <div key={i} className="group relative flex-1 flex flex-col items-center justify-end h-full">
          {d.amount > 0 && (
            <div className="fnum pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#0a0d16] border border-gold/30 px-2 py-0.5 text-[10px] font-bold text-gold opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-20">
              ${Math.round(d.amount)}
            </div>
          )}
          <div
            className={cn(
              "w-full rounded-t-md transition-all duration-300",
              d.amount > 0
                ? "bg-gradient-to-t from-golddeep via-gold to-goldsoft shadow-[0_0_12px_rgba(243,211,140,0.35)] group-hover:brightness-110"
                : "bg-white/[0.06] group-hover:bg-white/[0.12]"
            )}
            style={{ height: `${Math.max(6, (d.amount / max) * 64)}px` }}
          />
          <div className="mt-1.5 text-center text-[8.5px] font-semibold uppercase tracking-wider text-dim group-hover:text-ash">
            {d.label}
          </div>
        </div>
      ))}
    </div>
  );
}

export function LinkCard({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link href={href} className={cn("block transition-all hover:translate-x-[-2px]", className)}>
      {children}
    </Link>
  );
}
