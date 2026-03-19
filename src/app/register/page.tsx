import { ensureAppUserByEmail, getAppUserByEmail } from "@/actions/collaboration";
import { SoftDecorShapes } from "@/components/layout/SoftDecorShapes";
import { getSessionUserEmail, setSessionUserEmail } from "@/lib/auth-session";
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
    <div className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[36vh] bg-linear-to-r from-[#7e86e8] via-[#9198ef] to-[#7e86e8]" />
      <div className="pointer-events-none absolute -left-12 top-16 h-56 w-56 rounded-full bg-white/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 bottom-10 h-52 w-52 rounded-full bg-violet-200/40 blur-3xl dark:bg-violet-500/20" />
      <SoftDecorShapes variant="auth" />

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/55 bg-card/82 p-6 shadow-[0_35px_65px_-38px_rgba(78,86,160,0.95)] ring-1 ring-white/65 backdrop-blur-xl animate-lift-in dark:ring-white/10">
        <h1 className="text-2xl font-bold mb-1">Register</h1>
        <p className="text-sm text-muted-foreground mb-5">
          Buat akun baru untuk mengakses dashboard Chronos Wealth.
        </p>

        {errorMessage && (
          <div className="rounded-2xl border border-rose-200/80 bg-rose-100/70 text-rose-700 px-3 py-2 text-sm mb-4 backdrop-blur-md dark:bg-rose-900/35 dark:text-rose-200">
            {errorMessage}
          </div>
        )}

        <form action={handleRegister} className="space-y-3">
          <div>
            <label htmlFor="register-name" className="block text-sm font-medium">
              Nama
            </label>
            <input
              id="register-name"
              name="displayName"
              type="text"
              placeholder="Nama Anda"
              required
              className="w-full rounded-2xl border border-input bg-white/70 dark:bg-slate-900/35 px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="register-email" className="block text-sm font-medium">
              Email
            </label>
            <input
              id="register-email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              className="w-full rounded-2xl border border-input bg-white/70 dark:bg-slate-900/35 px-3 py-2"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-2xl px-4 py-2.5 bg-linear-to-r from-primary to-[#8f95ea] text-primary-foreground shadow-[0_14px_30px_-18px_rgba(125,132,226,0.9)] hover:brightness-105 transition-all"
          >
            Daftar
          </button>
        </form>

        <p className="text-xs text-muted-foreground mt-3 text-center">
          Harga booth dasar simulasi bisa dipilih nanti di halaman Assets.
        </p>

        <p className="text-sm text-muted-foreground mt-4 text-center">
          Sudah punya akun?{" "}
          <a href="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
            Login di sini
          </a>
        </p>
      </div>
    </div>
  );
}
