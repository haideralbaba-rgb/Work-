"use client";

import { cn } from "@/lib/utils";
import { Command } from "cmdk";
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "motion/react";
import {
  BrainCircuit,
  Clapperboard,
  Crosshair,
  LayoutDashboard,
  Map,
  Search,
  Settings,
  Sparkles,
  Tags,
  Users,
  Wallet,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";

/* -------------------------------------------------------------------------- */
/* 1. SPOTLIGHT CARD (Specular cursor-tracking glow & luxury glass)            */
/* -------------------------------------------------------------------------- */

export function SpotlightCard({
  children,
  className,
  glowColor = "rgba(243, 211, 140, 0.16)",
}: {
  children: ReactNode;
  className?: string;
  glowColor?: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(-1000);
  const mouseY = useMotionValue(-1000);

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  }

  function handleMouseLeave() {
    mouseX.set(-1000);
    mouseY.set(-1000);
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c101a]/85 backdrop-blur-xl transition-all duration-300 hover:border-white/[0.18] shadow-[0_12px_40px_-15px_rgba(0,0,0,0.6)]",
        "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
        className
      )}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: useTransform(
            [mouseX, mouseY],
            ([x, y]) =>
              `radial-gradient(500px circle at ${x}px ${y}px, ${glowColor}, transparent 80%)`
          ),
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 2. DYNAMIC BENTO GRID WRAPPER                                              */
/* -------------------------------------------------------------------------- */

export function BentoGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5", className)}>
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 3. SPRING NUMBER TICKER (Linear-style animated metric counter)            */
/* -------------------------------------------------------------------------- */

