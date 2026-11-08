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
    "relative inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none select-none cursor-pointer active:scale-[0.98] rounded-xl";
  const variants: Record<BtnVariant, string> = {
    primary:
      "bg-gradient-to-r from-[#d8b05c] via-[#f5d996] to-[#c89b42] text-[#06070a] shadow-[0_4px_20px_rgba(243,211,140,0.35)] hover:shadow-[0_4px_28px_rgba(243,211,140,0.55)] hover:brightness-105 border border-white/30 font-bold",
    ghost: "text-ash hover:text-fog hover:bg-white/[0.06] border border-transparent",
    outline:
      "text-fog border border-white/[0.12] hover:border-gold/60 hover:text-gold bg-white/[0.03] hover:bg-gold/[0.06] backdrop-blur-sm shadow-sm",
    danger:
      "text-brick border border-brick/30 bg-brick/10 hover:bg-brick/20 shadow-[0_0_15px_rgba(244,63,94,0.15)]",
    subtle:
      "text-gold bg-gold/10 border border-gold/25 hover:bg-gold/20 hover:border-gold/40 shadow-sm",
  };
  const sizes = {
    sm: "text-xs px-3 h-8 gap-1.5",
    md: "text-[13px] px-4 h-9.5 gap-2",
    lg: "text-sm px-6 h-11 font-bold gap-2.5",
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
    <div
      className={cn(
        "relative rounded-2xl border border-white/[0.08] bg-[#0c101a]/85 backdrop-blur-xl shadow-[0_12px_40px_-15px_rgba(0,0,0,0.6)] transition-all duration-300 hover:border-white/[0.14] overflow-hidden",
        "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
        className
      )}
    >
      {children}
    </div>
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
    <div className="flex flex-wrap items-end justify-between gap-4 rise pb-2">
      <div>
        <Kicker className="mb-3">{kicker}</Kicker>
        <h1 className="font-ar text-3xl md:text-4xl font-extrabold tracking-tight text-fog bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
          {title}
        </h1>
        {desc && <p className="mt-2 text-[13.5px] leading-6 text-ash max-w-2xl">{desc}</p>}
      </div>
      {actions && <div className="flex items-center gap-2.5">{actions}</div>}
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
      <span className="mb-1.5 block text-[11.5px] font-semibold text-ash">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-[10.5px] text-dim">{hint}</span>}
    </label>
  );
}

const inputCls =
  "w-full rounded-xl bg-[#090d16]/90 border border-white/[0.09] px-3.5 h-10 text-[13px] text-fog placeholder:text-dim outline-none transition-all focus:border-gold/70 focus:ring-2 focus:ring-gold/20 focus:bg-[#0e1422] shadow-inner";

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
  const tones: Record<Tone, { badge: string; dot: string }> = {
    gold: {
      badge: "text-gold bg-gold/10 border-gold/30 shadow-[0_0_12px_rgba(243,211,140,0.12)]",
      dot: "bg-gold shadow-[0_0_6px_#f3d38c]",
    },
    green: {
      badge: "text-sage bg-sage/10 border-sage/30 shadow-[0_0_12px_rgba(52,211,153,0.12)]",
      dot: "bg-sage shadow-[0_0_6px_#34d399]",
    },
    amber: {
      badge: "text-amber bg-amber/10 border-amber/30 shadow-[0_0_12px_rgba(251,191,36,0.12)]",
      dot: "bg-amber shadow-[0_0_6px_#fbbf24]",
    },
    red: {
      badge: "text-brick bg-brick/10 border-brick/30 shadow-[0_0_12px_rgba(244,63,94,0.12)]",
      dot: "bg-brick shadow-[0_0_6px_#f43f5e]",
    },
    gray: {
      badge: "text-ash bg-white/[0.04] border-white/10",
      dot: "bg-slate-400",
    },
  };

  const current = tones[tone];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10.5px] font-semibold backdrop-blur-md transition-colors",
        current.badge,
        className
      )}
    >
      <span className={cn("inline-block h-1.5 w-1.5 rounded-full shrink-0", current.dot)} />
      {children}
    </span>
  );
}

export function Dot({ color, className }: { color: string; className?: string }) {
  return (
    <span
      className={cn("inline-block h-2 w-2 rounded-full shrink-0 shadow-sm", className)}
      style={{ background: color, boxShadow: `0 0 6px ${color}` }}
    />
  );
}

/* -------------------------------- progress -------------------------------- */

