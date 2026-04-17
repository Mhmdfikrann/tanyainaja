"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { profileSchema } from "@/lib/validators";
import type { z } from "zod";

type ProfileValues = z.infer<typeof profileSchema>;

export function ProfileForm({ defaultName }: { defaultName: string }) {
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: defaultName,
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  async function onSubmit(values: ProfileValues) {
    setSaving(true);
    const response = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const payload = await response.json();
    setSaving(false);

    if (!response.ok) {
      toast.error(payload.error ?? "Gagal menyimpan profil");
      return;
    }

    toast.success("Profil berhasil diperbarui");
    form.reset({
      name: values.name,
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    });
  }

  async function handleLogout() {
    setLoggingOut(true);

    try {
      await signOut({ callbackUrl: "/login" });
    } catch (error) {
      setLoggingOut(false);
      toast.error(error instanceof Error ? error.message : "Logout gagal");
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6">
      <Card className="p-6 text-[color:var(--color-foreground)] sm:p-8">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-[color:var(--color-primary)]">Profil</p>
          <h1 className="mt-2 text-3xl font-semibold">Pengaturan akun</h1>
          <p className="mt-2 text-sm leading-7 text-[color:var(--color-muted-foreground)]">
            Perbarui nama tampilan atau ganti password akun TanyainAja Anda.
          </p>
        </div>

        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField label="Nama Tampilan" error={form.formState.errors.name?.message}>
            <Input {...form.register("name")} placeholder="Nama tampilan" />
          </FormField>

          <FormField label="Password Lama" error={form.formState.errors.currentPassword?.message}>
            <Input {...form.register("currentPassword")} placeholder="Kosongkan jika tidak ganti password" type="password" />
          </FormField>

          <FormField label="Password Baru" error={form.formState.errors.newPassword?.message}>
            <Input {...form.register("newPassword")} placeholder="Minimal 8 karakter" type="password" />
          </FormField>

          <FormField label="Konfirmasi Password Baru" error={form.formState.errors.confirmNewPassword?.message}>
            <Input {...form.register("confirmNewPassword")} placeholder="Ulangi password baru" type="password" />
          </FormField>

          <div className="flex flex-wrap gap-3">
            <Button disabled={saving || loggingOut} type="submit">
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
            <Button disabled={saving || loggingOut} onClick={() => void handleLogout()} type="button" variant="outline">
              {loggingOut ? "Keluar..." : "Logout"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
