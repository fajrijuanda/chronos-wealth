import { getSessionUserEmail } from "@/lib/auth-session";

export async function getActiveUserEmail(candidate?: string) {
  const fromQuery = candidate?.trim().toLowerCase();
  if (fromQuery) return fromQuery;

  const fromSession = await getSessionUserEmail();
  if (fromSession) return fromSession;

  const fromEnv = process.env.DEMO_USER_EMAIL?.trim().toLowerCase();
  if (fromEnv) return fromEnv;

  return "owner@chronos.local";
}
