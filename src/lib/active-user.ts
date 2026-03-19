export function getActiveUserEmail(candidate?: string) {
  const fromQuery = candidate?.trim().toLowerCase();
  if (fromQuery) return fromQuery;

  const fromEnv = process.env.DEMO_USER_EMAIL?.trim().toLowerCase();
  if (fromEnv) return fromEnv;

  return "owner@chronos.local";
}
