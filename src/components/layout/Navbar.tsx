import { Bell, Search, User, Settings } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getSessionUserEmail } from "@/lib/auth-session";
import { MobileNav } from "./MobileNav";
import { ThemeToggle } from "./ThemeToggle";
import { NavbarSessionInfo } from "./NavbarSessionInfo";
import { LogoutMenuItem } from "./LogoutMenuItem";
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuLabel, 
    DropdownMenuSeparator, 
    DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

import { logoutAction } from "@/actions/auth";

export async function Navbar() {
    const sessionEmail = await getSessionUserEmail();
    const sessionInitial = (sessionEmail?.trim().charAt(0) || "U").toUpperCase();

    return (
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between px-4 md:px-6 backdrop-blur-xl bg-background/68 border-b border-border/80 shadow-[0_10px_25px_-20px_rgba(100,108,186,0.95)]">
            <div className="flex items-center gap-4 flex-1">
                <MobileNav sessionEmail={sessionEmail ?? undefined} />
                <div className="relative w-full max-w-md hidden md:block">
                    <Search className="absolute ml-3 mt-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search transactions or goals..."
                        className="w-full rounded-2xl bg-card/70 pl-10 border-border focus-visible:ring-ring"
                    />
                </div>
            </div>
            <div className="flex items-center gap-4">
                <ThemeToggle />

                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                >
                    <Bell className="h-5 w-5 text-muted-foreground" />
                </Button>

                <NavbarSessionInfo sessionEmail={sessionEmail} />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="h-9 w-9 bg-linear-to-tr from-[#767fe0] to-[#a6aafb] rounded-full flex items-center justify-center shadow-[0_10px_24px_-16px_rgba(112,120,210,0.9)] text-white text-sm font-semibold cursor-pointer outline-none hover:brightness-105 transition-all">
                            {sessionEmail ? sessionInitial : <User className="h-5 w-5 text-white" />}
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 rounded-2xl border border-white/50 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80">
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">User Account</p>
                                <p className="text-xs leading-none text-muted-foreground">{sessionEmail}</p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild className="rounded-xl cursor-pointer">
                            <Link href="/profile" className="flex items-center">
                                <Settings className="mr-2 h-4 w-4" />
                                <span>Settings</span>
                            </Link>
                        </DropdownMenuItem>
                        <LogoutMenuItem action={logoutAction} />
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
