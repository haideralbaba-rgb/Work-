"use client";

import { cn } from "@/lib/utils";
import { Check, Copy, Download, Loader2, X } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

/* --------------------------------- buttons -------------------------------- */

type BtnVariant = "primary" | "ghost" | "outline" | "danger" | "subtle";

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  loading,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: BtnVariant;
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none select-none cursor-pointer";
  const variants: Record<BtnVariant, string> = {
    primary:
      "bg-gold text-[#171307] hover:bg-goldsoft border border-gold shadow-[0_0_0_1px_rgba(199,165,106,0.15),0_8px_24px_-12px_rgba(199,165,106,0.4)]",
    ghost: "text-ash hover:text-fog hover:bg-panel border border-transparent",
    outline: "text-fog border border-line hover:border-gold/60 hover:text-gold bg-panel/40",
    danger: "text-brick border border-brick/30 hover:bg-brick/10",
    subtle: "text-gold/90 bg-gold/10 border border-gold/20 hover:bg-gold/15",
  };
  const sizes = {
    sm: "text-xs px-3 h-8",
    md: "text-[13px] px-4 h-9.5",
    lg: "text-sm px-6 h-11 font-semibold",
  };
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} disabled={loading || rest.disabled} {...rest}>
      {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {children}
    </button>
  );
}

/* --------------------------------- panels --------------------------------- */

export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("bg-panel border border-line", className)}>{children}</div>
  );
}

export function Kicker({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("kicker", className)}>{children}</div>;
}

export function PageHeader({
  kicker,
  title,
  desc,
  actions,
}: {
  kicker: string;
  title: string;
  desc?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 rise">
      <div>
        <Kicker className="mb-3">{kicker}</Kicker>
        <h1 className="font-ar text-3xl md:text-4xl font-extrabold tracking-tight text-fog">{title}</h1>
        {desc && <p className="mt-2 text-[13px] leading-6 text-ash max-w-2xl">{desc}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

/* --------------------------------- forms ---------------------------------- */

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-[11px] font-semibold text-ash">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[10px] text-dim">{hint}</span>}
    </label>
  );
}

const inputCls =
  "w-full bg-coal border border-line px-3 h-10 text-[13px] text-fog placeholder:text-dim outline-none transition-colors focus:border-gold/60 focus:bg-[#141414]";

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputCls, className)} {...rest} />;
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(inputCls, "h-auto min-h-24 py-2.5 leading-6", className)} {...rest} />;
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(inputCls, "appearance-none cursor-pointer", className)} {...rest}>
      {children}
    </select>
  );
}

/* --------------------------------- badges --------------------------------- */

type Tone = "gold" | "green" | "amber" | "red" | "gray";

