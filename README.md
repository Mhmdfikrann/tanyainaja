# TanyainAja

Web app AI chat berbasis Next.js 16 dengan autentikasi WhatsApp OTP, riwayat percakapan, upload lampiran, markdown rendering, dan provider OpenAI-compatible.

## Environment

Salin `.env.example` menjadi `.env.local`, lalu isi nilai berikut:

```bash
DATABASE_URL=mysql://root:password@localhost:3306/tanyainaja
NEXTAUTH_SECRET=change-me-to-a-long-random-string
NEXTAUTH_URL=http://localhost:3000
AUTH_OTP_WEBHOOK_URL=
AUTH_OTP_WEBHOOK_TOKEN=
AUTH_OTP_CODE_TTL_SEC=300
AUTH_OTP_RESEND_COOLDOWN_SEC=60
AUTH_OTP_MAX_ATTEMPTS=5
AI_BASE_URL=https://api.openai.com/v1
AI_API_KEY=
AI_MODEL=gpt-4o-mini
```

## Development

Jalankan dependensi dan server lokal:

```bash
npm install
npm run db:generate
npm run db:migrate
npm run dev
```

## Testing Checklist

- Request OTP via nomor WhatsApp berhasil (webhook n8n terpanggil)
- Verifikasi OTP berhasil lalu user masuk ke `/chat`
- Login dan logout berhasil
- Route `/chat`, `/api/conversations`, `/api/chat`, `/api/upload`, dan `/api/user/profile` terproteksi
- Buat percakapan baru, kirim pesan, dan lihat respons streaming
- Upload PNG, JPG, WEBP, PDF, TXT, atau Markdown dengan batas 10MB
- Markdown assistant merender heading, list, code block, tabel, dan link eksternal
- Sidebar responsif di 375px, 768px, dan 1280px
- Profil dapat mengubah nama dan password

## Security Checks

- `AI_API_KEY` hanya dibaca di server dari `src/lib/env.ts`
- Ownership percakapan diverifikasi sebelum detail, upload, dan chat diproses
- OTP disimpan dalam bentuk hash, memiliki expiry, cooldown resend, dan limit percobaan
- Upload menolak tipe file di luar whitelist dan ukuran di atas 10MB

## Deployment

1. Set semua environment variable di platform deployment.
2. Pastikan `NEXTAUTH_URL` mengarah ke domain production.
3. Jalankan `npm run build` untuk validasi build production.
4. Deploy ke Vercel dan isi environment variables yang sama.
5. Jalankan `npm run db:migrate` ke database production.
6. Verifikasi landing page, register/login, chat streaming, upload file, dan log runtime setelah deploy.
