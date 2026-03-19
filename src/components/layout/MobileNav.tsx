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
        <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-950/95 backdrop-blur-xl animate-in fade-in slide-in-from-left duration-300">
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

          <div className="flex-1 py-8 px-6 space-y-3 overflow-y-auto">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname.startsWith(link.href);

              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-4 px-5 py-4 rounded-2xl text-lg transition-all",
                    isActive
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  )}
                >
                  <Icon className="w-6 h-6" />
                  {link.name}
                </Link>
              );
            })}
          </div>

          {sessionEmail && (
            <div className="p-6 border-t border-slate-200 dark:border-slate-800">
               <div className="mb-4 px-2">
                  <p className="text-xs text-slate-500">Logged in as</p>
                  <p className="text-sm font-medium truncate">{sessionEmail}</p>
               </div>
               <Link 
                href="/login"
                className="flex items-center gap-4 px-5 py-4 rounded-2xl text-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all font-medium"
               >
                 <LogOut className="w-6 h-6" />
                 Logout
               </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
