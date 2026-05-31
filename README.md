# TanyainAja

TanyainAja adalah web app AI chat berbasis Next.js 16 untuk workflow tanya jawab harian dengan login WhatsApp OTP, riwayat percakapan, upload lampiran, markdown rendering, usage tracking, dan provider AI OpenAI-compatible.

![TanyainAja landing page](./docs/images/screenshot-home.png)

## Fitur Utama

- Chat AI real-time dengan streaming response.
- Context per chat agar percakapan tidak tercampur.
- Upload PNG, JPG, WEBP, PDF, TXT, dan Markdown dengan validasi ukuran dan tipe file.
- Analisis gambar saat model aktif mendukung vision.
- Autentikasi register/login menggunakan WhatsApp OTP.
- Profile user dengan avatar, total request, total token, ranking pribadi, dan top user.
- Superadmin dashboard untuk memantau usage.
- Markdown renderer untuk heading, list, code block, tabel, dan link eksternal.

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- NextAuth
- Drizzle ORM
- MySQL
- Vercel AI SDK
- OpenAI-compatible API provider

## Struktur Project

```text
src/app                  App Router pages dan API routes
src/components           UI, auth, chat, profile, dan superadmin components
src/db                   Drizzle schema dan database client
src/lib                  Auth, env, upload, usage, validators, dan helpers
drizzle                  SQL migration files
docs                     Screenshot dan dokumentasi demo
public                   Static assets
```

## Environment

Salin `.env.example` menjadi `.env.local`, lalu isi nilai yang dibutuhkan.

```bash
cp .env.example .env.local
```

Environment penting:

- `DATABASE_URL`: koneksi MySQL.
- `NEXTAUTH_SECRET`: secret session NextAuth.
- `NEXTAUTH_URL`: URL aplikasi lokal atau production.
- `AUTH_OTP_WEBHOOK_URL`: webhook pengiriman OTP WhatsApp.
- `AUTH_OTP_WEBHOOK_TOKEN`: bearer token webhook OTP jika diperlukan.
- `AI_BASE_URL`: endpoint OpenAI-compatible.
- `AI_API_KEY`: API key provider AI.
- `AI_MODEL`: model aktif untuk chat.
- `AI_SUPPORTS_VISION`: isi `true` jika model endpoint mendukung input gambar.

## Development

Install dependency dan jalankan server lokal.

```bash
npm install
npm run db:generate
npm run db:migrate
npm run dev
```

Aplikasi berjalan di `http://localhost:3000` secara default.

## Scripts

```bash
npm run dev          # menjalankan development server
npm run build        # build production
npm run start        # menjalankan build production
npm run lint         # menjalankan ESLint
npm run db:generate  # membuat migration Drizzle
npm run db:migrate   # menjalankan migration database
```

## Demo

Screenshot dan flow demo manual tersedia di [docs/demo.md](./docs/demo.md).

## Testing Checklist

- Request OTP via nomor WhatsApp berhasil dan webhook terpanggil.
- Verifikasi OTP berhasil lalu user masuk ke `/chat`.
- Login dan logout berhasil.
- Route `/chat`, `/api/conversations`, `/api/chat`, `/api/upload`, dan `/api/user/profile` terproteksi.
- Buat percakapan baru, kirim pesan, dan lihat respons streaming.
- Upload PNG, JPG, WEBP, PDF, TXT, atau Markdown dengan batas 10MB.
- Markdown assistant merender heading, list, code block, tabel, dan link eksternal.
- Sidebar responsif di 375px, 768px, dan 1280px.
- Profile dapat mengubah nama, password, dan avatar.
- Superadmin dashboard hanya bisa diakses dengan credential admin yang valid.

## Security Checks

- `AI_API_KEY` hanya dibaca di server dari `src/lib/env.ts`.
- Ownership percakapan diverifikasi sebelum detail, upload, dan chat diproses.
- OTP disimpan dalam bentuk hash, memiliki expiry, cooldown resend, dan limit percobaan.
- Upload menolak tipe file di luar whitelist dan ukuran di atas 10MB.
- Secret production tidak boleh masuk commit, screenshot, issue, atau log publik.

Lihat [SECURITY.md](./SECURITY.md) untuk detail pelaporan vulnerability.

## Roadmap

Roadmap pengembangan tersedia di [ROADMAP.md](./ROADMAP.md).

## Contributing

Panduan kontribusi tersedia di [CONTRIBUTING.md](./CONTRIBUTING.md).

## Deployment

1. Set semua environment variable di platform deployment.
2. Pastikan `NEXTAUTH_URL` mengarah ke domain production.
3. Jalankan `npm run build` untuk validasi build production.
4. Deploy ke Vercel atau platform Node.js yang mendukung Next.js.
5. Jalankan `npm run db:migrate` ke database production.
6. Verifikasi landing page, register/login, chat streaming, upload file, profile, superadmin, dan log runtime setelah deploy.

## License

Project ini dirilis dengan lisensi MIT. Lihat [LICENSE](./LICENSE).
