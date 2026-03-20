import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getSessionUserEmail } from "@/lib/auth-session";
import { getSidebarProfileSummary } from "@/actions/collaboration";
import { getUserNotificationsByEmail } from "@/actions/notification";
import { MobileNav } from "./MobileNav";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationCenter } from "./NotificationCenter";

export async function Navbar() {
    const sessionEmail = await getSessionUserEmail();
    const [notifications, sidebarSummary] = sessionEmail
        ? await Promise.all([
            getUserNotificationsByEmail(sessionEmail),
            getSidebarProfileSummary(sessionEmail),
        ])
        : [[], null];

    return (
        <header className="sticky top-0 z-30 grid h-16 w-full grid-cols-[auto_1fr_auto] items-center gap-3 px-4 md:px-6 backdrop-blur-xl bg-background/68 border-b border-border/80 shadow-[0_10px_25px_-20px_rgba(100,108,186,0.95)]">
            <div className="flex items-center">
                <MobileNav
                    sessionEmail={sessionEmail ?? undefined}
                    pendingIncomingCount={sidebarSummary?.pendingIncomingCount ?? 0}
                />
            </div>

            <div className="hidden md:flex justify-center">
                <div className="relative w-full max-w-xl">
                    <Search className="absolute ml-3 mt-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search transactions or goals..."
                        className="w-full rounded-2xl bg-card/70 pl-10 border-border focus-visible:ring-ring"
                    />
                </div>
            </div>

            <div className="flex items-center justify-end gap-4">
                <ThemeToggle />

                <NotificationCenter sessionEmail={sessionEmail ?? ""} initialNotifications={notifications} />
            </div>
        </header>
    );
}
