"use client";

import { ArrowUp, Loader2, Plus, X } from "lucide-react";
import { memo, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { fileSizeLabel } from "@/lib/utils";

type UploadItem = {
  id?: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storagePath: string;
  publicUrl: string;
};

const IMAGE_TYPES = new Set(["image/png", "image/jpg", "image/jpeg", "image/webp"]);

async function toInlineAttachment(file: File): Promise<UploadItem> {
  const publicUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Gagal membaca file"));
    };
    reader.onerror = () => reject(new Error("Gagal membaca file"));
    reader.readAsDataURL(file);
  });

  return {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    publicUrl,
    storagePath: `inline:${crypto.randomUUID()}`,
  };
}

function MessageInputComponent({
  aiModel,
  aiVisionMaxImageMb,
  aiSupportsVision,
  conversationId,
  disabled,
  onSend,
}: {
  aiModel: string;
  aiVisionMaxImageMb: number;
  aiSupportsVision: boolean;
  conversationId: string;
  disabled?: boolean;
  onSend: (payload: { content: string; attachments: UploadItem[] }) => Promise<void>;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<UploadItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "0px";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 220)}px`;
  }, [content]);

  async function uploadFiles(files: FileList) {
    setUploading(true);

    try {
      const nextAttachments: UploadItem[] = [];

      for (const file of Array.from(files)) {
        if (IMAGE_TYPES.has(file.type) && file.size > aiVisionMaxImageMb * 1024 * 1024) {
          throw new Error(`Ukuran gambar terlalu besar untuk dianalisis AI. Maksimal ${aiVisionMaxImageMb} MB per gambar.`);
        }

        if (IMAGE_TYPES.has(file.type) && !aiSupportsVision) {
          throw new Error(`Model AI saat ini (${aiModel}) belum mendukung analisis gambar. Upload file teks, PDF, atau markdown saja.`);
        }

        if (conversationId === "new") {
          nextAttachments.push(await toInlineAttachment(file));
          continue;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("conversationId", conversationId);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error ?? "Upload gagal");
        }

        nextAttachments.push(payload);
      }

      setAttachments((current) => [...current, ...nextAttachments]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload gagal");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleSend() {
    if ((!content.trim() && attachments.length === 0) || sending) {
      return;
    }

    const outgoingContent = content.trim();
    const outgoingAttachments = attachments;
    setSending(true);
    setContent("");
    setAttachments([]);

    try {
      await onSend({
        content: outgoingContent,
        attachments: outgoingAttachments,
      });
    } catch {
      setContent(outgoingContent);
      setAttachments(outgoingAttachments);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-3 sm:px-6 sm:pb-4">
      <input
        ref={fileInputRef}
        accept=".png,.jpg,.jpeg,.webp,.pdf,.txt,.md"
        className="hidden"
        multiple
        onChange={(event) => {
          if (event.target.files?.length) {
            void uploadFiles(event.target.files);
          }
        }}
        type="file"
      />

      {attachments.length > 0 ? (
        <div className="mb-2 flex flex-wrap gap-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.storagePath}
              className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-[#efe5e5]"
            >
              <div className="max-w-[220px] truncate">{attachment.fileName}</div>
              <div className="text-[#b89f9f]">{fileSizeLabel(attachment.fileSize)}</div>
              <button
                aria-label={`Hapus lampiran ${attachment.fileName}`}
                className="rounded-md p-1 text-[#bda8a8] transition hover:bg-white/10 hover:text-white"
                onClick={() => setAttachments((current) => current.filter((item) => item.storagePath !== attachment.storagePath))}
                type="button"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="rounded-[1.75rem] border border-white/12 bg-[#1b1d26]/95 shadow-[0_24px_55px_rgba(0,0,0,0.32)] backdrop-blur">
        <div className="flex items-end gap-2.5 px-3 py-2.5 sm:px-3.5 sm:py-3">
          <button
            aria-label="Upload lampiran"
            className="mb-1 flex h-9 w-9 shrink-0 items-center justify-center text-[#d8caca] transition hover:text-white disabled:opacity-50"
            disabled={disabled || uploading || sending}
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          </button>

          <Textarea
            aria-label="Input pesan"
            className="!min-h-[42px] !max-h-[220px] !resize-none !border-0 !bg-transparent !px-1.5 !py-2 !text-sm !leading-7 !text-[#f8f2f2] !shadow-none placeholder:!text-[#9f8f8f] focus:!ring-0"
            disabled={disabled || sending}
            onChange={(event) => {
              setContent(event.target.value);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void handleSend();
              }
            }}
            placeholder="Ask anything"
            ref={textareaRef}
            value={content}
          />

          <button
            aria-label="Kirim pesan"
            className="mb-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[color:var(--color-primary)] text-white transition hover:bg-[color:var(--color-primary-strong)] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={disabled || uploading || sending || (!content.trim() && attachments.length === 0)}
            onClick={() => void handleSend()}
            type="button"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

export const MessageInput = memo(MessageInputComponent);
MessageInput.displayName = "MessageInput";
