import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
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

  const extension = path.extname(file.name) || guessExtension(file.type);
  const fileName = `${randomUUID()}${extension}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  const storagePath = path.join(uploadDir, fileName);

  await mkdir(uploadDir, { recursive: true });

  const arrayBuffer = await file.arrayBuffer();
  await writeFile(storagePath, Buffer.from(arrayBuffer));

  return {
    id: randomUUID(),
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    storagePath: `/uploads/${fileName}`,
    publicUrl: `/uploads/${fileName}`,
  };
}

function guessExtension(mimeType: string) {
  if (mimeType === "application/pdf") return ".pdf";
  if (mimeType === "text/plain") return ".txt";
  if (mimeType === "text/markdown") return ".md";
  if (mimeType === "image/jpg") return ".jpg";
  if (mimeType === "image/png") return ".png";
  if (mimeType === "image/webp") return ".webp";
  return ".jpg";
}