export function NumberTicker({
  value,
  prefix = "",
  suffix = "",
  className,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const spring = useSpring(0, { mass: 0.8, stiffness: 85, damping: 15 });
  const display = useTransform(spring, (current) =>
    `${prefix}${Math.round(current).toLocaleString()}${suffix}`
  );

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span className={cn("fnum tabular-nums", className)}>{display}</motion.span>;
}

/* -------------------------------------------------------------------------- */
/* 4. MORPHING SEGMENTED TABS                                                 */
/* -------------------------------------------------------------------------- */

interface TabItem {
  id: string;
  label: string;
  badge?: number | string;
}

export function MorphingTabs({
  tabs,
  activeId,
  onChange,
  className,
}: {
  tabs: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("inline-flex items-center gap-1.5 rounded-xl bg-white/[0.03] p-1 border border-white/[0.06]", className)}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all select-none cursor-pointer flex items-center gap-1.5",
              isActive ? "text-gold font-bold" : "text-ash hover:text-fog hover:bg-white/[0.04]"
            )}
          >
            {isActive && (
              <motion.div
                layoutId="activeTabPill"
                className="absolute inset-0 rounded-lg bg-gradient-to-r from-gold/15 to-gold/5 border border-gold/30 shadow-[0_0_12px_rgba(243,211,140,0.15)]"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {tab.label}
              {tab.badge !== undefined && (
                <span className="rounded-full bg-gold/20 px-1.5 py-0.2 text-[10px] text-gold font-bold fnum">
                  {tab.badge}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 5. TACTILE SPRING BUTTON                                                  */
/* -------------------------------------------------------------------------- */

export function TactileButton({
  children,
  onClick,
  variant = "primary",
  size = "md",
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const variants = {
    primary:
      "bg-gradient-to-r from-[#d8b05c] via-[#f5d996] to-[#c89b42] text-[#06070a] shadow-[0_4px_20px_rgba(243,211,140,0.35)] hover:shadow-[0_4px_28px_rgba(243,211,140,0.55)] border border-white/30 font-bold",
    ghost: "text-ash hover:text-fog hover:bg-white/[0.06] border border-transparent font-medium",
    outline: "text-fog border border-white/[0.12] hover:border-gold/60 hover:text-gold bg-white/[0.03] hover:bg-gold/[0.06] backdrop-blur-sm font-medium",
  };
  const sizes = {
    sm: "text-xs px-3 h-8 gap-1.5",
    md: "text-[13px] px-4 h-9.5 gap-2",
    lg: "text-sm px-6 h-11 gap-2.5 font-bold",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 500, damping: 25 }}
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center rounded-xl cursor-pointer select-none transition-all",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </motion.button>
  );
}

/* -------------------------------------------------------------------------- */
/* 6. COMMAND PALETTE (Cmd+K / Ctrl+K Quick Action & Navigation Runner)        */
/* -------------------------------------------------------------------------- */

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function run(fn: () => void) {
    setOpen(false);
    fn();
  }

  const navItems = [
    { href: "/dashboard", label: "مركز القيادة", en: "Command Center", icon: LayoutDashboard },
    { href: "/mission", label: "مهمة اليوم", en: "Today's Mission", icon: Crosshair },
    { href: "/strategist", label: "المستشار الذكي", en: "AI Strategist", icon: BrainCircuit },
    { href: "/clients", label: "اكتساب العملاء", en: "Client Acquisition", icon: Users },
    { href: "/studio", label: "ستوديو المحتوى", en: "Content Studio", icon: Clapperboard },
    { href: "/revenue", label: "متتبع الإيرادات", en: "Revenue Tracker", icon: Wallet },
    { href: "/roadmap", label: "خارطة الطريق", en: "Roadmap", icon: Map },
    { href: "/services", label: "الخدمات والأسعار", en: "Services & Pricing", icon: Tags },
    { href: "/settings", label: "الإعدادات", en: "Settings", icon: Settings },
  ];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden sm:inline-flex items-center gap-2.5 h-9 px-3 text-xs text-slate-300 bg-white/[0.03] border border-white/10 hover:border-gold/40 hover:bg-white/[0.06] transition-all rounded-full cursor-pointer shadow-sm"
      >
        <Search className="w-3.5 h-3.5 text-gold" />
        <span>بحث سريع / تنقل...</span>
        <kbd className="text-[10px] text-slate-400 bg-white/[0.06] px-1.5 py-0.5 rounded-md border border-white/10 font-mono">
          ⌘K
        </kbd>
      </button>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -10 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="w-full max-w-xl overflow-hidden rounded-2xl border border-white/15 bg-[#0a0d16]/95 backdrop-blur-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)]"
            >
              <Command className="bg-transparent text-fog">
                <div className="flex items-center border-b border-white/[0.08] px-4 py-1">
                  <Search className="mr-2.5 h-4 w-4 shrink-0 text-gold" />
                  <Command.Input
                    placeholder="ابحث عن صفحة، عميل، أو أمر..."
                    className="flex h-12 w-full bg-transparent text-sm placeholder:text-dim outline-none text-fog"
                  />
                  <kbd
                    onClick={() => setOpen(false)}
                    className="cursor-pointer text-[10.5px] text-dim hover:text-fog bg-white/[0.06] px-2 py-0.5 rounded-md border border-white/10 font-mono"
                  >
                    ESC
                  </kbd>
                </div>

                <Command.List className="max-h-80 overflow-y-auto p-2.5">
                  <Command.Empty className="py-8 text-center text-xs text-dim">
                    لم يتم العثور على نتائج.
                  </Command.Empty>

                  <Command.Group
                    heading={
                      <div className="flex items-center gap-1.5 text-[10.5px] font-mono text-gold px-2.5 py-1.5">
                        <Sparkles className="h-3 w-3" />
                        <span>التنقل السريع في النظام</span>
                      </div>
                    }
                  >
                    {navItems.map((item) => (
                      <Command.Item
                        key={item.href}
                        onSelect={() => run(() => router.push(item.href))}
                        className="flex items-center justify-between gap-2 px-3 py-2.5 text-xs rounded-xl cursor-pointer text-fog hover:bg-gold/10 hover:text-gold transition-colors aria-selected:bg-gold/15 aria-selected:text-gold"
                      >
                        <div className="flex items-center gap-3">
                          <div className="grid h-7 w-7 place-items-center rounded-lg border border-white/10 bg-white/[0.03]">
                            <item.icon className="h-3.5 w-3.5" />
                          </div>
                          <span className="font-semibold">{item.label}</span>
                        </div>
                        <span className="text-[10px] font-mono text-dim">{item.en}</span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                </Command.List>
              </Command>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* 7. FLOATING EXECUTIVE POD (Glass Action Dock)                               */
/* -------------------------------------------------------------------------- */

export function FloatingActionPod({
  primaryActionLabel = "مهمة اليوم",
  onPrimaryAction,
}: {
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
}) {
  const router = useRouter();
  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 350, damping: 28 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 hidden md:flex items-center gap-3.5 px-4 py-2 rounded-full border border-white/15 bg-[#0a0d16]/90 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
    >
      <div className="flex items-center gap-2.5 text-xs text-ash border-e border-white/10 pe-3.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 shadow-[0_0_8px_#34d399]" />
        </span>
        <span className="font-mono text-[10.5px] font-bold text-fog tracking-wider">ONLINE</span>
      </div>

      <CommandPalette />

      <TactileButton
        size="sm"
        variant="primary"
        onClick={() => {
          if (onPrimaryAction) onPrimaryAction();
          else router.push("/mission");
        }}
      >
        <Crosshair className="w-3.5 h-3.5" />
        <span>{primaryActionLabel}</span>
      </TactileButton>
    </motion.div>
  );
}
