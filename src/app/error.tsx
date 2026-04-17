"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md rounded-[2rem] border border-[color:var(--color-border)] bg-white p-8 text-center shadow-xl">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-[color:var(--color-primary)]">Terjadi masalah</p>
        <h1 className="mt-3 text-3xl font-semibold">Aplikasi mengalami error tak terduga</h1>
        <p className="mt-3 text-sm leading-7 text-[color:var(--color-muted-foreground)]">
          Muat ulang halaman atau coba lagi. Jika tetap gagal, cek konfigurasi environment dan database.
        </p>
        <Button className="mt-6" onClick={() => reset()}>
          Coba Lagi
        </Button>
      </div>
    </div>
  );
}
