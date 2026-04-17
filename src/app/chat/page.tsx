import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";
import { db } from "@/db";
import { conversations as conversationsTable } from "@/db/schema";
import { getConversationList } from "@/lib/conversations";
import { getAuthSession } from "@/lib/auth";

export default async function ChatIndexPage() {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const conversations = await getConversationList(session.user.id);

  if (conversations[0]) {
    redirect(`/chat/${conversations[0].id}`);
  }

  const now = new Date();
  const id = randomUUID();

  await db.insert(conversationsTable).values({
    id,
    userId: session.user.id,
    title: "Chat Baru",
    createdAt: now,
    updatedAt: now,
  });

  redirect(`/chat/${id}`);
}
