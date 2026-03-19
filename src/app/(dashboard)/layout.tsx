import { Sidebar } from "@/components/layout/Sidebar";
import { DashboardHeroStrip } from "@/components/layout/DashboardHeroStrip";
import { Navbar } from "@/components/layout/Navbar";
import { SoftDecorShapes } from "@/components/layout/SoftDecorShapes";
import { getSessionUserEmail } from "@/lib/auth-session";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const sessionEmail = await getSessionUserEmail();
    if (!sessionEmail) {
        redirect("/login");
    }

    return (
        <div className="relative flex h-screen w-full bg-background text-foreground font-sans overflow-hidden">
            <div className="pointer-events-none absolute -left-20 -top-14 h-72 w-72 rounded-full bg-indigo-300/45 blur-3xl dark:bg-indigo-500/20" />
            <div className="pointer-events-none absolute -right-24 top-40 h-80 w-80 rounded-full bg-sky-200/45 blur-3xl dark:bg-sky-500/20" />
            <div className="pointer-events-none absolute bottom-0 left-1/3 h-60 w-60 rounded-full bg-violet-200/35 blur-3xl dark:bg-violet-500/15" />
            <SoftDecorShapes variant="dashboard" />
            <Sidebar />
            <div className="relative z-10 flex flex-col flex-1 min-w-0">
                <Navbar />
                <main className="flex-1 w-full p-4 md:p-8 overflow-y-auto">
                    <DashboardHeroStrip />
                    <div className="mt-6">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
