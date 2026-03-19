import { getAppUserByEmail } from "@/actions/collaboration";
import { getSessionUserEmail, setSessionUserEmail } from "@/lib/auth-session";
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

    try {
      const existingUser = await getAppUserByEmail(email);
      if (!existingUser) {
        redirect("/login?error=Account%20not%20found.%20Please%20register%20first");
      }

      await setSessionUserEmail(email);
      redirect("/overview");
    } catch {
      redirect("/login?error=Unable%20to%20login%2C%20please%20try%20again");
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <h1 className="text-2xl font-bold mb-1">Login</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
          Masuk dulu untuk membuka dashboard Chronos Wealth.
        </p>

        {errorMessage && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 text-rose-700 px-3 py-2 text-sm mb-4">
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
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black/50 px-3 py-2"
          />

          <button
            type="submit"
            className="w-full rounded-xl px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700"
          >
            Masuk
          </button>
        </form>

        <p className="text-sm text-slate-500 dark:text-slate-400 mt-4 text-center">
          Belum punya akun?{" "}
          <a href="/register" className="text-indigo-600 hover:text-indigo-700 font-medium">
            Daftar di sini
          </a>
        </p>
      </div>
    </div>
  );
}
