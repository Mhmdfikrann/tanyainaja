import { createHash, randomInt } from "node:crypto";
import { env } from "@/lib/env";

const MIN_PHONE_LENGTH = 10;
const MAX_PHONE_LENGTH = 15;

export function normalizePhone(raw: string) {
  const digits = raw.replace(/\D+/g, "");

  if (!digits) {
    throw new Error("Nomor WhatsApp wajib diisi");
  }

  let normalized = digits;

  if (normalized.startsWith("0")) {
    normalized = `62${normalized.slice(1)}`;
  }

  if (!normalized.startsWith("62")) {
    throw new Error("Gunakan nomor WhatsApp Indonesia yang valid (contoh: 628123456789)");
  }

  if (normalized.length < MIN_PHONE_LENGTH || normalized.length > MAX_PHONE_LENGTH) {
    throw new Error("Format nomor WhatsApp tidak valid");
  }

  return normalized;
}

export function generateOtpCode() {
  return `${randomInt(0, 1_000_000)}`.padStart(6, "0");
}

export function hashOtpCode(otpSessionId: string, code: string) {
  const secret = env.nextAuthSecret || "tanyainaja-otp-secret";
  return createHash("sha256").update(`${otpSessionId}:${code}:${secret}`).digest("hex");
}

export function maskPhone(phone: string) {
  if (phone.length < 6) {
    return phone;
  }

  const head = phone.slice(0, 4);
  const tail = phone.slice(-3);
  return `${head}${"*".repeat(Math.max(phone.length - 7, 3))}${tail}`;
}

export function otpPolicy() {
  const ttlSec = Number.isFinite(env.authOtpCodeTtlSec) ? Math.max(60, env.authOtpCodeTtlSec) : 300;
  const resendCooldownSec = Number.isFinite(env.authOtpResendCooldownSec)
    ? Math.max(20, env.authOtpResendCooldownSec)
    : 60;
  const maxAttempts = Number.isFinite(env.authOtpMaxAttempts) ? Math.max(3, env.authOtpMaxAttempts) : 5;

  return {
    ttlSec,
    resendCooldownSec,
    maxAttempts,
  };
}
