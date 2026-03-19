import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "chronos_session_email";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export async function getSessionUserEmail() {
  const store = await cookies();
  const value = store.get(SESSION_COOKIE_NAME)?.value?.trim().toLowerCase();
  return value || null;
}

export async function setSessionUserEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const store = await cookies();

  store.set(SESSION_COOKIE_NAME, normalizedEmail, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearSessionUserEmail() {
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
}
