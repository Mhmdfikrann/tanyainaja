"use client";

import { useRouter } from "next/navigation";
import { signIn, signOut } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";

export function SuperadminLoginForm({
  hasUserSession,
}: {
  hasUserSession: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    try {
      const result = await signIn("superadmin", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Email atau password superadmin tidak valid.");
        return;
      }

      router.push("/superadmin");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login superadmin gagal");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogoutCurrentUser() {
    setLoggingOut(true);

    try {
      await signOut({ callbackUrl: "/superadmin" });
    } catch (error) {
      setLoggingOut(false);
      toast.error(error instanceof Error ? error.message : "Logout gagal");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[color:var(--color-background)] px-4 py-10">
      <Card className="w-full max-w-md p-8">
        <div className="mb-8 space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-[color:var(--color-primary)]">Superadmin</p>
          <h1 className="text-3xl font-semibold">Masuk ke dashboard</h1>
          <p className="text-sm text-[color:var(--color-muted-foreground)]">
            Gunakan akun superadmin untuk melihat statistik global token, request, total user, dan ranking penggunaan.
          </p>
        </div>

        {hasUserSession ? (
          <div className="mb-4 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-muted)] px-4 py-3 text-sm text-[color:var(--color-muted-foreground)]">
            Saat ini ada session user biasa yang aktif. Kamu bisa langsung login superadmin, atau logout dulu kalau mau bersih.
          </div>
        ) : null}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <FormField label="Email">
            <Input
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="superadmin@email.com"
              type="email"
              value={email}
            />
          </FormField>

          <FormField label="Password">
            <Input
              autoComplete="current-password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password superadmin"
              type="password"
              value={password}
            />
          </FormField>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button className="flex-1" disabled={submitting || loggingOut} type="submit">
              {submitting ? "Memproses..." : "Masuk Superadmin"}
            </Button>
            {hasUserSession ? (
              <Button
                disabled={submitting || loggingOut}
                onClick={() => void handleLogoutCurrentUser()}
                type="button"
                variant="outline"
              >
                {loggingOut ? "Keluar..." : "Logout User"}
              </Button>
            ) : null}
          </div>
        </form>
      </Card>
    </main>
  );
}
