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
  UserCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { name: "Overview", href: "/overview", icon: LayoutDashboard },
  { name: "Assets", href: "/assets", icon: Box },
  { name: "Income", href: "/income", icon: Wallet },
  { name: "Expenses", href: "/expenses", icon: TrendingDown },
  { name: "Targets", href: "/targets", icon: Target },
  { name: "Collaboration", href: "/collaboration", icon: Handshake },
  { name: "Profile", href: "/profile", icon: UserCircle2 },
  { name: "Simulation", href: "/simulation", icon: LineChart },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen max-w-xs flex-col hidden md:flex backdrop-blur-xl bg-sidebar/70 border-r border-sidebar-border/85 shadow-[14px_0_40px_-30px_rgba(93,102,186,0.65)] isolate">
      <div className="flex h-16 items-center px-6 border-b border-sidebar-border/70">
        <span className="text-2xl font-bold tracking-tight bg-linear-to-br from-[#7981e0] to-[#9ca1f2] bg-clip-text text-transparent">
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
                  ? "bg-white/75 text-primary font-semibold shadow-[0_12px_24px_-18px_rgba(101,109,193,0.9)] ring-1 ring-white/60 dark:bg-white/10"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/85 hover:text-sidebar-accent-foreground"
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
