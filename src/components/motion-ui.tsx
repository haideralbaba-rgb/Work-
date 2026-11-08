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
/* 1. SPOTLIGHT CARD (60fps.design cursor-tracking specular glow)              */
/* -------------------------------------------------------------------------- */

export function SpotlightCard({
  children,
  className,
  glowColor = "rgba(199, 165, 106, 0.14)",
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
        "group relative overflow-hidden rounded-sm border border-line bg-panel transition-colors duration-300 hover:border-line2",
        className
      )}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: useTransform(
            [mouseX, mouseY],
            ([x, y]) =>
              `radial-gradient(450px circle at ${x}px ${y}px, ${glowColor}, transparent 80%)`
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
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", className)}>
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
    <div className={cn("inline-flex items-center gap-1 rounded-sm bg-ink/60 p-1 border border-line", className)}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative px-3.5 py-1.5 text-xs font-medium transition-colors select-none cursor-pointer",
              isActive ? "text-fog" : "text-ash hover:text-fog"
            )}
          >
            {isActive && (
              <motion.div
                layoutId="activeTabPill"
                className="absolute inset-0 rounded-[2px] bg-panel border border-gold/30 shadow-[0_0_12px_rgba(199,165,106,0.12)]"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {tab.label}
              {tab.badge !== undefined && (
                <span className="rounded-full bg-gold/15 px-1.5 py-0.2 text-[10px] text-gold font-mono">
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
      "bg-gold text-[#171307] hover:bg-goldsoft border border-gold shadow-[0_0_20px_-5px_rgba(199,165,106,0.4)] font-semibold",
    ghost: "text-ash hover:text-fog hover:bg-panel border border-transparent",
    outline: "text-fog border border-line hover:border-gold/60 hover:text-gold bg-panel/40",
  };
  const sizes = {
    sm: "text-xs px-3 h-8",
    md: "text-[13px] px-4 h-9.5",
    lg: "text-sm px-6 h-11",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 500, damping: 25 }}
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-sm cursor-pointer select-none transition-colors",
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
        className="hidden sm:inline-flex items-center gap-2.5 h-8 px-2.5 text-xs text-ash bg-coal border border-line hover:border-gold/40 hover:text-fog transition-colors rounded-sm cursor-pointer"
      >
        <Search className="w-3.5 h-3.5 text-dim" />
        <span>بحث سريع / تنقل...</span>
        <kbd className="text-[10px] text-dim bg-panel px-1.5 py-0.5 rounded border border-line font-mono">
          ⌘K
        </kbd>
      </button>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 bg-ink/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -8 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="w-full max-w-xl overflow-hidden rounded-md border border-line bg-panel shadow-[0_16px_48px_rgba(0,0,0,0.8)]"
            >
              <Command className="bg-transparent text-fog">
                <div className="flex items-center border-b border-line px-3.5">
                  <Search className="mr-2 h-4 w-4 shrink-0 text-ash" />
                  <Command.Input
                    placeholder="ابحث عن صفحة، عميل، أو أمر..."
                    className="flex h-11 w-full bg-transparent text-sm placeholder:text-dim outline-none text-fog"
                  />
                  <kbd
                    onClick={() => setOpen(false)}
                    className="cursor-pointer text-[10px] text-dim hover:text-fog bg-coal px-1.5 py-0.5 rounded border border-line font-mono"
                  >
                    ESC
                  </kbd>
                </div>

                <Command.List className="max-h-72 overflow-y-auto p-2">
                  <Command.Empty className="py-6 text-center text-xs text-dim">
                    لم يتم العثور على نتائج.
                  </Command.Empty>

                  <Command.Group heading={<span className="text-[10px] font-mono text-gold px-2">التنقل السريع</span>}>
                    {navItems.map((item) => (
                      <Command.Item
                        key={item.href}
                        onSelect={() => run(() => router.push(item.href))}
                        className="flex items-center justify-between gap-2 px-2.5 py-2 text-xs rounded-sm cursor-pointer text-fog hover:bg-gold/10 hover:text-gold transition-colors aria-selected:bg-gold/15 aria-selected:text-gold"
                      >
                        <div className="flex items-center gap-2.5">
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
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
/* 7. FLOATING EXECUTIVE POD (Subtle Glass Action Dock)                        */
/* -------------------------------------------------------------------------- */

export function FloatingActionPod({
  primaryActionLabel = "مهمة اليوم",
  onPrimaryAction,
}: {
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
}) {
  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 350, damping: 28 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 hidden md:flex items-center gap-3 px-4 py-2 rounded-full border border-line/80 bg-coal/85 backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.6)]"
    >
      <div className="flex items-center gap-2 text-xs text-ash border-r border-line pr-3">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sage opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-sage" />
        </span>
        <span className="font-mono text-[11px] text-fog">ACTIVE SESSION</span>
      </div>

      <CommandPalette />

      <TactileButton size="sm" variant="primary" onClick={onPrimaryAction}>
        <Crosshair className="w-3.5 h-3.5" />
        <span>{primaryActionLabel}</span>
      </TactileButton>
    </motion.div>
  );
}
