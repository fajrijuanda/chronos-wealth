"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/actions/auth";
import { getSidebarSections, type SidebarGroupItem, type SidebarLeaf } from "./sidebar-config";
import { SidebarLogoutButton } from "./SidebarLogoutButton";

function hrefToTab(href: string) {
  const query = href.split("?")[1];
  if (!query) return null;
  return new URLSearchParams(query).get("tab");
}

function useIsHrefActive() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab");

  return (href: string) => {
    const [base] = href.split("?");
    const isPathMatch = pathname === base || pathname.startsWith(`${base}/`);
    if (!isPathMatch) return false;

    const tab = hrefToTab(href);
    if (!tab) return true;
    return activeTab === tab;
  };
}

function hasActiveChild(item: SidebarGroupItem, isActive: (href: string) => boolean) {
  return Boolean(item.children?.some((child) => isActive(child.href)));
}

function isParentActive(item: SidebarGroupItem, isActive: (href: string) => boolean) {
  return (item.href ? isActive(item.href) : false) || hasActiveChild(item, isActive);
}

function CollapsedTooltip({ label }: { label: string }) {
  return (
    <span className="pointer-events-none absolute left-full top-1/2 z-40 ml-3 -translate-y-1/2 rounded-lg bg-slate-950 px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-all duration-150 group-hover:opacity-100 group-hover:translate-x-0.5 dark:bg-slate-100 dark:text-slate-900">
      {label}
    </span>
  );
}

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
  const isHrefActive = useIsHrefActive();
  const transitionTimer = useRef<number | null>(null);
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("chronos-sidebar-collapsed") === "1";
  });
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => ({
    collaboration: true,
    settings: false,
  }));
  const [flyoutGroup, setFlyoutGroup] = useState<string | null>(null);
  const flyoutTimeoutRef = useRef<number | null>(null);

  const sections = getSidebarSections(summary.pendingIncomingCount);

  useEffect(() => {
    if (collapsed) return;
    setFlyoutGroup(null);
  }, [collapsed]);

  useEffect(() => {
    document.documentElement.dataset.sidebarState = collapsed ? "collapsed" : "expanded";
  }, [collapsed]);

  useEffect(() => {
    return () => {
      if (transitionTimer.current) {
        window.clearTimeout(transitionTimer.current);
      }
      if (flyoutTimeoutRef.current) {
        window.clearTimeout(flyoutTimeoutRef.current);
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

  const toggleGroup = (key: string) => {
    if (collapsed) {
      setFlyoutGroup((prev) => (prev === key ? null : key));
      return;
    }
    // Auto-collapse other groups when expanding a new one (accordion behavior)
    setOpenGroups((prev) => ({
      collaboration: key === "collaboration" ? !prev.collaboration : false,
      settings: key === "settings" ? !prev.settings : false,
    }));
  };

  const renderLeafItem = (child: SidebarLeaf, index?: number) => {
    const childActive = isHrefActive(child.href);
    const staggerDelay = index !== undefined ? `${index * 50}ms` : undefined;
    return (
      <Link
        key={child.href}
        href={child.href}
        style={{ animationDelay: staggerDelay } as any}
        className={cn(
          "group relative flex items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors",
          "before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-5 before:rounded-r-lg before:transition-all before:duration-200",
          staggerDelay && "animate-in fade-in slide-in-from-bottom-1 duration-300",
          childActive
            ? "bg-white/82 text-primary font-semibold ring-1 ring-white/70 before:w-1.5 before:bg-primary dark:bg-white/10"
            : "text-slate-600 hover:bg-white/75 before:w-0 dark:text-slate-300 dark:hover:bg-white/8",
        )}
      >
        <span>{child.name}</span>
        {typeof child.badge === "number" && child.badge > 0 ? (
          <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[11px] font-semibold text-white">
            {child.badge}
          </span>
        ) : null}
      </Link>
    );
  };

  const renderMenuItem = (item: SidebarGroupItem) => {
    const Icon = item.icon;
    const parentActive = isParentActive(item, isHrefActive);
    const expanded = collapsed ? flyoutGroup === item.key : (openGroups[item.key] ?? parentActive);

    if (!item.children?.length) {
      return (
        <div key={item.key} className="group relative">
          <Link
            href={item.href ?? "#"}
            className={cn(
              "relative flex items-center rounded-2xl transition-all duration-200",
              "before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-5 before:rounded-r-lg before:transition-all before:duration-200",
              collapsed ? "justify-center px-2 py-3" : "gap-3 px-3 py-2.5",
              parentActive
                ? "bg-white/80 text-primary font-semibold shadow-[0_12px_24px_-18px_rgba(101,109,193,0.9)] ring-1 ring-white/70 before:w-1.5 before:bg-primary dark:bg-white/10"
                : "text-sidebar-foreground hover:bg-sidebar-accent/85 hover:text-sidebar-accent-foreground before:w-0",
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {!collapsed ? <span>{item.name}</span> : null}
          </Link>
          {collapsed ? <CollapsedTooltip label={item.name} /> : null}
        </div>
      );
    }

    return (
      <div
        key={item.key}
        className="relative space-y-1"
        onMouseEnter={() => {
          if (collapsed) {
            if (flyoutTimeoutRef.current) {
              window.clearTimeout(flyoutTimeoutRef.current);
            }
            flyoutTimeoutRef.current = window.setTimeout(() => {
              setFlyoutGroup(item.key);
            }, 200);
          }
        }}
        onMouseLeave={() => {
          if (collapsed) {
            if (flyoutTimeoutRef.current) {
              window.clearTimeout(flyoutTimeoutRef.current);
            }
            setFlyoutGroup((prev) => (prev === item.key ? null : prev));
          }
        }}
      >
        <button
          type="button"
          onClick={() => toggleGroup(item.key)}
          className={cn(
            "relative w-full rounded-2xl transition-all duration-200",
            "before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-5 before:rounded-r-lg before:transition-all before:duration-200",
            collapsed ? "flex items-center justify-center px-2 py-3" : "flex items-center gap-3 px-3 py-2.5",
            parentActive
              ? "bg-white/80 text-primary font-semibold ring-1 ring-white/70 shadow-[0_12px_24px_-18px_rgba(101,109,193,0.9)] before:w-1.5 before:bg-primary dark:bg-white/10"
              : "text-sidebar-foreground hover:bg-sidebar-accent/85 hover:text-sidebar-accent-foreground before:w-0",
          )}
        >
          <Icon className="h-5 w-5 shrink-0" />
          {!collapsed ? <span className="flex-1 text-left">{item.name}</span> : null}
          {!collapsed ? (
            <ChevronDown className={cn("h-4 w-4 transition-transform", expanded ? "rotate-180" : "rotate-0")} />
          ) : null}
        </button>
        {collapsed ? <CollapsedTooltip label={item.name} /> : null}

        {!collapsed ? (
          <div
            className={cn(
              "space-y-1 overflow-hidden pl-5 transition-[max-height,opacity,transform] duration-250 ease-out",
              expanded ? "max-h-80 translate-y-0 opacity-100" : "max-h-0 -translate-y-1 opacity-0",
            )}
          >
            <div className="space-y-1 border-l border-slate-200/70 pl-3 dark:border-slate-700/70">
              {item.children.map((child, index) => renderLeafItem(child, index))}
            </div>
          </div>
        ) : null}

        {collapsed && expanded ? (
          <div className="absolute left-full top-1/2 z-30 ml-2 w-60 -translate-y-1/2 rounded-2xl border border-white/50 bg-white/95 p-3 shadow-[0_25px_50px_-12px_rgba(62,69,143,1.1)] backdrop-blur-xl transition-all duration-200 ease-out dark:border-white/10 dark:bg-slate-900/98">
            <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              {item.name}
            </p>
            <div className="space-y-0.5">{item.children.map((child, index) => renderLeafItem(child, index))}</div>
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <aside
      className={cn(
        "h-screen max-w-xs flex-col hidden md:flex backdrop-blur-xl bg-sidebar/70 border-r border-sidebar-border/85 shadow-[14px_0_40px_-30px_rgba(93,102,186,0.65)] isolate transition-all duration-300",
        collapsed ? "w-20" : "w-64",
      )}
    >
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
        <Link href="/profile" className={cn("flex items-center", collapsed ? "justify-center" : "gap-3")} title={collapsed ? summary.displayName : undefined}>
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
              <p className="truncate text-sm font-semibold text-slate-700 dark:text-slate-100">
                {summary.displayName}
              </p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">{summary.email}</p>
            </div>
          ) : null}
        </Link>
      </div>

      <div className={cn("flex-1 overflow-y-auto py-4", collapsed ? "px-2" : "px-3")}>
        <div className="space-y-5">
          {sections.map((section) => (
            <div key={section.label} className="space-y-2">
              {!collapsed ? (
                <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  {section.label}
                </p>
              ) : null}
              <div className="space-y-1.5">{section.items.map(renderMenuItem)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className={cn("border-t border-sidebar-border/70", collapsed ? "p-2" : "p-3")}>
        {!collapsed ? (
          <p className="mb-2 truncate px-1 text-[11px] text-slate-500 dark:text-slate-400">{summary.email}</p>
        ) : null}
        <SidebarLogoutButton
          action={logoutAction}
          compact={collapsed}
          className={cn(collapsed ? "mx-auto" : "w-full")}
        />
      </div>
    </aside>
  );
}
