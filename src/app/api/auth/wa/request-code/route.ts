import { randomUUID } from "node:crypto";
import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { authOtpCodes } from "@/db/schema";
import { env } from "@/lib/env";
import { requestOtpSchema } from "@/lib/validators";
import { generateOtpCode, hashOtpCode, maskPhone, normalizePhone, otpPolicy } from "@/lib/wa-auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = requestOtpSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Data tidak valid" }, { status: 400 });
  }

  if (!env.authOtpWebhookUrl) {
    return NextResponse.json(
      { error: "Webhook OTP belum dikonfigurasi. Tambahkan AUTH_OTP_WEBHOOK_URL di server." },
      { status: 503 },
    );
  }

  let phone = "";

  try {
    phone = normalizePhone(parsed.data.phone);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Nomor tidak valid" }, { status: 400 });
  }

  const now = new Date();
  const policy = otpPolicy();
  const cooldownStart = new Date(now.getTime() - policy.resendCooldownSec * 1000);

  const [recentCode] = await db
    .select({
      id: authOtpCodes.id,
      createdAt: authOtpCodes.createdAt,
    })
    .from(authOtpCodes)
    .where(and(eq(authOtpCodes.phone, phone), isNull(authOtpCodes.consumedAt), gt(authOtpCodes.createdAt, cooldownStart)))
    .orderBy(desc(authOtpCodes.createdAt))
    .limit(1);

  if (recentCode?.createdAt) {
    const retryAfterSec = Math.max(
      1,
      policy.resendCooldownSec - Math.floor((now.getTime() - recentCode.createdAt.getTime()) / 1000),
    );

    return NextResponse.json(
      { error: `Tunggu ${retryAfterSec} detik sebelum minta kode lagi.` },
      {
        status: 429,
        headers: {
          "Retry-After": `${retryAfterSec}`,
        },
      },
    );
  }

  const otpSessionId = randomUUID();
  const code = generateOtpCode();
  const codeHash = hashOtpCode(otpSessionId, code);
  const expiresAt = new Date(now.getTime() + policy.ttlSec * 1000);

  await db
    .update(authOtpCodes)
    .set({
      consumedAt: now,
      updatedAt: now,
    })
    .where(and(eq(authOtpCodes.phone, phone), isNull(authOtpCodes.consumedAt)));

  await db.insert(authOtpCodes).values({
    id: otpSessionId,
    phone,
    codeHash,
    attempts: 0,
    expiresAt,
    createdAt: now,
    updatedAt: now,
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(env.authOtpWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(env.authOtpWebhookToken ? { Authorization: `Bearer ${env.authOtpWebhookToken}` } : {}),
      },
      body: JSON.stringify({
        event: "auth.otp.requested",
        channel: "whatsapp",
        phone,
        code,
        expires_in_sec: policy.ttlSec,
        locale: "id",
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const bodyText = (await response.text().catch(() => "")).trim();
      const usingTestWebhook = env.authOtpWebhookUrl.includes("/webhook-test/");
      const detailedMessage =
        response.status === 404 && usingTestWebhook
          ? "Webhook n8n test tidak aktif. Jalankan workflow di mode Test atau pakai URL production /webhook/..."
          : bodyText || `Webhook OTP mengembalikan status ${response.status}.`;

      await db
        .update(authOtpCodes)
        .set({
          consumedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(authOtpCodes.id, otpSessionId));

      return NextResponse.json({ error: detailedMessage }, { status: 502 });
    }
  } catch (error) {
    await db
      .update(authOtpCodes)
      .set({
        consumedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(authOtpCodes.id, otpSessionId));

    if (error instanceof DOMException && error.name === "AbortError") {
      return NextResponse.json({ error: "Kirim OTP timeout. Coba lagi sebentar." }, { status: 504 });
    }

    return NextResponse.json({ error: "Kirim OTP gagal. Coba lagi sebentar." }, { status: 502 });
  } finally {
    clearTimeout(timeoutId);
  }

  return NextResponse.json({
    ok: true,
    otpSessionId,
    expiresInSec: policy.ttlSec,
    resendCooldownSec: policy.resendCooldownSec,
    phoneMasked: maskPhone(phone),
  });
}
