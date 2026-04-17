import { compare, hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getAuthSession } from "@/lib/auth";
import { profileSchema } from "@/lib/validators";

export async function PATCH(request: Request) {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = profileSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Data tidak valid" }, { status: 400 });
  }

  const [user] = await db.select().from(users).where(eq(users.id, session.user.id));

  if (!user) {
    return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
  }

  let passwordHash = user.passwordHash ?? null;

  if (parsed.data.newPassword) {
    if (!user.passwordHash) {
      return NextResponse.json({ error: "Akun Anda login via WhatsApp OTP dan belum memiliki password." }, { status: 400 });
    }

    const matches = await compare(parsed.data.currentPassword ?? "", user.passwordHash);

    if (!matches) {
      return NextResponse.json({ error: "Password lama tidak sesuai" }, { status: 400 });
    }

    passwordHash = await hash(parsed.data.newPassword, 10);
  }

  await db
    .update(users)
    .set({
      name: parsed.data.name ?? user.name,
      passwordHash,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  return NextResponse.json({ ok: true });
}
