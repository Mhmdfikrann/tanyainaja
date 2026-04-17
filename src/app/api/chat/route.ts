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
import { trackAiUsage } from "@/lib/usage";
import { generateConversationTitle } from "@/lib/utils";
import { chatSchema } from "@/lib/validators";

export const runtime = "nodejs";

const IMAGE_TYPES = new Set(["image/png", "image/jpg", "image/jpeg", "image/webp"]);

const openai = createOpenAI({
  apiKey: env.aiApiKey,
  baseURL: env.aiBaseUrl,
  name: "tanyainaja",
});

function buildSystemPrompt() {
  return `Kamu adalah asisten AI TanyainAja. Jawab dalam Bahasa Indonesia secara jelas, ringkas, dan gunakan Markdown bila membantu. Model aktif saat ini adalah ${env.aiModel}. Jika pengguna bertanya kamu memakai model AI apa, jawab secara jujur bahwa model aktif yang sedang digunakan adalah ${env.aiModel}. ${env.aiSupportsVision ? "Model aktif mendukung analisis gambar, jadi jika pengguna melampirkan gambar kamu harus membaca dan menganalisis konten visualnya." : "Model aktif tidak mendukung analisis gambar langsung."}`;
}

function toDataUrl(buffer: Buffer, mediaType: string) {
  return `data:${mediaType};base64,${buffer.toString("base64")}`;
}

function decodeDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;,]+)?(?:;(base64))?,([\s\S]+)$/i);

  if (!match) {
    return null;
  }

  const [, mediaType = "application/octet-stream", encoding, payload] = match;
  const buffer = encoding?.toLowerCase() === "base64"
    ? Buffer.from(payload, "base64")
    : Buffer.from(decodeURIComponent(payload), "utf8");

  return {
    buffer,
    mediaType: mediaType === "image/jpg" ? "image/jpeg" : mediaType,
  };
}

function getCompletionEndpoint() {
  return `${env.aiBaseUrl.replace(/\/$/, "")}/chat/completions`;
}

function extractDeltaText(content: unknown) {
  if (typeof content === "string") {
    return content;
  }

  if (!Array.isArray(content)) {
    return "";
  }

  return content
    .map((part) => {
      if (typeof part === "string") {
        return part;
      }

      if (part && typeof part === "object" && "text" in part && typeof part.text === "string") {
        return part.text;
      }

      return "";
    })
    .join("");
}

async function persistAssistantMessage({
  assistantMessageId,
  conversationId,
  text,
  userId,
}: {
  assistantMessageId: string;
  conversationId: string;
  text: string;
  userId: string;
}) {
  await db.insert(messages).values({
    id: assistantMessageId,
    conversationId,
    role: "assistant",
    content: text,
    attachments: [],
    createdAt: new Date(),
  });

  await db
    .update(conversations)
    .set({ updatedAt: new Date() })
    .where(and(eq(conversations.id, conversationId), eq(conversations.userId, userId)));
}

