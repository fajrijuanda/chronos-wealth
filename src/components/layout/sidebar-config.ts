import {
  Box,
  CircleHelp,
  Handshake,
  LayoutDashboard,
  LineChart,
  PieChart,
  Settings,
  Target,
  TrendingDown,
  UserCircle2,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type SidebarLeaf = {
  name: string;
  href: string;
  icon?: LucideIcon;
  badge?: number;
};

export type SidebarGroupItem = {
  key: string;
  name: string;
  icon: LucideIcon;
  href?: string;
  children?: SidebarLeaf[];
};

export type SidebarSection = {
  label: string;
  items: SidebarGroupItem[];
};

export function getSidebarSections(pendingIncomingCount: number): SidebarSection[] {
  return [
    {
      label: "Main",
      items: [
        { key: "overview", name: "Dashboard", href: "/overview", icon: LayoutDashboard },
        { key: "assets", name: "Assets", href: "/assets", icon: Box },
        { key: "income", name: "Income", href: "/income", icon: Wallet },
        { key: "expenses", name: "Expenses", href: "/expenses", icon: TrendingDown },
          { key: "budget", name: "Budget", href: "/budget", icon: PieChart },
        { key: "targets", name: "Targets", href: "/targets", icon: Target },
        { key: "simulation", name: "Simulation", href: "/simulation", icon: LineChart },
        {
          key: "collaboration",
          name: "Collaboration",
          icon: Handshake,
          href: "/collaboration",
          children: [
            { name: "Workspace", href: "/collaboration" },
            { name: "Connections", href: "/collaboration/connections" },
            { name: "Pending", href: "/collaboration/pending", badge: pendingIncomingCount },
          ],
        },
      ],
    },
    {
      label: "Settings",
      items: [
        { key: "profile", name: "Profile", href: "/profile", icon: UserCircle2 },
        {
          key: "settings",
          name: "Settings",
          icon: Settings,
          href: "/settings",
          children: [
            { name: "Finance", href: "/settings?tab=finance" },
            { name: "Goals", href: "/settings?tab=goals" },
            { name: "Connections", href: "/settings?tab=connections" },
            { name: "Session", href: "/settings?tab=session" },
          ],
        },
        { key: "help", name: "Help", href: "/help", icon: CircleHelp },
      ],
    },
  ];
}