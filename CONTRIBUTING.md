# Contributing

Terima kasih sudah ingin berkontribusi ke TanyainAja. Panduan ini dibuat agar perubahan mudah direview dan aman untuk fitur auth, chat, upload, dan usage.

## Setup Lokal

1. Install dependency.

```bash
npm install
```

2. Salin environment contoh.

```bash
cp .env.example .env.local
```

3. Isi `DATABASE_URL`, `NEXTAUTH_SECRET`, dan konfigurasi AI/OTP sesuai kebutuhan lokal.

4. Jalankan migrasi database.

```bash
npm run db:generate
npm run db:migrate
```

5. Jalankan server development.

```bash
npm run dev
```

## Standar Branch dan Commit

- Gunakan branch pendek dan deskriptif, misalnya `feat/chat-export` atau `fix/upload-validation`.
- Gunakan commit kecil yang punya satu tujuan jelas.
- Format commit yang disarankan:

```text
feat: add chat export
fix: validate upload ownership
docs: improve setup guide
chore: update project metadata
```

## Checklist Sebelum Pull Request

- `npm run lint` berhasil.
- `npm run build` berhasil untuk perubahan production-facing.
- Perubahan database punya migrasi Drizzle yang relevan.
- Endpoint protected tetap mengecek session dan ownership.
- Tidak ada secret, token, data user asli, atau file upload sensitif yang ikut ter-commit.
- README atau dokumentasi terkait ikut diperbarui jika perilaku user berubah.

## Area yang Perlu Perhatian Ekstra

- Auth WhatsApp OTP.
- `src/app/api/chat/route.ts`.
- Upload file dan akses file di `public/uploads`.
- Query usage dan ranking user.
- Superadmin dashboard.

## Pelaporan Bug

Saat melaporkan bug, sertakan:

- langkah reproduksi,
- environment yang dipakai,
- expected result,
- actual result,
- log error yang sudah disanitasi dari secret.
