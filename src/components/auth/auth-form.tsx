"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";

type OtpRequestResponse = {
  otpSessionId: string;
  expiresInSec: number;
  resendCooldownSec: number;
  phoneMasked: string;
};

function WhatsAppOtpForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otpSessionId, setOtpSessionId] = useState("");
  const [phoneMasked, setPhoneMasked] = useState("");
  const [code, setCode] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [step, setStep] = useState<"phone" | "verify">("phone");

  useEffect(() => {
    if (resendCountdown <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setResendCountdown((current) => (current > 0 ? current - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [resendCountdown]);

  async function requestOtpCode() {
    if (mode === "register" && name.trim().length < 2) {
      toast.error("Nama minimal 2 karakter");
      return;
    }

    if (!phone.trim()) {
      toast.error("Nomor WhatsApp wajib diisi");
      return;
    }

    setRequesting(true);

    try {
      const response = await fetch("/api/auth/wa/request-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone }),
      });

      const payload = (await response.json()) as Partial<OtpRequestResponse> & { error?: string };

      if (!response.ok) {
        toast.error(payload.error ?? "Gagal mengirim OTP");
        return;
      }

      if (!payload.otpSessionId) {
        toast.error("Sesi OTP tidak valid. Coba lagi.");
        return;
      }

      setOtpSessionId(payload.otpSessionId);
      setPhoneMasked(payload.phoneMasked ?? phone);
      setCode("");
      setStep("verify");
      setResendCountdown(payload.resendCooldownSec ?? 60);
      toast.success("Kode OTP berhasil dikirim ke WhatsApp");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengirim OTP");
    } finally {
      setRequesting(false);
    }
  }

  async function verifyOtpCode() {
    if (!otpSessionId) {
      toast.error("Sesi OTP tidak ditemukan. Kirim ulang kode.");
      setStep("phone");
      return;
    }

    if (!/^\d{6}$/.test(code.trim())) {
      toast.error("Kode OTP harus 6 digit");
      return;
    }

    setVerifying(true);

    try {
      const result = await signIn("wa-otp", {
        otpSessionId,
        code: code.trim(),
        name: mode === "register" ? name.trim() : undefined,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Kode OTP salah atau sudah kedaluwarsa.");
        return;
      }

      router.push("/chat");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Verifikasi OTP gagal");
    } finally {
      setVerifying(false);
    }
  }

  const title = mode === "login" ? "Masuk dengan WhatsApp" : "Daftar dengan WhatsApp";
  const action = mode === "login" ? "Masuk" : "Daftar";

  return (
    <Card className="w-full max-w-md p-8">
      <div className="mb-8 space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-[color:var(--color-primary)]">
          {mode === "login" ? "Masuk" : "Daftar"}
        </p>
        <h1 className="text-3xl font-semibold">{title}</h1>
        <p className="text-sm text-[color:var(--color-muted-foreground)]">
          Masukkan nomor WhatsApp aktif. Kami kirim kode OTP untuk verifikasi akun kamu.
        </p>
      </div>

      {step === "phone" ? (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void requestOtpCode();
          }}
        >
          {mode === "register" ? (
            <FormField label="Nama">
              <Input
                autoComplete="name"
                onChange={(event) => setName(event.target.value)}
                placeholder="Nama tampilan"
                value={name}
              />
            </FormField>
          ) : null}

          <FormField label="Nomor WhatsApp">
            <Input
              autoComplete="tel"
              inputMode="numeric"
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Contoh: 628123456789"
              value={phone}
            />
          </FormField>

          <Button className="w-full" disabled={requesting} type="submit">
            {requesting ? "Mengirim OTP..." : `Kirim Kode & ${action}`}
          </Button>
        </form>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void verifyOtpCode();
          }}
        >
          <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-muted)] px-4 py-3 text-sm text-[color:var(--color-muted-foreground)]">
            OTP dikirim ke <span className="font-semibold text-[color:var(--color-foreground)]">{phoneMasked}</span>
          </div>

          {mode === "register" ? (
            <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-muted)] px-4 py-3 text-sm text-[color:var(--color-muted-foreground)]">
              Nama akun: <span className="font-semibold text-[color:var(--color-foreground)]">{name || "-"}</span>
            </div>
          ) : null}

          <FormField label="Kode OTP (6 digit)">
            <Input
              inputMode="numeric"
              maxLength={6}
              onChange={(event) => setCode(event.target.value.replace(/\D+/g, ""))}
              placeholder="123456"
              value={code}
            />
          </FormField>

          <Button className="w-full" disabled={verifying} type="submit">
            {verifying ? "Memverifikasi..." : "Verifikasi Kode"}
          </Button>

          <div className="flex items-center justify-between text-sm">
            <button
              className="font-medium text-[color:var(--color-primary)] disabled:opacity-60"
              disabled={requesting || resendCountdown > 0}
              onClick={() => void requestOtpCode()}
              type="button"
            >
              {resendCountdown > 0 ? `Kirim ulang dalam ${resendCountdown}s` : "Kirim ulang kode"}
            </button>
            <button
              className="text-[color:var(--color-muted-foreground)] hover:text-[color:var(--color-foreground)]"
              onClick={() => setStep("phone")}
              type="button"
            >
              Ganti nomor
            </button>
          </div>
        </form>
      )}

      <p className="mt-6 text-sm text-[color:var(--color-muted-foreground)]">
        {mode === "login" ? "Belum punya akun?" : "Sudah punya akun?"}{" "}
        <Link className="font-semibold text-[color:var(--color-primary)]" href={mode === "login" ? "/register" : "/login"}>
          {mode === "login" ? "Daftar sekarang" : "Login"}
        </Link>
      </p>
    </Card>
  );
}

export function LoginForm() {
  return <WhatsAppOtpForm mode="login" />;
}

export function RegisterForm() {
  return <WhatsAppOtpForm mode="register" />;
}