export function Badge({ tone = "gray", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  const tones: Record<Tone, string> = {
    gold: "text-gold bg-gold/10 border-gold/25",
    green: "text-sage bg-sage/10 border-sage/25",
    amber: "text-amber bg-amber/10 border-amber/25",
    red: "text-brick bg-brick/10 border-brick/25",
    gray: "text-ash bg-white/4 border-line",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 border px-2 py-0.5 text-[10px] font-semibold", tones[tone], className)}>
      {children}
    </span>
  );
}

export function Dot({ color, className }: { color: string; className?: string }) {
  return <span className={cn("inline-block h-1.5 w-1.5 rounded-full shrink-0", className)} style={{ background: color }} />;
}

/* -------------------------------- progress -------------------------------- */

export function ProgressBar({ value, className, barClass }: { value: number; className?: string; barClass?: string }) {
  return (
    <div className={cn("h-1 w-full bg-line overflow-hidden", className)}>
      <div
        className={cn("h-full bg-gold transition-all duration-700", barClass)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function GoalRing({
  pct,
  size = 168,
  stroke = 6,
  children,
}: {
  pct: number;
  size?: number;
  stroke?: number;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#232323" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#c7a56a"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (Math.min(100, pct) / 100) * c}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}

/* ------------------------------ empty / load ------------------------------ */

export function EmptyState({
  icon,
  title,
  hint,
  action,
}: {
  icon: ReactNode;
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 border border-dashed border-line py-12 px-6 text-center">
      <div className="grid h-11 w-11 place-items-center border border-line bg-panel text-gold">{icon}</div>
      <div className="text-sm font-bold text-fog">{title}</div>
      {hint && <div className="max-w-sm text-xs leading-5 text-ash">{hint}</div>}
      {action}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-5 w-5 animate-spin text-gold", className)} />;
}

/* ---------------------------------- modal --------------------------------- */

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <button aria-label="close" className="absolute inset-0 bg-black/70 backdrop-blur-[2px] fadein" onClick={onClose} />
      <div
        className={cn(
          "relative z-10 max-h-[88vh] w-full overflow-y-auto border border-line2 bg-panel shadow-2xl rise",
          wide ? "max-w-3xl" : "max-w-lg"
        )}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-panel px-5 py-3.5">
          <div className="font-ar text-sm font-bold text-fog">{title}</div>
          <button onClick={onClose} className="text-ash transition-colors hover:text-fog cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

/* ---------------------------------- tabs ---------------------------------- */

export function Tabs({
  items,
  active,
  onChange,
  className,
}: {
  items: { key: string; label: string; count?: number }[];
  active: string;
  onChange: (k: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-1 border-b border-line", className)}>
      {items.map((it) => (
        <button
          key={it.key}
          onClick={() => onChange(it.key)}
          className={cn(
            "relative px-3.5 pb-2.5 pt-1 text-[12.5px] font-semibold transition-colors cursor-pointer",
            active === it.key ? "text-gold" : "text-ash hover:text-fog"
          )}
        >
          {it.label}
          {typeof it.count === "number" && (
            <span className={cn("mr-1.5 fnum text-[10px]", active === it.key ? "text-gold/80" : "text-dim")}>
              ({it.count})
            </span>
          )}
          {active === it.key && <span className="absolute inset-x-2 -bottom-px h-px bg-gold" />}
        </button>
      ))}
    </div>
  );
}

/* ---------------------------- copy & download ------------------------------ */

export function CopyButton({ text, label = "نسخ" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          /* noop */
        }
      }}
    >
      {done ? <Check className="h-3.5 w-3.5 text-sage" /> : <Copy className="h-3.5 w-3.5" />}
      {done ? "تم النسخ" : label}
    </Button>
  );
}

export function DownloadButton({ filename, text, label = "تصدير" }: { filename: string; text: string; label?: string }) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      }}
    >
      <Download className="h-3.5 w-3.5" />
      {label}
    </Button>
  );
}

/* -------------------------------- stat card -------------------------------- */

export function Stat({
  label,
  value,
  hint,
  icon,
  accent,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  accent?: string;
  className?: string;
}) {
  return (
    <div className={cn("border border-line bg-panel p-4 transition-colors hover:border-line2", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10.5px] font-semibold text-ash">{label}</span>
        {icon && <span className="text-dim">{icon}</span>}
      </div>
      <div className="fnum mt-2 text-[22px] font-bold tracking-tight" style={{ color: accent ?? "#f5f5f5" }}>
        {value}
      </div>
      {hint && <div className="mt-1 text-[10.5px] text-dim">{hint}</div>}
    </div>
  );
}

/* ------------------------------- ai typing --------------------------------- */

export function ThinkingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-gold/70 animate-pulse"
          style={{ animationDelay: `${i * 180}ms` }}
        />
      ))}
    </span>
  );
}

export function useDebounced<T>(value: T, delay = 300): T {
  const [v, setV] = useState(value);
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (t.current) clearTimeout(t.current);
    t.current = setTimeout(() => setV(value), delay);
    return () => {
      if (t.current) clearTimeout(t.current);
    };
  }, [value, delay]);
  return v;
}
