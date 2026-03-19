import { redirect } from "next/navigation";
import { getSessionUserEmail } from "@/lib/auth-session";

export default async function Home() {
  const sessionEmail = await getSessionUserEmail();
  redirect(sessionEmail ? "/overview" : "/login");
}
