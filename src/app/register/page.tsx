import { ensureAppUserByEmail, getAppUserByEmail } from "@/actions/collaboration";
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

    try {
      const existingUser = await getAppUserByEmail(email);
      if (existingUser) {
        redirect("/register?error=Email%20already%20registered.%20Please%20login");
      }

      await ensureAppUserByEmail({
        email,
        displayName,
      });

      await setSessionUserEmail(email);
      redirect("/overview");
    } catch {
      redirect("/register?error=Unable%20to%20register.%20Please%20try%20again");
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <h1 className="text-2xl font-bold mb-1">Register</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
          Buat akun baru untuk mengakses dashboard Chronos Wealth.
        </p>

        {errorMessage && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 text-rose-700 px-3 py-2 text-sm mb-4">
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
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black/50 px-3 py-2"
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
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black/50 px-3 py-2"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700"
          >
            Daftar
          </button>
        </form>

        <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 text-center">
          Harga booth dasar simulasi bisa dipilih nanti di halaman Assets.
        </p>

        <p className="text-sm text-slate-500 dark:text-slate-400 mt-4 text-center">
          Sudah punya akun?{" "}
          <a href="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
            Login di sini
          </a>
        </p>
      </div>
    </div>
  );
}
