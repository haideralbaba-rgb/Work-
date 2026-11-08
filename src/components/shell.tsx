"use client";

import type { Notification } from "@/db/schema";
import { markNotificationsRead } from "@/actions/strategist";
import { signOut } from "@/actions/auth";
import { cn, timeAgoAr } from "@/lib/utils";
import { CommandPalette, FloatingActionPod } from "@/components/motion-ui";
import {
  BarChart3,
  Bell,
  BrainCircuit,
  Clapperboard,
  Crosshair,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  PanelRightClose,
  PanelRightOpen,
  Settings,
  Sparkles,
  Tags,
  Users,
  Wallet,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

const NAV = [
  { href: "/dashboard", ar: "مركز القيادة", en: "COMMAND CENTER", icon: LayoutDashboard },
  { href: "/roadmap", ar: "خارطة الطريق", en: "ROADMAP", icon: Map },
  { href: "/mission", ar: "مهمة اليوم", en: "TODAY'S MISSION", icon: Crosshair },
  { href: "/strategist", ar: "المستشار الذكي", en: "AI STRATEGIST", icon: BrainCircuit },
  { href: "/clients", ar: "اكتساب العملاء", en: "CLIENT ACQUISITION", icon: Users },
  { href: "/studio", ar: "ستوديو المحتوى", en: "CONTENT STUDIO", icon: Clapperboard },
  { href: "/services", ar: "الخدمات والأسعار", en: "SERVICES & PRICING", icon: Tags },
  { href: "/revenue", ar: "متتبع الإيرادات", en: "REVENUE TRACKER", icon: Wallet },
  { href: "/performance", ar: "المراجعة الأدائية", en: "PERFORMANCE REVIEW", icon: BarChart3 },
  { href: "/settings", ar: "الإعدادات", en: "SETTINGS", icon: Settings },
];

const MOBILE_MAIN = ["/dashboard", "/mission", "/clients", "/studio", "/revenue"];

function Wordmark({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
      <div className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-gold/40 bg-gradient-to-br from-gold/20 via-gold/10 to-transparent shadow-[0_0_20px_rgba(243,211,140,0.25)]">
        <span className="fnum text-[13px] font-black text-gold">IO</span>
        <span className="absolute -top-1 -end-1 h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
      </div>
      {!collapsed && (
        <div className="leading-tight">
          <div className="fnum text-[13px] font-black tracking-[0.16em] text-fog bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            INDEPENDENT
          </div>
          <div className="fnum text-[9.5px] font-extrabold tracking-[0.38em] text-gold flex items-center gap-1">
            <span>OS</span>
            <span className="text-[8px] text-dim tracking-normal font-medium">v2.0</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Shell({
  userName,
  businessName,
  notifications,
  children,
}: {
  userName: string;
  businessName: string;
  notifications: Notification[];
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("ios_sidebar_collapsed");
    if (saved === "1") setCollapsed(true);
  }, []);

  useEffect(() => setBellOpen(false), [pathname]);

  const toggleCollapse = () => {
    setCollapsed((v) => {
      localStorage.setItem("ios_sidebar_collapsed", v ? "0" : "1");
      return !v;
    });
  };

  const current = NAV.find((n) => pathname.startsWith(n.href));
  const unread = notifications.filter((x) => !x.read).length;

  const navList = (mini: boolean) => (
    <nav className="flex flex-col gap-1 px-2.5">
      {NAV.map((item) => {
        const active = pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] transition-all duration-200",
              active
                ? "bg-gradient-to-r from-gold/15 via-gold/5 to-transparent text-gold border border-gold/30 shadow-[0_0_15px_rgba(243,211,140,0.12)] font-bold"
                : "text-slate-400 hover:bg-white/[0.04] hover:text-white border border-transparent",
              mini && "justify-center px-0 h-10 w-10 mx-auto"
            )}
            title={mini ? item.ar : undefined}
          >
            {active && (
              <span className="absolute start-0 top-2 bottom-2 w-1 rounded-r-full bg-gold shadow-[0_0_8px_#f3d38c]" />
            )}
            <Icon
              className={cn(
                "h-[18px] w-[18px] shrink-0 transition-transform duration-200 group-hover:scale-110",
                active ? "text-gold" : "text-slate-400 group-hover:text-slate-200"
              )}
            />
            {!mini && (
              <span className="flex-1 truncate">{item.ar}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  const bell = (
    <div className="relative">
      <button
        onClick={() => setBellOpen((v) => !v)}
        className="relative grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-ash transition-all hover:text-fog hover:bg-white/[0.07] hover:border-white/20 cursor-pointer"
        aria-label="الإشعارات"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="fnum absolute -top-1 -end-1 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-gradient-to-r from-gold to-goldsoft px-1 text-[9.5px] font-black text-[#06070a] shadow-[0_0_10px_rgba(243,211,140,0.6)]">
            {unread}
          </span>
        )}
      </button>
      {bellOpen && (
        <div className="absolute end-0 top-12 z-50 w-84 rounded-2xl border border-white/15 bg-[#0a0d16]/95 backdrop-blur-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] fadein overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3 bg-white/[0.02]">
            <span className="text-xs font-bold text-fog flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-gold" />
              مركز الإشعارات
            </span>
            {unread > 0 && (
              <button
                className="text-[10.5px] font-semibold text-gold hover:text-goldsoft cursor-pointer transition-colors"
                onClick={async () => {
                  await markNotificationsRead();
                  router.refresh();
                }}
              >
                تعليم الكل كمقروء
              </button>
            )}
          </div>
          <div className="max-h-84 overflow-y-auto divide-y divide-white/[0.05]">
            {notifications.length === 0 && (
              <div className="px-5 py-8 text-center text-xs text-dim">
                لا توجد إشعارات حالياً. التنبيهات الذكية ستظهر هنا.
              </div>
            )}
            {notifications.slice(0, 15).map((notif) => (
              <div
                key={notif.id}
                className={cn("px-4 py-3.5 transition-colors hover:bg-white/[0.02]", !notif.read && "bg-gold/[0.05]")}
              >
                <div className="flex items-center gap-2">
                  {!notif.read && <span className="h-2 w-2 rounded-full bg-gold shadow-[0_0_8px_#f3d38c]" />}
                  <span className="text-[12px] font-bold text-fog">{notif.title}</span>
                  <span className="ms-auto text-[10px] text-dim">{timeAgoAr(notif.createdAt)}</span>
                </div>
                {notif.body && <div className="mt-1 text-[11px] leading-5 text-ash">{notif.body}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="vignette flex min-h-screen text-fog">
      {/* desktop sidebar */}
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col border-e border-white/[0.07] bg-[#07090f]/90 backdrop-blur-2xl transition-[width] duration-300 lg:flex z-30",
          collapsed ? "w-[72px]" : "w-[245px]"
        )}
      >
        <div className={cn("flex items-center border-b border-white/[0.07] px-5 py-4.5", collapsed && "justify-center px-2")}>
          <Wordmark collapsed={collapsed} />
        </div>
        <div className="flex-1 overflow-y-auto py-3.5">{navList(collapsed)}</div>
        <div className="border-t border-white/[0.07] p-3">
          {!collapsed && (
            <div className="mb-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] animate-pulse" />
                <span className="truncate text-[11.5px] font-bold text-fog">{businessName || userName}</span>
              </div>
              <div className="mt-1 text-[10px] text-dim flex items-center justify-between">
                <span>رائد أعمال حر</span>
                <span className="text-gold font-semibold">متصل</span>
              </div>
            </div>
          )}
          <div className={cn("flex items-center gap-1.5", collapsed && "flex-col")}>
            <button
              onClick={toggleCollapse}
              className="grid h-9 flex-1 place-items-center rounded-xl border border-white/5 text-dim transition-all hover:bg-white/[0.06] hover:text-fog cursor-pointer"
              aria-label="طي القائمة"
              title={collapsed ? "توسيع" : "طي"}
            >
              {collapsed ? <PanelRightOpen className="h-4 w-4" /> : <PanelRightClose className="h-4 w-4" />}
            </button>
            <button
              onClick={async () => {
                await signOut();
                router.push("/login");
              }}
              className="grid h-9 w-9 place-items-center rounded-xl border border-white/5 text-dim transition-all hover:bg-brick/10 hover:border-brick/30 hover:text-brick cursor-pointer"
              aria-label="تسجيل الخروج"
              title="تسجيل الخروج"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* main content column */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* top bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-white/[0.07] bg-[#07090f]/80 px-4 md:px-8 backdrop-blur-2xl">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-ash hover:text-fog lg:hidden cursor-pointer"
              aria-label="فتح القائمة"
            >
              <Menu className="h-4 w-4" />
            </button>
            {current && (
              <div className="flex items-center gap-2">
                <span className="text-dim hidden sm:inline text-xs">نظام التشغيل /</span>
                <span className="font-ar text-sm md:text-base font-extrabold text-fog flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                  {current.ar}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <CommandPalette />
            {bell}
          </div>
        </header>

        {/* page container */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto pb-24 lg:pb-12">
          {children}
        </main>
      </div>

      {/* mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-black/80 backdrop-blur-md fadein"
            onClick={() => setMobileOpen(false)}
            aria-label="إغلاق القائمة"
          />
          <div className="absolute inset-y-0 start-0 w-72 border-e border-white/10 bg-[#07090f]/95 backdrop-blur-2xl p-4 shadow-2xl slidein-r flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <Wordmark collapsed={false} />
                <button
                  onClick={() => setMobileOpen(false)}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-ash hover:text-fog cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="py-4">{navList(false)}</div>
            </div>
            <div className="pt-4 border-t border-white/10">
              <button
                onClick={async () => {
                  await signOut();
                  router.push("/login");
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-brick/30 bg-brick/10 py-2.5 text-xs font-bold text-brick cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                تسجيل الخروج
              </button>
            </div>
          </div>
        </div>
      )}

      {/* mobile bottom dock */}
      <nav className="fixed inset-x-4 bottom-4 z-40 flex items-center justify-around rounded-2xl border border-white/15 bg-[#0a0d16]/90 p-2 backdrop-blur-2xl shadow-[0_15px_35px_rgba(0,0,0,0.7)] lg:hidden">
        {MOBILE_MAIN.map((href) => {
          const item = NAV.find((n) => n.href === href);
          if (!item) return null;
          const active = pathname.startsWith(href);
          const Icon = item.icon;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl p-2 text-[10px] font-bold transition-all",
                active
                  ? "bg-gradient-to-r from-gold/20 to-gold/5 text-gold border border-gold/30 shadow-[0_0_12px_rgba(243,211,140,0.2)]"
                  : "text-slate-400 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.ar.split(" ")[0]}</span>
            </Link>
          );
        })}
      </nav>

      {/* floating action trigger for mission */}
      <FloatingActionPod />
    </div>
  );
}
