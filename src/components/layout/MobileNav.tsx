"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { 
  Menu, 
  X, 
  Box, 
  LayoutDashboard, 
  Wallet, 
  TrendingDown, 
  Target, 
  LineChart, 
  Handshake
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
  { name: "Simulation", href: "/simulation", icon: LineChart },
];

export function MobileNav({ sessionEmail }: { sessionEmail?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full w-10 h-10 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
        onClick={() => setIsOpen(true)}
      >
        <Menu className="w-6 h-6" />
      </Button>

      {mounted &&
        isOpen &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-40 bg-black/35"
              onClick={() => setIsOpen(false)}
            />
            <aside className="fixed inset-y-0 left-0 z-50 w-64 max-w-[84vw] bg-slate-50 border-r border-slate-200 shadow-2xl flex flex-col">
              <div className="flex h-16 items-center justify-between px-6 border-b border-slate-200">
                <span className="text-2xl font-bold tracking-tight text-blue-600">
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

              <div className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
                {links.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname.startsWith(link.href);

                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200",
                        isActive
                          ? "bg-blue-600/12 text-blue-600 font-medium"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      {link.name}
                    </Link>
                  );
                })}
              </div>

              {sessionEmail ? (
                <div className="px-6 pb-5 pt-2 border-t border-slate-200">
                  <p className="text-xs text-slate-500 truncate">{sessionEmail}</p>
                </div>
              ) : null}
            </aside>
          </>,
          document.body
        )}
    </div>
  );
}
