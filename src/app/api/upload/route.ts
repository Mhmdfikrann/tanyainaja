import { NextResponse } from "next/server";
import { db } from "@/db";
import { attachments } from "@/db/schema";
import { getAuthSession } from "@/lib/auth";
import { getConversationDetail } from "@/lib/conversations";
import { persistUpload } from "@/lib/files";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const conversationId = formData.get("conversationId");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
  }

  if (typeof conversationId !== "string") {
    return NextResponse.json({ error: "ID percakapan wajib dikirim saat upload" }, { status: 400 });
  }

  try {
    const detail = await getConversationDetail(conversationId, session.user.id);

    if (!detail) {
      return NextResponse.json({ error: "Percakapan tidak ditemukan" }, { status: 404 });
    }

    const uploaded = await persistUpload(file);

    await db.insert(attachments).values({
      id: uploaded.id,
      messageId: uploaded.id,
      fileName: uploaded.fileName,
      fileType: uploaded.fileType,
      fileSize: uploaded.fileSize,
      storagePath: uploaded.storagePath,
      createdAt: new Date(),
    });

    return NextResponse.json(uploaded, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload gagal" },
      { status: 400 },
    );
  }
}
