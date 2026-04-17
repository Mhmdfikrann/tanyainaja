import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/auth-form";
import { getAuthSession } from "@/lib/auth";

export default async function RegisterPage() {
  const session = await getAuthSession();

  if (session?.user?.id) {
    redirect("/chat");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <RegisterForm />
    </main>
  );
}
