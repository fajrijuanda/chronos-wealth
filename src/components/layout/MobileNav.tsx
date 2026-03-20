"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { createPortal } from "react-dom";
import { ChevronDown, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/actions/auth";
import { getSidebarSections, type SidebarGroupItem } from "./sidebar-config";
import { SidebarLogoutButton } from "./SidebarLogoutButton";

function hrefToTab(href: string) {
  const query = href.split("?")[1];
  if (!query) return null;
  return new URLSearchParams(query).get("tab");
}

export function MobileNav({
  sessionEmail,
  pendingIncomingCount = 0,
}: {
  sessionEmail?: string;
  pendingIncomingCount?: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    collaboration: true,
    settings: false,
  });
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab");
  const sections = getSidebarSections(pendingIncomingCount);

  const isHrefActive = (href: string) => {
    const [base] = href.split("?");
    const isPathMatch = pathname === base || pathname.startsWith(`${base}/`);
    if (!isPathMatch) return false;

    const tab = hrefToTab(href);
    if (!tab) return true;
    return currentTab === tab;
  };

  const itemIsActive = (item: SidebarGroupItem) => {
    const ownActive = item.href ? isHrefActive(item.href) : false;
    const childActive = Boolean(item.children?.some((child) => isHrefActive(child.href)));
    return ownActive || childActive;
  };

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full w-10 h-10"
        onClick={() => setIsOpen(true)}
      >
        <Menu className="w-6 h-6" />
      </Button>

      {isOpen && typeof document !== "undefined" &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-40 bg-[#22253d]/35 backdrop-blur-[1.5px]"
              onClick={() => setIsOpen(false)}
            />
            <aside className="fixed inset-y-0 left-0 z-50 w-64 max-w-[84vw] bg-sidebar/88 backdrop-blur-xl border-r border-sidebar-border shadow-[14px_0_40px_-20px_rgba(85,92,165,0.75)] flex flex-col">
              <div className="flex h-16 items-center justify-between px-6 border-b border-sidebar-border/80">
                <span className="text-2xl font-bold tracking-tight bg-linear-to-br from-[#7981e0] to-[#9ca1f2] bg-clip-text text-transparent">
                  Chronos Wealth
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close sidebar"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="flex-1 space-y-5 overflow-y-auto px-4 py-5">
                {sections.map((section) => (
                  <div key={section.label} className="space-y-2">
                    <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      {section.label}
                    </p>

                    <div className="space-y-1.5">
                      {section.items.map((item) => {
                        const Icon = item.icon;
                        const active = itemIsActive(item);
                        const expanded = openGroups[item.key] ?? active;

                        if (!item.children?.length) {
                          return (
                            <Link
                              key={item.key}
                              href={item.href ?? "#"}
                              onClick={() => setIsOpen(false)}
                              className={cn(
                                "flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-200",
                                active
                                  ? "bg-white/75 text-primary font-semibold shadow-[0_10px_24px_-18px_rgba(101,109,193,0.9)] ring-1 ring-white/60 dark:bg-white/10"
                                  : "text-sidebar-foreground hover:bg-sidebar-accent/85 hover:text-sidebar-accent-foreground",
                              )}
                            >
                              <Icon className="h-5 w-5" />
                              {item.name}
                            </Link>
                          );
                        }

                        return (
                          <div key={item.key} className="space-y-1">
                            <button
                              type="button"
                              onClick={() =>
                                setOpenGroups((prev) => ({
                                  ...prev,
                                  [item.key]: !expanded,
                                }))
                              }
                              className={cn(
                                "flex w-full items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-200",
                                active
                                  ? "bg-white/75 text-primary font-semibold shadow-[0_10px_24px_-18px_rgba(101,109,193,0.9)] ring-1 ring-white/60 dark:bg-white/10"
                                  : "text-sidebar-foreground hover:bg-sidebar-accent/85 hover:text-sidebar-accent-foreground",
                              )}
                            >
                              <Icon className="h-5 w-5" />
                              <span className="flex-1 text-left">{item.name}</span>
                              <ChevronDown className={cn("h-4 w-4 transition-transform", expanded ? "rotate-180" : "rotate-0")} />
                            </button>

                            <div
                              className={cn(
                                "overflow-hidden pl-7 transition-[max-height,opacity,transform] duration-250 ease-out",
                                expanded ? "max-h-96 translate-y-0 opacity-100" : "max-h-0 -translate-y-1 opacity-0",
                              )}
                            >
                              <div className="space-y-1 border-l border-slate-200/70 pl-3 dark:border-slate-700/70">
                                {item.children.map((child) => {
                                  const childActive = isHrefActive(child.href);
                                  return (
                                    <Link
                                      key={child.href}
                                      href={child.href}
                                      onClick={() => setIsOpen(false)}
                                      className={cn(
                                        "flex items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors",
                                        childActive
                                          ? "bg-white/82 text-primary font-semibold ring-1 ring-white/70 dark:bg-white/10"
                                          : "text-slate-600 hover:bg-white/75 dark:text-slate-300 dark:hover:bg-white/8",
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
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 border-t border-sidebar-border px-4 pb-5 pt-3">
                {sessionEmail ? (
                  <p className="truncate px-2 text-xs text-muted-foreground">{sessionEmail}</p>
                ) : null}
                <SidebarLogoutButton action={logoutAction} className="w-full" />
              </div>
            </aside>
          </>,
          document.body
        )}
    </div>
  );
}
