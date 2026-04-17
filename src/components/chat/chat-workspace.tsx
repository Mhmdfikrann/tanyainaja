"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { MessageInput } from "@/components/chat/message-input";
import { MessageList, type ChatMessage } from "@/components/chat/message-list";

async function readErrorResponse(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const text = await response.text();

    if (!text.trim()) {
      return "Gagal mengirim pesan";
    }

    try {
      const payload = JSON.parse(text) as { error?: string };
      return payload.error ?? "Gagal mengirim pesan";
    } catch {
      return text;
    }
  }

  const text = await response.text();
  return text.trim() || "Gagal mengirim pesan";
}

export function ChatWorkspace({
  conversationId,
  initialMessages,
  initialLoading = false,
  userName,
}: {
  conversationId: string;
  initialMessages: ChatMessage[];
  initialLoading?: boolean;
  userName: string;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [loading, setLoading] = useState(initialLoading);
  const pendingChunksRef = useRef("");
  const typingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const typingDoneRef = useRef(true);
  const typingTargetIdRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, []);

  const stopTypingInterval = useCallback(() => {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
  }, []);

  const startTypingInterval = useCallback(() => {
    if (typingIntervalRef.current || !typingTargetIdRef.current) {
      return;
    }

    function dequeueWords(source: string, words: number) {
      let rest = source;
      let chunk = "";

      for (let count = 0; count < words && rest; count += 1) {
        const match = rest.match(/^(\s*\S+\s*)/);

        if (!match) {
          break;
        }

        chunk += match[0];
        rest = rest.slice(match[0].length);
      }

      if (!chunk && rest) {
        const fallback = rest.slice(0, Math.min(4, rest.length));
        return { chunk: fallback, rest: rest.slice(fallback.length) };
      }

      return { chunk, rest };
    }

    typingIntervalRef.current = setInterval(() => {
      const targetId = typingTargetIdRef.current;

      if (!targetId) {
        stopTypingInterval();
        return;
      }

      if (!pendingChunksRef.current) {
        if (typingDoneRef.current) {
          stopTypingInterval();
        }
        return;
      }

      const queueSize = pendingChunksRef.current.length;
      const wordsPerTick = queueSize > 480 ? 6 : queueSize > 260 ? 4 : queueSize > 120 ? 3 : 2;
      const { chunk: nextChunk, rest } = dequeueWords(pendingChunksRef.current, wordsPerTick);
      pendingChunksRef.current = rest;

      setMessages((current) =>
        current.map((message) =>
          message.id === targetId
            ? {
                ...message,
                content: `${message.content}${nextChunk}`,
              }
            : message,
        ),
      );
    }, 22);
  }, [stopTypingInterval]);

  const waitTypingToFinish = useCallback(async () => {
    while (pendingChunksRef.current || !typingDoneRef.current || typingIntervalRef.current) {
      if (!pendingChunksRef.current && typingDoneRef.current) {
        stopTypingInterval();
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 20));
    }
  }, [stopTypingInterval]);

  const handleSend = useCallback(async (payload: {
    content: string;
    attachments: Array<{
      id?: string;
      fileName: string;
      fileType: string;
      fileSize: number;
      storagePath: string;
      publicUrl: string;
    }>;
  }) => {
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: payload.content,
      attachments: payload.attachments,
    };
    const assistantMessageId = crypto.randomUUID();
    pendingChunksRef.current = "";
    typingDoneRef.current = false;
    typingTargetIdRef.current = assistantMessageId;
    stopTypingInterval();

    setMessages((current) => [...current, userMessage, { id: assistantMessageId, role: "assistant", content: "" }]);
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          content: payload.content,
          attachments: payload.attachments,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(await readErrorResponse(response));
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const result = await reader.read();
        done = result.done;

        if (result.value) {
          const chunk = decoder.decode(result.value, { stream: true });
          pendingChunksRef.current += chunk;
          startTypingInterval();
        }
      }

      typingDoneRef.current = true;
      startTypingInterval();
      await waitTypingToFinish();
      router.refresh();
    } catch (error) {
      pendingChunksRef.current = "";
      typingDoneRef.current = true;
      typingTargetIdRef.current = null;
      stopTypingInterval();
      setMessages((current) =>
        current.filter(
          (message) => message.id !== assistantMessageId && message.id !== userMessage.id,
        ),
      );
      toast.error(error instanceof Error ? error.message : "Gagal mengirim pesan");
      throw error;
    } finally {
      typingTargetIdRef.current = null;
      setLoading(false);
    }
  }, [conversationId, router, startTypingInterval, stopTypingInterval, waitTypingToFinish]);

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <MessageList loading={loading} messages={messages} userName={userName} />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#101114] via-[#101114]/80 to-transparent" />
      <div className="relative z-10">
        <MessageInput conversationId={conversationId} disabled={loading} onSend={handleSend} />
      </div>
    </div>
  );
}
