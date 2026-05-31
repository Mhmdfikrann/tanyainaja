"use client";

import { useEffect, useMemo, useRef } from "react";
import { MarkdownRenderer } from "@/components/chat/markdown-renderer";
import { fileSizeLabel } from "@/lib/utils";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachments?: Array<{
    fileName: string;
    fileType: string;
    fileSize: number;
    storagePath: string;
    publicUrl?: string;
  }> | null;
  createdAt?: string | Date;
};

export function MessageList({
  messages,
  loading,
  userName,
}: {
  messages: ChatMessage[];
  loading: boolean;
  userName: string;
}) {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const firstName = useMemo(() => userName.trim().split(/\s+/)[0] || "Teman", [userName]);
  const lastAssistantMessage = useMemo(
    () => [...messages].reverse().find((message) => message.role === "assistant"),
    [messages],
  );
  const showTypingDots = loading && !lastAssistantMessage?.content?.trim();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
  }, [messages, loading]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 pb-6 pt-16">
        <div className="max-w-2xl text-center">
          <h1 className="text-3xl font-medium text-[#f5eded] sm:text-5xl">Hey, {firstName}. Siap mulai?</h1>
          <p className="mt-4 text-sm leading-7 text-[#aa9898] sm:text-base">
            Tanyakan apa saja. Kamu juga bisa upload file agar jawaban AI lebih relevan dengan konteksmu.
          </p>
          {loading ? <p className="mt-4 text-xs text-[#9d8a8a]">Menyiapkan ruang chat...</p> : null}
        </div>
      </div>
    );
  }

  return (
    <div className="app-scrollbar min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col justify-end gap-5 px-4 pb-5 pt-8 sm:px-6 sm:pb-6">
        {messages.map((message) => (
          <div key={message.id} className={message.role === "user" ? "flex justify-end" : "flex justify-start"}>
            {message.role === "user" ? (
              <div className="max-w-[82%] rounded-3xl rounded-br-lg bg-[color:var(--color-primary)] px-4 py-3 text-sm leading-7 text-white shadow-[0_16px_38px_rgba(130,0,0,0.28)] sm:max-w-[78ch]">
                <p className="whitespace-pre-wrap">{message.content}</p>

                {message.attachments?.length ? (
                  <div className="mt-3 grid gap-2">
                    {message.attachments.map((attachment) => (
                      <a
                        key={`${message.id}-${attachment.storagePath}`}
                        className="rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-left text-xs text-white/95 transition hover:bg-white/15"
                        href={attachment.publicUrl ?? attachment.storagePath}
                        rel="noreferrer"
                        target="_blank"
                      >
                        <div className="font-medium">{attachment.fileName}</div>
                        <div className="mt-1 text-white/75">{attachment.fileType} - {fileSizeLabel(attachment.fileSize)}</div>
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="w-full max-w-[86ch] text-[#f2ecec]">
                {message.content ? (
                  <MarkdownRenderer content={message.content} />
                ) : null}

                {message.attachments?.length ? (
                  <div className="mt-3 grid gap-2">
                    {message.attachments.map((attachment) => (
                      <a
                        key={`${message.id}-${attachment.storagePath}`}
                        className="block rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-[#e7dede] transition hover:bg-white/10"
                        href={attachment.publicUrl ?? attachment.storagePath}
                        rel="noreferrer"
                        target="_blank"
                      >
                        <div className="font-medium">{attachment.fileName}</div>
                        <div className="mt-1 text-[#ac9898]">{attachment.fileType} - {fileSizeLabel(attachment.fileSize)}</div>
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        ))}

        {showTypingDots ? (
          <div className="flex justify-start">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-2">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/70 [animation-delay:-0.2s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/70 [animation-delay:-0.1s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/70" />
            </div>
          </div>
        ) : null}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}

