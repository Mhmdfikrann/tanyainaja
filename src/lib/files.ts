import { randomUUID } from "node:crypto";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpg",
  "image/jpeg",
  "image/webp",
  "application/pdf",
  "text/plain",
  "text/markdown",
]);

export async function persistUpload(file: File) {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Tipe file tidak didukung");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Ukuran file maksimal 10MB");
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const uploadId = randomUUID();
  const extension = guessExtension(file.type);
  const fileName = normalizeFileName(file.name, extension);
  const publicUrl = toDataUrl(buffer, file.type);

  return {
    id: uploadId,
    fileName,
    fileType: file.type,
    fileSize: file.size,
    storagePath: `inline:${uploadId}`,
    publicUrl,
  };
}

function normalizeFileName(originalName: string, fallbackExtension: string) {
  const trimmed = originalName.trim();

  if (!trimmed) {
    return `file${fallbackExtension}`;
  }

  if (/\.[a-z0-9]+$/i.test(trimmed)) {
    return trimmed;
  }

  return `${trimmed}${fallbackExtension}`;
}

function toDataUrl(buffer: Buffer, mimeType: string) {
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

function guessExtension(mimeType: string) {
  if (mimeType === "application/pdf") return ".pdf";
  if (mimeType === "text/plain") return ".txt";
  if (mimeType === "text/markdown") return ".md";
  if (mimeType === "image/jpg") return ".jpg";
  if (mimeType === "image/jpeg") return ".jpg";
  if (mimeType === "image/png") return ".png";
  if (mimeType === "image/webp") return ".webp";
  return ".jpg";
}
