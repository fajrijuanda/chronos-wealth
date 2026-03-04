import { Bell, Search, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function Navbar() {
    return (
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between px-6 backdrop-blur-md bg-white/60 dark:bg-black/60 border-b border-white/20 shadow-sm">
            <div className="flex items-center gap-4 flex-1">
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
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-800/50">
                    <Bell className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                </Button>
                <div className="h-9 w-9 bg-gradient-to-tr from-blue-600 to-indigo-400 rounded-full flex items-center justify-center shadow-md">
                    <User className="h-5 w-5 text-white" />
                </div>
            </div>
        </header>
    );
}
