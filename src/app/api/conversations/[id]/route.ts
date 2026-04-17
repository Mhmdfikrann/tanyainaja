import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { attachments, conversations, messages } from "@/db/schema";
import { getAuthSession } from "@/lib/auth";
import { getConversationDetail } from "@/lib/conversations";

export async function GET(_request: Request, ctx: RouteContext<"/api/conversations/[id]">) {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const data = await getConversationDetail(id, session.user.id);

  if (!data) {
    return NextResponse.json({ error: "Percakapan tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/conversations/[id]">) {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const detail = await getConversationDetail(id, session.user.id);

  if (!detail) {
    return NextResponse.json({ error: "Percakapan tidak ditemukan" }, { status: 404 });
  }

  const messageIds = detail.messages.map((message) => message.id);

  if (messageIds.length > 0) {
    for (const messageId of messageIds) {
      await db.delete(attachments).where(eq(attachments.messageId, messageId));
    }

    await db.delete(messages).where(eq(messages.conversationId, id));
  }

  await db.delete(conversations).where(and(eq(conversations.id, id), eq(conversations.userId, session.user.id)));

  return NextResponse.json({ ok: true });
}
