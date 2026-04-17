import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { attachments, conversations, messages } from "@/db/schema";

export async function getConversationList(userId: string) {
  return db
    .select({
      id: conversations.id,
      title: conversations.title,
      createdAt: conversations.createdAt,
      updatedAt: conversations.updatedAt,
    })
    .from(conversations)
    .where(eq(conversations.userId, userId))
    .orderBy(desc(conversations.updatedAt));
}

export async function getConversationDetail(conversationId: string, userId: string) {
  if (!conversationId || !userId) {
    return null;
  }

  try {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.id, conversationId), eq(conversations.userId, userId)));

    if (!conversation) {
      return null;
    }

    const conversationMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.createdAt));

    const messageIds = conversationMessages.map((message) => message.id);
    const messageAttachments = messageIds.length
      ? await db
          .select()
          .from(attachments)
          .where(inArray(attachments.messageId, messageIds))
      : [];

    const attachmentsByMessageId = new Map<string, typeof messageAttachments>();

    for (const attachment of messageAttachments) {
      const current = attachmentsByMessageId.get(attachment.messageId) ?? [];
      current.push(attachment);
      attachmentsByMessageId.set(attachment.messageId, current);
    }

    return {
      conversation,
      messages: conversationMessages.map((message) => ({
        ...message,
        attachments:
          Array.isArray(message.attachments) && message.attachments.length > 0
            ? message.attachments
            : (attachmentsByMessageId.get(message.id) ?? []).map((attachment) => ({
                id: attachment.id,
                fileName: attachment.fileName,
                fileType: attachment.fileType,
                fileSize: attachment.fileSize,
                storagePath: attachment.storagePath,
                publicUrl: attachment.storagePath,
              })),
      })),
    };
  } catch (error) {
    console.error("Failed to load conversation detail", { conversationId, userId, error });
    return null;
  }
}
