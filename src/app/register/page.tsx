import { ensureAppUserByEmail, getAppUserByEmail } from "@/actions/collaboration";
import { SoftDecorShapes } from "@/components/layout/SoftDecorShapes";
import { getSessionUserEmail, setSessionUserEmail } from "@/lib/auth-session";
import { UserPlus } from "lucide-react";
import { redirect } from "next/navigation";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const existingSession = await getSessionUserEmail();
  if (existingSession) {
    redirect("/overview");
  }

  const sp = await searchParams;
  const errorMessage = typeof sp.error === "string" ? sp.error : null;

  async function handleRegister(formData: FormData) {
    "use server";

    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const displayName = String(formData.get("displayName") ?? "").trim();

    if (!email || !email.includes("@")) {
      redirect("/register?error=Please%20enter%20a%20valid%20email");
    }

    if (!displayName) {
      redirect("/register?error=Please%20enter%20your%20name");
    }

    let redirectTarget: string | null = null;
    let errorMessage: string | null = null;

    try {
      const existingUser = await getAppUserByEmail(email);
      if (existingUser) {
        redirectTarget = "/register?error=Email%20already%20registered.%20Please%20login";
      } else {
        await ensureAppUserByEmail({
          email,
          displayName,
        });

        await setSessionUserEmail(email);
        redirectTarget = "/overview";
      }
    } catch (e: unknown) {
      console.error("Register Error:", e);
      if (e instanceof Error) {
        errorMessage = e.message;
      } else {
        errorMessage = "Unable to register. Please try again";
      }
    }

    if (redirectTarget) {
      redirect(redirectTarget);
    }

    if (errorMessage) {
      redirect(`/register?error=${encodeURIComponent(errorMessage)}`);
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-linear-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950">
      {/* Background gradient blobs */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-linear-to-br from-[#7e86e8]/30 to-[#9198ef]/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-linear-to-tl from-blue-400/20 to-purple-300/20 rounded-full blur-3xl animate-pulse animation-delay-2000" />
      </div>

      <SoftDecorShapes variant="auth" />

      <div className="relative z-10 w-full max-w-md">
        {/* Glow background effect */}
        <div className="absolute -inset-0.5 bg-linear-to-r from-[#7e86e8] via-[#9198ef] to-[#7e86e8] rounded-3xl opacity-20 blur-xl -z-10 group-hover:opacity-30 transition-opacity" />
        
        <div className="relative rounded-3xl border border-white/40 bg-white/90 dark:bg-slate-900/80 p-8 shadow-[0_35px_65px_-38px_rgba(78,86,160,0.95)] backdrop-blur-2xl transition-all duration-300 hover:border-white/60 dark:border-white/20">
          
          {/* Header with icon */}
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-2xl bg-linear-to-br from-[#7e86e8]/20 to-[#9198ef]/20 border border-white/40">
              <UserPlus className="w-5 h-5 text-[#7e86e8]" />
            </div>
            <h1 className="text-3xl font-bold bg-linear-to-r from-[#7e86e8] to-[#9198ef] bg-clip-text text-transparent">
              Daftar
            </h1>
          </div>
          
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            Buat akun untuk memulai mengelola strategi investasi Anda
          </p>

          {/* Error message */}
          {errorMessage && (
            <div className="rounded-2xl border border-rose-300/50 bg-linear-to-br from-rose-100/70 to-rose-50/70 dark:from-rose-900/30 dark:to-rose-800/20 text-rose-700 dark:text-rose-200 px-4 py-3 text-sm mb-5 backdrop-blur-md flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="shrink-0 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-600 dark:bg-rose-300" />
              </div>
              <span>{errorMessage}</span>
            </div>
          )}

          <form action={handleRegister} className="space-y-4">
            {/* Name input */}
            <div className="space-y-2">
              <label htmlFor="register-name" className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Nama Lengkap
              </label>
              <input
                id="register-name"
                name="displayName"
                type="text"
                placeholder="Contoh: Budi Santoso"
                required
                autoFocus
                className="w-full rounded-2xl border border-white/40 bg-white/50 dark:bg-slate-800/50 px-4 py-3 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-[#7e86e8]/50 focus:border-transparent backdrop-blur-sm"
              />
            </div>

            {/* Email input */}
            <div className="space-y-2">
              <label htmlFor="register-email" className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Email Address
              </label>
              <input
                id="register-email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                className="w-full rounded-2xl border border-white/40 bg-white/50 dark:bg-slate-800/50 px-4 py-3 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-[#7e86e8]/50 focus:border-transparent backdrop-blur-sm"
              />
            </div>

            {/* Info text */}
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-start gap-2">
              <span className="inline-block w-1 h-1 rounded-full bg-slate-400 mt-1.5 shrink-0" />
              Harga booth dasar bisa dipilih nanti di halaman Assets
            </p>

            {/* Submit button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full rounded-2xl px-4 py-3 bg-linear-to-r from-[#7e86e8] via-[#9198ef] to-[#7e86e8] text-white font-semibold shadow-[0_14px_30px_-18px_rgba(125,132,226,0.9)] hover:brightness-105 transition-all focus:outline-none focus:ring-2 focus:ring-[#7e86e8]/50 focus:ring-offset-2 dark:focus:ring-offset-slate-900 relative overflow-hidden group"
              >
                <span aria-hidden="true" className="pointer-events-none absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-500" />
                <span className="relative">Daftar Akun</span>
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200/50 dark:border-slate-700/50" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-white dark:bg-slate-900 text-slate-500">atau</span>
            </div>
          </div>

          {/* Login link */}
          <div className="text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Sudah punya akun?{" "}
              <a 
                href="/login" 
                className="inline-block font-semibold text-[#7e86e8] hover:text-[#9198ef] relative group transition-colors"
              >
                Masuk di sini
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-linear-to-r from-[#7e86e8] to-[#9198ef] group-hover:w-full transition-all duration-300" />
              </a>
            </p>
          </div>
        </div>

        {/* Footer text */}
        <p className="text-xs text-slate-600 dark:text-slate-400 text-center mt-6">
          Chronos Wealth • Manajemen Keuangan & Strategi Investasi
        </p>
      </div>
    </div>
  );
}
