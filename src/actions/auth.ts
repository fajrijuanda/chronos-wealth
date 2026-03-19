"use server";

import { clearSessionUserEmail } from "@/lib/auth-session";
import { redirect } from "next/navigation";

export async function logoutAction() {
  await clearSessionUserEmail();
  redirect("/login");
}
