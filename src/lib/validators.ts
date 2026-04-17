import { z } from "zod";

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Nama minimal 2 karakter"),
    email: z.email("Format email tidak valid").trim().toLowerCase(),
    password: z.string().min(8, "Password minimal 8 karakter"),
    confirmPassword: z.string().min(8, "Konfirmasi password minimal 8 karakter"),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.email("Format email tidak valid").trim().toLowerCase(),
  password: z.string().min(1, "Password wajib diisi"),
});

export const requestOtpSchema = z.object({
  phone: z.string().trim().min(8, "Nomor WhatsApp wajib diisi"),
});

export const verifyOtpSchema = z.object({
  otpSessionId: z.uuid("Sesi OTP tidak valid"),
  code: z.string().trim().regex(/^\d{6}$/, "Kode OTP harus 6 digit"),
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(100).optional(),
});

export const createConversationSchema = z.object({
  title: z.string().trim().max(255).optional(),
});

export const uploadFileSchema = z.object({
  id: z.uuid("ID lampiran tidak valid").optional(),
  fileName: z.string().min(1),
  fileType: z.string().min(1),
  fileSize: z.number().int().positive().max(10 * 1024 * 1024),
  storagePath: z.string().min(1),
  publicUrl: z.string().min(1),
});

export const chatSchema = z
  .object({
    conversationId: z.uuid("ID percakapan tidak valid").nullable().optional(),
    content: z.string().trim().default(""),
    attachments: z.array(uploadFileSchema).default([]),
  })
  .superRefine((value, ctx) => {
    if (!value.content.trim() && value.attachments.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Pesan tidak boleh kosong",
        path: ["content"],
      });
    }
  });

export const profileSchema = z
  .object({
    name: z.string().trim().min(2, "Nama minimal 2 karakter").optional(),
    currentPassword: z.string().optional(),
    newPassword: z.string().min(8, "Password baru minimal 8 karakter").optional(),
    confirmNewPassword: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.newPassword || value.confirmNewPassword || value.currentPassword) {
      if (!value.currentPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Password lama wajib diisi",
          path: ["currentPassword"],
        });
      }

      if (!value.newPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Password baru wajib diisi",
          path: ["newPassword"],
        });
      }

      if (value.newPassword !== value.confirmNewPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Konfirmasi password baru tidak cocok",
          path: ["confirmNewPassword"],
        });
      }
    }
  });
