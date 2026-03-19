"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Box,
  LayoutDashboard,
  Wallet,
  TrendingDown,
  Target,
  LineChart,
  Handshake,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { name: "Overview", href: "/overview", icon: LayoutDashboard },
  { name: "Assets", href: "/assets", icon: Box },
  { name: "Income", href: "/income", icon: Wallet },
  { name: "Expenses", href: "/expenses", icon: TrendingDown },
  { name: "Targets", href: "/targets", icon: Target },
  { name: "Collaboration", href: "/collaboration", icon: Handshake },
  { name: "Simulation", href: "/simulation", icon: LineChart },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen max-w-xs flex-col hidden md:flex backdrop-blur-md bg-white/40 dark:bg-black/40 border-r border-white/20 shadow-lg isolate">
      <div className="flex h-16 items-center px-6">
        <span className="text-2xl font-bold tracking-tight bg-linear-to-br from-blue-600 to-indigo-500 bg-clip-text text-transparent">
          Chronos Wealth
        </span>
      </div>
      <div className="flex-1 py-6 px-4 space-y-2">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname.startsWith(link.href);

          return (
            <Link
              key={link.name}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300",
                isActive
                  ? "bg-blue-600/10 text-blue-600 dark:text-blue-400 font-medium"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100"
              )}
            >
              <Icon className="w-5 h-5" />
              {link.name}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
