import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
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
        <div className="flex min-h-screen w-full bg-slate-50 dark:bg-slate-950 font-sans">
            <Sidebar />
            <div className="flex flex-col flex-1 w-full overflow-hidden">
                <Navbar />
                <main className="flex-1 w-full p-4 md:p-8 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