async function streamVisionCompletion({
  assistantMessageId,
  conversationId,
  imagePayloads,
  promptText,
  previousMessages,
  userId,
}: {
  assistantMessageId: string;
  conversationId: string;
  imagePayloads: Array<{ mediaType: string; buffer: Buffer }>;
  promptText: string;
  previousMessages: Array<{ role: "user" | "assistant"; content: string }>;
  userId: string;
}) {
  const upstream = await fetch(getCompletionEndpoint(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.aiApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: env.aiModel,
      stream: true,
      stream_options: {
        include_usage: true,
      },
      messages: [
        { role: "system", content: buildSystemPrompt() },
        ...previousMessages.map((message) => ({
          role: message.role,
          content: message.content || " ",
        })),
        {
          role: "user",
          content: [
            { type: "text", text: promptText },
            ...imagePayloads.map((image) => ({
              type: "image_url",
              image_url: {
                url: toDataUrl(image.buffer, image.mediaType),
              },
            })),
          ],
        },
      ],
    }),
  });

  if (!upstream.ok || !upstream.body) {
    const errorText = await upstream.text();
    throw new Error(errorText.trim() || "Provider AI gagal memproses gambar");
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let rawBuffer = "";
  let assistantText = "";
  let latestUsage = {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
  };

  return new Response(new ReadableStream({
    async start(controller) {
      const reader = upstream.body!.getReader();

      async function flushEventBlock(block: string) {
        const lines = block.split(/\r?\n/);

        for (const line of lines) {
          const trimmed = line.trim();

          if (!trimmed.startsWith("data:")) {
            continue;
          }

          const payload = trimmed.slice(5).trim();

          if (!payload || payload === "[DONE]") {
            continue;
          }

          try {
            const json = JSON.parse(payload) as {
              choices?: Array<{ delta?: { content?: unknown } }>;
              usage?: {
                prompt_tokens?: number;
                completion_tokens?: number;
                total_tokens?: number;
              };
            };

            if (json.usage) {
              latestUsage = {
                promptTokens: Number(json.usage.prompt_tokens ?? 0),
                completionTokens: Number(json.usage.completion_tokens ?? 0),
                totalTokens: Number(json.usage.total_tokens ?? 0),
              };
            }

            const deltaText = extractDeltaText(json.choices?.[0]?.delta?.content);

            if (!deltaText) {
              continue;
            }

            assistantText += deltaText;
            controller.enqueue(encoder.encode(deltaText));
          } catch {
            continue;
          }
        }
      }

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          rawBuffer += decoder.decode(value, { stream: true });

          while (true) {
            const separatorIndex = rawBuffer.indexOf("\n\n");

            if (separatorIndex === -1) {
              break;
            }

            const eventBlock = rawBuffer.slice(0, separatorIndex);
            rawBuffer = rawBuffer.slice(separatorIndex + 2);
            await flushEventBlock(eventBlock);
          }
        }

        if (rawBuffer.trim()) {
          await flushEventBlock(rawBuffer);
        }

        if (!assistantText.trim()) {
          assistantText = "Maaf, gambar belum berhasil saya baca. Coba kirim ulang gambar itu dengan pertanyaan yang sama.";
          controller.enqueue(encoder.encode(assistantText));
        }

        await persistAssistantMessage({
          assistantMessageId,
          conversationId,
          text: assistantText,
          userId,
        });
        await trackAiUsage({
          userId,
          conversationId,
          model: env.aiModel,
          promptTokens: latestUsage.promptTokens,
          completionTokens: latestUsage.completionTokens,
          totalTokens: latestUsage.totalTokens || latestUsage.promptTokens + latestUsage.completionTokens,
        });
        controller.close();
      } catch (error) {
        controller.error(error);
      } finally {
        reader.releaseLock();
      }
    },
  }), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Conversation-Id": conversationId,
    },
  });
}

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function getVisionMaxSizeMessage() {
  return `Ukuran gambar terlalu besar untuk dianalisis AI. Maksimal ${env.aiVisionMaxImageMb} MB per gambar.`;
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

  let conversationId = parsed.data.conversationId ?? null;

  if (conversationId) {
    const ownership = await ensureConversationOwnership(conversationId, session.user.id);

    if (!ownership) {
      return jsonError("Percakapan tidak ditemukan", 404);
    }
  } else {
    conversationId = randomUUID();
    const createdAt = new Date();

    await db.insert(conversations).values({
      id: conversationId,
      userId: session.user.id,
      title: "Chat Baru",
      createdAt,
      updatedAt: createdAt,
    });
  }

  const previousMessages = await db
    .select({ role: messages.role, content: messages.content })
    .from(messages)
    .where(eq(messages.conversationId, conversationId));

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

  if (imageAttachments.some((attachment) => attachment.fileSize > env.aiVisionMaxImageBytes)) {
    return jsonError(getVisionMaxSizeMessage(), 400);
  }

  const canUseVision = imageAttachments.length > 0 && env.aiSupportsVision;
  const normalizedContent = parsed.data.content.trim();
  const effectivePrompt = normalizedContent
    || (imageAttachments.length > 0
      ? "Tolong analisis gambar yang saya lampirkan dan jelaskan isinya dalam Bahasa Indonesia."
      : "Tolong bantu saya berdasarkan lampiran yang saya kirim.");

  const userContent: UserContent = [{
    type: "text",
    text: `${effectivePrompt}${nonImageAttachments.length ? `\n\nLampiran non-gambar:\n${nonImageAttachments.map((file, index) => `${index + 1}. ${file.fileName} (${file.fileType}, ${file.fileSize} bytes) tersimpan di ${file.storagePath}`).join("\n")}` : ""}${imageAttachments.length > 0 && !canUseVision ? `\n\nLampiran gambar terdeteksi: ${imageAttachments.map((file) => file.fileName).join(", ")}. Model AI saat ini (${env.aiModel}) tidak mendukung pembacaan gambar langsung, jadi jawablah hanya berdasarkan teks pengguna dan beri tahu bahwa analisis visual belum tersedia pada model aktif.` : attachmentContext && imageAttachments.length === 0 ? attachmentContext : ""}`,
  }];

  const userMessageId = randomUUID();
  const assistantMessageId = randomUUID();
  const now = new Date();

  await db.insert(messages).values({
    id: userMessageId,
    conversationId,
    role: "user",
    content: normalizedContent || effectivePrompt,
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

  const title = generateConversationTitle(normalizedContent || effectivePrompt);
  await db
    .update(conversations)
    .set({ title, updatedAt: now })
    .where(and(eq(conversations.id, conversationId), eq(conversations.userId, session.user.id)));

  try {
    if (canUseVision) {
      const imagePayloads: Array<{ mediaType: string; buffer: Buffer }> = [];

      for (const attachment of imageAttachments) {
        const inlinePayload = decodeDataUrl(attachment.publicUrl ?? "");

        if (inlinePayload) {
          imagePayloads.push(inlinePayload);
          continue;
        }

        const filePath = path.join(process.cwd(), "public", attachment.storagePath.replace(/^\//, ""));

        try {
          const buffer = await readFile(filePath);

          imagePayloads.push({
            buffer,
            mediaType: attachment.fileType === "image/jpg" ? "image/jpeg" : attachment.fileType,
          });
        } catch {
          return jsonError(`File gambar ${attachment.fileName} tidak ditemukan di server. Upload ulang file lalu coba lagi.`, 400);
        }
      }

      return await streamVisionCompletion({
        assistantMessageId,
        conversationId,
        imagePayloads,
        previousMessages,
        promptText: userContent[0]?.type === "text" ? userContent[0].text : effectivePrompt,
        userId: session.user.id,
      });
    }

    const stream = streamText({
      model: openai(env.aiModel),
      system: buildSystemPrompt(),
      messages: [
        ...modelMessages,
        {
          role: "user",
          content: userContent,
        },
      ],
      onFinish: async ({ text, usage }) => {
        await persistAssistantMessage({
          assistantMessageId,
          conversationId,
          text,
          userId: session.user.id,
        });
        const promptTokens = Number(usage?.inputTokens ?? 0);
        const completionTokens = Number(usage?.outputTokens ?? 0);
        await trackAiUsage({
          userId: session.user.id,
          conversationId,
          model: env.aiModel,
          promptTokens,
          completionTokens,
          totalTokens: Number(usage?.totalTokens ?? promptTokens + completionTokens),
        });
      },
    });

    return stream.toTextStreamResponse({
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Conversation-Id": conversationId,
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

    if (imageAttachments.length > 0 && /(INPUT_TOO_LARGE|input too large|payload too large|too large untuk diproses)/i.test(message)) {
      return jsonError(getVisionMaxSizeMessage(), 400);
    }

    return jsonError(message, 500);
  }
}
