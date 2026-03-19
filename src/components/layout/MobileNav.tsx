"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Menu, 
  X, 
  Box, 
  LayoutDashboard, 
  Wallet, 
  TrendingDown, 
  Target, 
  LineChart, 
  Handshake,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/actions/auth";

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
  const pathname = usePathname();

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

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-[280px] flex flex-col bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 shadow-2xl animate-in slide-in-from-left duration-300">
            <div className="flex h-16 items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800">
              <span className="text-xl font-bold tracking-tight bg-gradient-to-br from-blue-600 to-indigo-500 bg-clip-text text-transparent">
                Chronos Wealth
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-6 h-6" />
              </Button>
            </div>

            <div className="flex-1 py-8 px-4 space-y-2 overflow-y-auto">
              {links.map((link) => {
                const Icon = link.icon;
                const isActive = pathname.startsWith(link.href);

                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center gap-4 px-4 py-3 rounded-2xl text-md transition-all",
                      isActive
                        ? "bg-blue-600/10 text-blue-600 dark:text-blue-400 font-medium"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {link.name}
                  </Link>
                );
              })}
            </div>

            {sessionEmail && (
              <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="mb-4 px-2">
                    <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Account</p>
                    <p className="text-sm font-medium truncate text-slate-700 dark:text-slate-200">{sessionEmail}</p>
                </div>
                <Button 
                  variant="ghost"
                  className="w-full justify-start gap-4 px-4 py-6 rounded-2xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all font-semibold"
                  onClick={async () => {
                      await logoutAction();
                  }}
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