export function ProgressBar({ value, className, barClass }: { value: number; className?: string; barClass?: string }) {
  return (
    <div className={cn("h-1.5 w-full rounded-full bg-white/[0.07] overflow-hidden", className)}>
      <div
        className={cn(
          "h-full rounded-full bg-gradient-to-r from-golddeep via-gold to-goldsoft shadow-[0_0_10px_rgba(243,211,140,0.5)] transition-all duration-700",
          barClass
        )}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function GoalRing({
  pct,
  size = 168,
  stroke = 7,
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
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#goldGradient)"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (Math.min(100, pct) / 100) * c}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.22,1,0.36,1)" }}
        />
        <defs>
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c59b48" />
            <stop offset="50%" stopColor="#f3d38c" />
            <stop offset="100%" stopColor="#fae4b5" />
          </linearGradient>
        </defs>
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
    <div className="flex flex-col items-center justify-center gap-3.5 rounded-2xl border border-dashed border-white/10 bg-white/[0.015] py-12 px-6 text-center backdrop-blur-sm">
      <div className="grid h-12 w-12 place-items-center rounded-2xl border border-gold/30 bg-gradient-to-br from-gold/15 to-gold/5 text-gold shadow-[0_0_20px_rgba(243,211,140,0.15)]">
        {icon}
      </div>
      <div className="text-sm font-bold text-fog">{title}</div>
      {hint && <div className="max-w-sm text-xs leading-5 text-ash">{hint}</div>}
      {action && <div className="mt-2">{action}</div>}
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
      <button aria-label="close" className="absolute inset-0 bg-black/80 backdrop-blur-md fadein" onClick={onClose} />
      <div
        className={cn(
          "relative z-10 max-h-[88vh] w-full overflow-y-auto rounded-2xl border border-white/15 bg-[#0a0d16]/95 backdrop-blur-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] rise",
          wide ? "max-w-3xl" : "max-w-lg"
        )}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/[0.08] bg-[#0a0d16]/90 backdrop-blur-xl px-5 py-3.5">
          <div className="font-ar text-sm font-bold text-fog">{title}</div>
          <button
            onClick={onClose}
            className="grid h-7 w-7 place-items-center rounded-lg border border-white/10 text-ash transition-colors hover:text-fog hover:bg-white/[0.06] cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6">{children}</div>
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
    <div className={cn("inline-flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]", className)}>
      {items.map((it) => {
        const isCurrent = active === it.key;
        return (
          <button
            key={it.key}
            onClick={() => onChange(it.key)}
            className={cn(
              "relative rounded-lg px-3.5 py-1.5 text-[12.5px] font-semibold transition-all cursor-pointer flex items-center gap-1.5",
              isCurrent
                ? "bg-gradient-to-r from-gold/15 to-gold/5 text-gold border border-gold/30 shadow-[0_0_12px_rgba(243,211,140,0.15)] font-bold"
                : "text-ash hover:text-fog hover:bg-white/[0.04]"
            )}
          >
            {it.label}
            {typeof it.count === "number" && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.2 fnum text-[10px] font-bold",
                  isCurrent ? "bg-gold/20 text-gold" : "bg-white/[0.06] text-dim"
                )}
              >
                {it.count}
              </span>
            )}
          </button>
        );
      })}
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
    <div
      className={cn(
        "group relative rounded-2xl border border-white/[0.08] bg-[#0c101a]/80 p-5 backdrop-blur-xl shadow-[0_12px_32px_-15px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-white/[0.16] hover:translate-y-[-2px] overflow-hidden",
        "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11.5px] font-semibold text-ash">{label}</span>
        {icon && (
          <div className="grid h-8 w-8 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-gold shadow-sm transition-transform duration-300 group-hover:scale-110">
            {icon}
          </div>
        )}
      </div>
      <div className="fnum mt-3 text-[26px] font-extrabold tracking-tight" style={{ color: accent ?? "#f8fafc" }}>
        {value}
      </div>
      {hint && (
        <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-dim">
          <span className="h-1 w-1 rounded-full bg-slate-500" />
          <span>{hint}</span>
        </div>
      )}
    </div>
  );
}

/* ------------------------------- ai typing --------------------------------- */

export function ThinkingDots() {
  return (
    <span className="inline-flex items-center gap-1.5 py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-2 w-2 rounded-full bg-gradient-to-r from-gold to-goldsoft shadow-[0_0_8px_rgba(243,211,140,0.6)] animate-pulse"
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
