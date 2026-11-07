"use client";

import type { Notification } from "@/db/schema";
import { markNotificationsRead } from "@/actions/strategist";
import { signOut } from "@/actions/auth";
import { cn, timeAgoAr } from "@/lib/utils";
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
    <div className={cn("flex items-center gap-2.5", collapsed && "justify-center")}>
      <div className="grid h-8 w-8 shrink-0 place-items-center border border-gold/50 bg-gold/10">
        <span className="fnum text-[13px] font-black text-gold">IO</span>
      </div>
      {!collapsed && (
        <div className="leading-none">
          <div className="fnum text-[13px] font-extrabold tracking-[0.18em] text-fog">INDEPENDENT</div>
          <div className="fnum mt-1 text-[9px] font-semibold tracking-[0.42em] text-gold">OS</div>
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
    <nav className="flex flex-col gap-0.5 px-2">
      {NAV.map((item) => {
        const active = pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "group relative flex items-center gap-3 px-3 py-2.5 text-[13px] transition-all duration-200",
              active ? "bg-panel text-gold" : "text-ash hover:bg-panel/60 hover:text-fog",
              mini && "justify-center px-0"
            )}
            title={mini ? item.ar : undefined}
          >
            {active && <span className="absolute start-0 top-1.5 bottom-1.5 w-[2px] bg-gold" />}
            <Icon className={cn("h-[17px] w-[17px] shrink-0", active ? "text-gold" : "text-dim group-hover:text-ash")} />
            {!mini && (
              <span className="flex-1 truncate font-semibold">{item.ar}</span>
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
        className="relative grid h-9 w-9 place-items-center border border-line bg-panel text-ash transition-colors hover:text-fog cursor-pointer"
        aria-label="الإشعارات"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="fnum absolute -top-1.5 -end-1.5 grid h-4 min-w-4 place-items-center bg-gold px-1 text-[9px] font-bold text-[#171307]">
            {unread}
          </span>
        )}
      </button>
      {bellOpen && (
        <div className="absolute end-0 top-11 z-40 w-80 border border-line2 bg-panel shadow-2xl fadein">
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
            <span className="text-xs font-bold text-fog">الإشعارات</span>
            {unread > 0 && (
              <button
                className="text-[10px] text-gold hover:text-goldsoft cursor-pointer"
                onClick={async () => {
                  await markNotificationsRead();
                  router.refresh();
                }}
              >
                تعليم الكل كمقروء
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 && (
              <div className="px-4 py-8 text-center text-[11px] text-dim">لا إشعارات بعد. ستصلك التنبيهات المهمة هنا.</div>
            )}
            {notifications.slice(0, 15).map((notif) => (
              <div
                key={notif.id}
                className={cn("border-b border-line/60 px-4 py-3", !notif.read && "bg-gold/[0.04]")}
              >
                <div className="flex items-center gap-2">
                  {!notif.read && <span className="h-1.5 w-1.5 rounded-full bg-gold" />}
                  <span className="text-[11.5px] font-bold text-fog">{notif.title}</span>
                  <span className="ms-auto text-[9.5px] text-dim">{timeAgoAr(notif.createdAt)}</span>
                </div>
                {notif.body && <div className="mt-1 text-[10.5px] leading-4 text-ash">{notif.body}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="vignette flex min-h-screen">
      {/* desktop sidebar */}
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col border-e border-line bg-coal/80 backdrop-blur transition-[width] duration-300 lg:flex",
          collapsed ? "w-[64px]" : "w-[232px]"
        )}
      >
        <div className={cn("flex items-center border-b border-line px-4 py-4", collapsed && "justify-center px-2")}>
          <Wordmark collapsed={collapsed} />
        </div>
        <div className="flex-1 overflow-y-auto py-3">{navList(collapsed)}</div>
        <div className="border-t border-line p-2">
          {!collapsed && (
            <div className="mb-2 px-3 py-2">
              <div className="truncate text-[11px] font-bold text-fog">{businessName || userName}</div>
              <div className="mt-0.5 text-[9.5px] tracking-wide text-dim">stop planning. start building.</div>
            </div>
          )}
          <div className={cn("flex items-center gap-1", collapsed && "flex-col")}>
            <button
              onClick={toggleCollapse}
              className="grid h-8 flex-1 place-items-center border border-transparent text-dim transition-colors hover:bg-panel hover:text-fog cursor-pointer"
              aria-label="طي القائمة"
            >
              {collapsed ? <PanelRightOpen className="h-4 w-4" /> : <PanelRightClose className="h-4 w-4" />}
            </button>
            <form
              action={async () => {
                await signOut();
                router.push("/login");
              }}
              className={cn(collapsed ? "w-full" : "")}
            >
              <button
                type="submit"
                className="grid h-8 w-full place-items-center border border-transparent px-2 text-dim transition-colors hover:bg-panel hover:text-brick cursor-pointer"
                aria-label="تسجيل الخروج"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-black/70" onClick={() => setMobileOpen(false)} aria-label="اغلاق" />
          <div className="absolute start-0 top-0 h-full w-72 border-e border-line bg-coal shadow-2xl slidein-r flex flex-col">
            <div className="flex items-center justify-between border-b border-line px-4 py-4">
              <Wordmark collapsed={false} />
              <button onClick={() => setMobileOpen(false)} className="text-ash cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-3">{navList(false)}</div>
          </div>
        </div>
      )}

      {/* main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-ink/85 px-4 backdrop-blur-md md:px-7">
          <button
            className="grid h-9 w-9 place-items-center border border-line bg-panel text-ash lg:hidden cursor-pointer"
            onClick={() => setMobileOpen(true)}
            aria-label="القائمة"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <div className="fnum text-[8.5px] font-bold tracking-[0.3em] text-gold/80">{current?.en ?? "INDEPENDENT OS"}</div>
            <div className="truncate text-[13px] font-bold text-fog">{current?.ar ?? "مركز القيادة"}</div>
          </div>
          <div className="ms-auto flex items-center gap-2">
            {bell}
            <div className="hidden items-center gap-2 border border-line bg-panel px-3 py-1.5 sm:flex">
              <span className="grid h-6 w-6 place-items-center bg-gold/15 text-[10px] font-black text-gold">
                {(userName || "؟").slice(0, 1)}
              </span>
              <span className="max-w-28 truncate text-[11px] font-semibold text-fog">{businessName || userName}</span>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 pb-24 pt-6 md:px-7 md:pt-8 lg:pb-10">{children}</main>

        {/* mobile bottom nav */}
        <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-line bg-coal/95 px-2 py-2 backdrop-blur lg:hidden">
          {MOBILE_MAIN.map((href) => {
            const item = NAV.find((x) => x.href === href)!;
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link key={href} href={href} className={cn("flex flex-col items-center gap-1 px-2 py-1", active ? "text-gold" : "text-dim")}>
                <Icon className="h-[18px] w-[18px]" />
                <span className="text-[8.5px] font-semibold">{item.ar}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setMobileOpen(true)}
            className={cn("flex flex-col items-center gap-1 px-2 py-1", mobileOpen ? "text-gold" : "text-dim")}
          >
            <Menu className="h-[18px] w-[18px]" />
            <span className="text-[8.5px] font-semibold">المزيد</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
