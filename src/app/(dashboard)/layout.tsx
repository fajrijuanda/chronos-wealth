import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { SoftDecorShapes } from "@/components/layout/SoftDecorShapes";
import { getSessionUserEmail } from "@/lib/auth-session";
import { getSidebarProfileSummary } from "@/actions/collaboration";
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

    const sidebarSummary = await getSidebarProfileSummary(sessionEmail);

    return (
        <div className="relative flex h-screen w-full bg-background text-foreground font-sans overflow-hidden">
            <div className="pointer-events-none absolute -left-20 -top-14 h-72 w-72 rounded-full bg-indigo-300/45 blur-3xl dark:bg-indigo-500/20" />
            <div className="pointer-events-none absolute -right-24 top-40 h-80 w-80 rounded-full bg-sky-200/45 blur-3xl dark:bg-sky-500/20" />
            <div className="pointer-events-none absolute bottom-0 left-1/3 h-60 w-60 rounded-full bg-violet-200/35 blur-3xl dark:bg-violet-500/15" />
            <SoftDecorShapes variant="dashboard" />
            <Sidebar summary={sidebarSummary} />
            <div className="dashboard-main-shell relative z-10 flex min-w-0 flex-1 flex-col transition-[width,filter,padding] duration-300 ease-out">
                <Navbar />
                <main className="dashboard-main-content flex-1 w-full overflow-y-auto p-4 transition-[padding] duration-300 ease-out md:p-8">
                    <div className="dashboard-page">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
