import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { conversations } from "@/db/schema";
import { getAuthSession } from "@/lib/auth";
import { getConversationList } from "@/lib/conversations";
import { createConversationSchema } from "@/lib/validators";

export async function GET() {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await getConversationList(session.user.id);
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = createConversationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Data percakapan tidak valid" }, { status: 400 });
  }

  const now = new Date();
  const id = randomUUID();

  await db.insert(conversations).values({
    id,
    userId: session.user.id,
    title: parsed.data.title?.trim() || "Chat Baru",
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({ id }, { status: 201 });
}
