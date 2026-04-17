import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { and, eq, inArray } from "drizzle-orm";
import type { ModelMessage } from "ai";
import type { UserContent } from "@ai-sdk/provider-utils";
import { db } from "@/db";
import { attachments, conversations, messages, type ConversationAttachment } from "@/db/schema";
import { ensureConversationOwnership, getAuthSession } from "@/lib/auth";
import { env } from "@/lib/env";
import { generateConversationTitle } from "@/lib/utils";
import { chatSchema } from "@/lib/validators";

export const runtime = "nodejs";

const IMAGE_TYPES = new Set(["image/png", "image/jpg", "image/jpeg", "image/webp"]);

const openai = createOpenAI({
  apiKey: env.aiApiKey,
  baseURL: env.aiBaseUrl,
  name: "tanyainaja",
});

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(request: Request) {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    return jsonError("Unauthorized", 401);
  }

  if (!env.aiApiKey) {
    return jsonError("AI provider belum dikonfigurasi", 500);
  }

  const body = await request.json();
  const parsed = chatSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Payload tidak valid", 400);
  }

  const ownership = await ensureConversationOwnership(parsed.data.conversationId, session.user.id);

  if (!ownership) {
    return jsonError("Percakapan tidak ditemukan", 404);
  }

  const previousMessages = await db
    .select({ role: messages.role, content: messages.content })
    .from(messages)
    .where(eq(messages.conversationId, parsed.data.conversationId));

  const modelMessages: ModelMessage[] = previousMessages.map((message) =>
    message.role === "assistant"
      ? {
          role: "assistant",
          content: [{ type: "text", text: message.content }],
        }
      : {
          role: "user",
          content: [{ type: "text", text: message.content }],
        },
  );

  const attachmentContext = parsed.data.attachments.length
    ? `\n\nLampiran pengguna:\n${parsed.data.attachments
        .map(
          (file, index) =>
            `${index + 1}. ${file.fileName} (${file.fileType}, ${file.fileSize} bytes) tersimpan di ${file.storagePath}`,
        )
        .join("\n")}`
    : "";

  const imageAttachments = parsed.data.attachments.filter((attachment) => IMAGE_TYPES.has(attachment.fileType));
  const nonImageAttachments = parsed.data.attachments.filter((attachment) => !IMAGE_TYPES.has(attachment.fileType));

  const canUseVision = imageAttachments.length > 0 && env.aiSupportsVision;

  const userContent: UserContent = [{
    type: "text",
    text: `${parsed.data.content}${nonImageAttachments.length ? `\n\nLampiran non-gambar:\n${nonImageAttachments.map((file, index) => `${index + 1}. ${file.fileName} (${file.fileType}, ${file.fileSize} bytes) tersimpan di ${file.storagePath}`).join("\n")}` : ""}${imageAttachments.length > 0 && !canUseVision ? `\n\nLampiran gambar terdeteksi: ${imageAttachments.map((file) => file.fileName).join(", ")}. Model AI saat ini (${env.aiModel}) tidak mendukung pembacaan gambar langsung, jadi jawablah hanya berdasarkan teks pengguna dan beri tahu bahwa analisis visual belum tersedia pada model aktif.` : attachmentContext && imageAttachments.length === 0 ? attachmentContext : ""}`,
  }];

  for (const attachment of canUseVision ? imageAttachments : []) {
    const filePath = path.join(process.cwd(), "public", attachment.storagePath.replace(/^\//, ""));
    let fileBuffer: Buffer;

    try {
      fileBuffer = await readFile(filePath);
    } catch {
      return jsonError(`File gambar ${attachment.fileName} tidak ditemukan di server. Upload ulang file lalu coba lagi.`, 400);
    }

    userContent.push({
      type: "image",
      image: fileBuffer,
      mediaType: attachment.fileType === "image/jpg" ? "image/jpeg" : attachment.fileType,
    });
  }

  const userMessageId = randomUUID();
  const assistantMessageId = randomUUID();
  const now = new Date();

  await db.insert(messages).values({
    id: userMessageId,
    conversationId: parsed.data.conversationId,
    role: "user",
    content: parsed.data.content,
    attachments: parsed.data.attachments as ConversationAttachment[],
    createdAt: now,
  });

  const uploadedAttachmentIds = parsed.data.attachments
    .map((attachment) => attachment.id)
    .filter((attachmentId): attachmentId is string => Boolean(attachmentId));

  if (uploadedAttachmentIds.length > 0) {
    await db
      .update(attachments)
      .set({ messageId: userMessageId })
      .where(inArray(attachments.id, uploadedAttachmentIds));
  }

  const title = generateConversationTitle(parsed.data.content);
  await db
    .update(conversations)
    .set({ title, updatedAt: now })
    .where(and(eq(conversations.id, parsed.data.conversationId), eq(conversations.userId, session.user.id)));

  try {
    const stream = streamText({
      model: openai(env.aiModel),
      system:
        "Kamu adalah asisten AI TanyainAja. Jawab dalam Bahasa Indonesia secara jelas, ringkas, dan gunakan Markdown bila membantu.",
      messages: [
        ...modelMessages,
        {
          role: "user",
          content: userContent,
        },
      ],
      onFinish: async ({ text }) => {
        await db.insert(messages).values({
          id: assistantMessageId,
          conversationId: parsed.data.conversationId,
          role: "assistant",
          content: text,
          attachments: [],
          createdAt: new Date(),
        });

        await db
          .update(conversations)
          .set({ updatedAt: new Date() })
          .where(and(eq(conversations.id, parsed.data.conversationId), eq(conversations.userId, session.user.id)));
      },
    });

    return stream.toTextStreamResponse({
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal memproses chat";

    if (imageAttachments.length > 0 && /does not support image input/i.test(message)) {
      return jsonError(
        `Model AI saat ini (${env.aiModel}) tidak mendukung input gambar. Lampiran gambar tidak dianalisis. Aktifkan AI_SUPPORTS_VISION=true hanya jika model endpoint kamu benar-benar vision-compatible.`,
        400,
      );
    }

    return jsonError(message, 500);
  }
}
