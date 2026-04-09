import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth/session";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const cookieStore = await cookies();
  const token       = cookieStore.get("session")?.value;

  if (token && verifySession(token)) {
    redirect("/admin/events");
  }

  return <LoginForm />;
}
