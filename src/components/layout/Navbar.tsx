import { Bell, LogOut, Search, User, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getSessionUserEmail } from "@/lib/auth-session";
import { MobileNav } from "./MobileNav";
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
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between px-4 md:px-6 backdrop-blur-md bg-white/60 dark:bg-black/60 border-b border-white/20 shadow-sm">
            <div className="flex items-center gap-4 flex-1">
                <MobileNav sessionEmail={sessionEmail ?? undefined} />
                <div className="relative w-full max-w-md hidden md:block">
                    <Search className="absolute ml-3 mt-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search transactions or goals..."
                        className="w-full rounded-2xl bg-white/50 dark:bg-black/50 pl-10 border-white/20 focus-visible:ring-blue-500"
                    />
                </div>
            </div>
            <div className="flex items-center gap-4">
                <div className="hidden md:flex flex-col items-end leading-tight">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Logged in as</span>
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-200 max-w-44 truncate">
                        {sessionEmail ?? "-"}
                    </span>
                </div>
                
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-800/50">
                    <Bell className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="h-9 w-9 bg-linear-to-tr from-blue-600 to-indigo-400 rounded-full flex items-center justify-center shadow-md text-white text-sm font-semibold cursor-pointer outline-none hover:opacity-90 transition-opacity">
                            {sessionEmail ? sessionInitial : <User className="h-5 w-5 text-white" />}
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 rounded-2xl border-white/20 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80">
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">User Account</p>
                                <p className="text-xs leading-none text-muted-foreground">{sessionEmail}</p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="rounded-xl cursor-pointer">
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Settings</span>
                        </DropdownMenuItem>
                        <form action={logoutAction} className="w-full">
                            <DropdownMenuItem asChild className="rounded-xl cursor-pointer text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/30">
                                <button type="submit" className="w-full flex items-center">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Logout</span>
                                </button>
                            </DropdownMenuItem>
                        </form>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
