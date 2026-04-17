import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getAuthSession } from "@/lib/auth";
import { persistUpload } from "@/lib/files";

export const runtime = "nodejs";

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

export async function POST(request: Request) {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Foto profil harus berupa gambar." }, { status: 400 });
  }

  if (file.size > MAX_AVATAR_SIZE) {
    return NextResponse.json({ error: "Ukuran foto profil maksimal 5MB." }, { status: 400 });
  }

  try {
    const uploaded = await persistUpload(file);

    await db
      .update(users)
      .set({
        avatarUrl: uploaded.publicUrl,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id));

    return NextResponse.json({
      ok: true,
      avatarUrl: uploaded.publicUrl,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload foto profil gagal" },
      { status: 400 },
    );
  }
}
