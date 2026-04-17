import { hash } from "bcryptjs";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { registerSchema } from "@/lib/validators";

const PASSWORD_HASH_ROUNDS = 6;

function resolveRegisterError(error: unknown) {
  const cause =
    typeof error === "object" && error !== null && "cause" in error ? (error as { cause?: unknown }).cause : undefined;

  const causeCode =
    typeof cause === "object" && cause !== null && "code" in cause ? String((cause as { code?: unknown }).code) : "";

  if (causeCode.toUpperCase() === "ETIMEDOUT") {
    return {
      status: 503,
      message: "Koneksi database timeout. Coba restart server dev dan cek DATABASE_URL.",
    };
  }

  return {
    status: 500,
    message: "Terjadi masalah saat memproses registrasi.",
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Data tidak valid" }, { status: 400 });
    }

    const [existingUser] = await db.select({ id: users.id }).from(users).where(eq(users.email, parsed.data.email));

    if (existingUser) {
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 409 });
    }

    const now = new Date();
    const passwordHash = await hash(parsed.data.password, PASSWORD_HASH_ROUNDS);

    await db.insert(users).values({
      id: randomUUID(),
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Register route failed:", error);

    const resolved = resolveRegisterError(error);
    return NextResponse.json({ error: resolved.message }, { status: resolved.status });
  }
}
