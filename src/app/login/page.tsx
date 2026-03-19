import { getAppUserByEmail } from "@/actions/collaboration";
import { getSessionUserEmail, setSessionUserEmail } from "@/lib/auth-session";
import { LoginSubmitButton } from "./LoginSubmitButton";
import { redirect } from "next/navigation";

export default async function LoginPage({
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

  async function handleLogin(formData: FormData) {
    "use server";

    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    if (!email || !email.includes("@")) {
      redirect("/login?error=Please%20enter%20a%20valid%20email");
    }

    let existingUser: Awaited<ReturnType<typeof getAppUserByEmail>>;
    try {
      existingUser = await getAppUserByEmail(email);
    } catch {
      redirect("/login?error=Unable%20to%20login%2C%20please%20try%20again");
    }

    if (!existingUser) {
      redirect("/login?error=Account%20not%20found.%20Please%20register%20first");
    }

    await setSessionUserEmail(email);
    redirect("/overview");
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[36vh] bg-linear-to-r from-[#7e86e8] via-[#9198ef] to-[#7e86e8]" />
      <div className="pointer-events-none absolute -right-12 top-10 h-56 w-56 rounded-full bg-white/25 blur-3xl" />
      <div className="pointer-events-none absolute -left-10 bottom-8 h-52 w-52 rounded-full bg-violet-200/40 blur-3xl dark:bg-violet-500/20" />

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/55 bg-card/82 p-6 shadow-[0_35px_65px_-38px_rgba(78,86,160,0.95)] ring-1 ring-white/65 backdrop-blur-xl animate-lift-in dark:ring-white/10">
        <h1 className="text-2xl font-bold mb-1">Login</h1>
        <p className="text-sm text-muted-foreground mb-5">
          Masuk dulu untuk membuka dashboard Chronos Wealth.
        </p>

        {errorMessage && (
          <div className="rounded-2xl border border-rose-200/80 bg-rose-100/70 text-rose-700 px-3 py-2 text-sm mb-4 backdrop-blur-md dark:bg-rose-900/35 dark:text-rose-200">
            {errorMessage}
          </div>
        )}

        <form action={handleLogin} className="space-y-3">
          <label htmlFor="login-email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            className="w-full rounded-2xl border border-input bg-white/70 dark:bg-slate-900/35 px-3 py-2"
          />

          <LoginSubmitButton />
        </form>

        <p className="text-sm text-muted-foreground mt-4 text-center">
          Belum punya akun?{" "}
          <a href="/register" className="text-indigo-600 hover:text-indigo-700 font-medium">
            Daftar di sini
          </a>
        </p>
      </div>
    </div>
  );
}
