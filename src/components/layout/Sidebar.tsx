"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Box,
  LayoutDashboard,
  Wallet,
  TrendingDown,
  Target,
  LineChart,
  Handshake,
  UserCircle2,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Users,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const links = [
  { name: "Overview", href: "/overview", icon: LayoutDashboard },
  { name: "Assets", href: "/assets", icon: Box },
  { name: "Income", href: "/income", icon: Wallet },
  { name: "Expenses", href: "/expenses", icon: TrendingDown },
  { name: "Targets", href: "/targets", icon: Target },
  { name: "Collaboration", href: "/collaboration", icon: Handshake },
  { name: "Profile", href: "/profile", icon: UserCircle2 },
  { name: "Simulation", href: "/simulation", icon: LineChart },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar({
  summary,
}: {
  summary: {
    email: string;
    displayName: string;
    profilePhotoUrl: string | null;
    friendsCount: number;
    pendingIncomingCount: number;
  };
}) {
  const pathname = usePathname();
  const transitionTimer = useRef<number | null>(null);
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("chronos-sidebar-collapsed") === "1";
  });

  useEffect(() => {
    document.documentElement.dataset.sidebarState = collapsed ? "collapsed" : "expanded";
  }, [collapsed]);

  useEffect(() => {
    return () => {
      if (transitionTimer.current) {
        window.clearTimeout(transitionTimer.current);
      }
    };
  }, []);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    window.localStorage.setItem("chronos-sidebar-collapsed", next ? "1" : "0");
    document.documentElement.dataset.sidebarTransition = "active";
    if (transitionTimer.current) {
      window.clearTimeout(transitionTimer.current);
    }
    transitionTimer.current = window.setTimeout(() => {
      delete document.documentElement.dataset.sidebarTransition;
    }, 320);
  };

  return (
    <aside className={cn(
      "h-screen max-w-xs flex-col hidden md:flex backdrop-blur-xl bg-sidebar/70 border-r border-sidebar-border/85 shadow-[14px_0_40px_-30px_rgba(93,102,186,0.65)] isolate transition-all duration-300",
      collapsed ? "w-20" : "w-64",
    )}>
      <div className={cn("flex h-16 items-center border-b border-sidebar-border/70", collapsed ? "px-3 justify-center" : "px-4 justify-between")}>
        <span className={cn(
          "font-bold tracking-tight bg-linear-to-br from-[#7981e0] to-[#9ca1f2] bg-clip-text text-transparent transition-all",
          collapsed ? "text-lg" : "text-2xl",
        )}>
          {collapsed ? "CW" : "Chronos Wealth"}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={toggleCollapsed}
          className="rounded-xl"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </Button>
      </div>

      <div className={cn("border-b border-sidebar-border/70", collapsed ? "px-2 py-3" : "px-4 py-4")}>
        <Link
          href="/profile"
          className={cn(
            "flex items-center rounded-2xl border border-white/60 bg-white/55 shadow-[0_10px_20px_-16px_rgba(93,102,186,0.95)] backdrop-blur-md transition-all hover:bg-white/75 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10",
            collapsed ? "justify-center p-2" : "gap-3 p-3",
          )}
          title={collapsed ? summary.displayName : undefined}
        >
          {summary.profilePhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={summary.profilePhotoUrl}
              alt={summary.displayName}
              className="h-9 w-9 shrink-0 rounded-xl object-cover"
            />
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-[#7981e0] to-[#9ca1f2] text-sm font-bold text-white">
              {(summary.displayName.trim().charAt(0) || "U").toUpperCase()}
            </div>
          )}

          {!collapsed ? (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-700 dark:text-slate-100">{summary.displayName}</p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">{summary.email}</p>
            </div>
          ) : null}
        </Link>

        {!collapsed ? (
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl border border-white/60 bg-white/55 px-2 py-2 text-slate-600 shadow-[0_8px_20px_-18px_rgba(93,102,186,0.95)] dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
              <p className="mb-1 flex items-center gap-1 text-[10px] uppercase tracking-wider">
                <Users className="h-3 w-3" /> Friends
              </p>
              <p className="text-sm font-semibold">{summary.friendsCount}</p>
            </div>
            <div className="rounded-xl border border-white/60 bg-white/55 px-2 py-2 text-slate-600 shadow-[0_8px_20px_-18px_rgba(93,102,186,0.95)] dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
              <p className="mb-1 flex items-center gap-1 text-[10px] uppercase tracking-wider">
                <Mail className="h-3 w-3" /> Pending
              </p>
              <p className="text-sm font-semibold">{summary.pendingIncomingCount}</p>
            </div>
          </div>
        ) : null}
      </div>

      <div className={cn("flex-1 py-6 space-y-2", collapsed ? "px-2" : "px-4")}>
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname.startsWith(link.href);

          return (
            <Link
              key={link.name}
              href={link.href}
              title={collapsed ? link.name : undefined}
              className={cn(
                "flex items-center rounded-2xl transition-all duration-300",
                collapsed ? "justify-center px-2 py-3" : "gap-3 px-4 py-3",
                isActive
                  ? "bg-white/75 text-primary font-semibold shadow-[0_12px_24px_-18px_rgba(101,109,193,0.9)] ring-1 ring-white/60 dark:bg-white/10"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/85 hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed ? link.name : null}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
