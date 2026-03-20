import { getSessionUserEmail } from "@/lib/auth-session";

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function getConfiguredSuperAdminEmails() {
  return (process.env.SUPERADMIN_EMAILS ?? "")
    .split(/[;,]/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export function isSuperAdminEmail(email?: string | null) {
  if (!email) return false;
  const normalized = normalizeEmail(email);
  return getConfiguredSuperAdminEmails().includes(normalized);
}

export async function getActiveUserEmail(candidate?: string) {
  const fromSession = await getSessionUserEmail();
  const fromQuery = candidate?.trim().toLowerCase();

  if (fromSession) {
    if (fromQuery && fromQuery !== fromSession && isSuperAdminEmail(fromSession)) {
      return fromQuery;
    }
    return fromSession;
  }

  const fromEnv = process.env.DEMO_USER_EMAIL?.trim().toLowerCase();
  if (fromEnv) return fromEnv;

  return "owner@chronos.local";
}
