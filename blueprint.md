# Blueprint — TanyainAja
> Panduan step-by-step pembangunan web app TanyainAja dari nol hingga siap deploy.

---

## Phase 0 — Project Setup

1. **Init project Next.js**
   - Jalankan `npx create-next-app@latest tanyainaja` dengan opsi: TypeScript, Tailwind CSS, App Router, src/ directory
   - Hapus boilerplate (page default, global CSS bawaan, dll)

2. **Install dependencies utama**
   - shadcn/ui → `npx shadcn@latest init`
   - Drizzle ORM → `npm install drizzle-orm mysql2` + `npm install -D drizzle-kit`
   - Auth → `npm install next-auth bcryptjs` + `npm install -D @types/bcryptjs`
   - AI SDK → `npm install ai openai`
   - Markdown → `npm install react-markdown rehype-highlight highlight.js`
   - Font Poppins via `next/font/google`

3. **Setup environment variables**
   - Buat file `.env.local` dengan variabel:
     ```
     DATABASE_URL=
     NEXTAUTH_SECRET=
     NEXTAUTH_URL=
     AI_BASE_URL=
     AI_API_KEY=
     AI_MODEL=
     ```

4. **Konfigurasi Tailwind & tema shadcn**
   - Set primary color `#820000` di `tailwind.config.ts`
   - Override CSS variables shadcn di `globals.css` untuk warna primary
   - Import font Poppins di `layout.tsx` root dan set sebagai `font-sans`

5. **Setup database MySQL**
   - Buat database MySQL lokal (atau remote)
   - Konfigurasi `drizzle.config.ts` dengan koneksi ke database

---

## Phase 1 — Database & Schema

6. **Buat Drizzle schema**
   - Buat file `src/db/schema.ts`
   - Definisikan 4 tabel: `users`, `conversations`, `messages`, `attachments`
   - Definisikan relasi antar tabel

7. **Generate & jalankan migrasi**
   - Jalankan `npx drizzle-kit generate` untuk membuat file migrasi SQL
   - Jalankan `npx drizzle-kit migrate` untuk apply ke database

8. **Setup Drizzle client**
   - Buat file `src/db/index.ts` sebagai singleton koneksi database
   - Export instance `db` yang siap dipakai di seluruh API Routes

---

## Phase 2 — Autentikasi

9. **Setup NextAuth.js**
   - Buat `src/app/api/auth/[...nextauth]/route.ts`
   - Konfigurasi Credentials Provider (email + password)
   - Hubungkan dengan database untuk verifikasi user via Drizzle

10. **Buat API register**
    - Buat `src/app/api/auth/register/route.ts`
    - Validasi input (email format, password minimum), cek duplikasi email
    - Hash password dengan bcrypt, simpan user baru ke database

11. **Buat halaman Register**
    - Route: `/register`
    - Form: nama, email, password, konfirmasi password
    - Client-side validation, error message inline
    - Redirect ke `/login` setelah berhasil
    - Link ke halaman Login

12. **Buat halaman Login**
    - Route: `/login`
    - Form: email dan password
    - Panggil `signIn()` dari NextAuth
    - Tampilkan error jika kredensial salah
    - Redirect ke `/chat` setelah berhasil
    - Link ke halaman Register

13. **Setup middleware proteksi route**
    - Buat `src/middleware.ts`
    - Protect route `/chat` dan `/api/conversations`, `/api/chat`, `/api/upload` — redirect ke `/login` jika belum terautentikasi
    - Route publik: `/`, `/login`, `/register`

---

## Phase 3 — Landing Page

14. **Buat layout & struktur landing page**
    - Route: `/` (page.tsx di app root)
    - Buat komponen: `Navbar`, `HeroSection`, `FeaturesSection`, `CTASection`, `Footer`

15. **Navbar**
    - Logo / nama app di kiri
    - Tombol "Login" dan "Mulai Gratis" di kanan
    - Sticky di atas saat scroll
    - Warna primary `#820000` untuk tombol CTA

16. **Hero Section**
    - Headline besar, subheadline, dan dua tombol CTA: *"Mulai Sekarang"* dan *"Pelajari Lebih Lanjut"*
    - Ilustrasi atau mockup antarmuka chat di sebelah kanan (bisa pakai static image atau SVG)

17. **Features Section**
    - Tampilkan 4–6 fitur utama dalam card grid: Chat AI, Riwayat Percakapan, Upload File, Markdown Rendering, dll
    - Ikon + judul + deskripsi singkat per card

18. **CTA Section & Footer**
    - Section terakhir dengan ajakan signup dan tombol besar
    - Footer sederhana: nama app, copyright, link Login/Register

---

## Phase 4 — Layout Chat & Sidebar

19. **Buat layout utama chat**
    - Buat `src/app/chat/layout.tsx`
    - Struktur: sidebar kiri (riwayat) + area konten kanan (chat window)
    - Sidebar bisa di-collapse dengan toggle button

20. **Buat komponen Sidebar**
    - Tombol **"Chat Baru"** di bagian atas
    - Daftar item riwayat percakapan (judul + tanggal)
    - Highlight item yang sedang aktif
    - Tombol hapus per item (muncul saat hover)
    - Tombol collapse sidebar

21. **Buat API conversations**
    - `GET /api/conversations` → ambil semua percakapan milik user yang login, urutkan terbaru
    - `POST /api/conversations` → buat percakapan baru, return id
    - `DELETE /api/conversations/:id` → hapus percakapan beserta semua pesannya
    - `GET /api/conversations/:id` → ambil detail percakapan beserta semua pesan

22. **Hubungkan Sidebar dengan API**
    - Fetch daftar percakapan saat sidebar mount
    - Klik item → navigate ke `/chat/[id]`
    - Klik "Chat Baru" → POST buat percakapan baru → navigate ke `/chat/[id]` baru
    - Klik hapus → DELETE + hapus dari state lokal

---

## Phase 5 — Chat Interface

23. **Buat halaman chat**
    - Route: `/chat/[id]/page.tsx`
    - Fetch pesan-pesan percakapan berdasarkan `id` dari URL
    - Render daftar pesan (user bubble + assistant bubble)

24. **Buat komponen MessageList**
    - Tampilkan pesan secara bergantian (user di kanan, assistant di kiri)
    - Pesan user: background primary `#820000`, teks putih
    - Pesan assistant: background abu-abu terang, teks gelap
    - Auto-scroll ke bawah saat pesan baru masuk

25. **Buat komponen MessageInput**
    - Textarea auto-resize di bagian bawah
    - Tombol kirim (aktif hanya jika ada teks/file)
    - `Enter` untuk kirim, `Shift+Enter` untuk baris baru
    - Tombol attachment di sebelah kiri textarea
    - Pratinjau thumbnail file yang dilampirkan (dengan tombol hapus)

26. **Buat API upload file**
    - `POST /api/upload` → terima multipart/form-data
    - Validasi tipe file (image/png, image/jpg, image/webp, application/pdf, text/plain)
    - Validasi ukuran maksimal 10MB
    - Simpan file ke folder `public/uploads/` atau storage eksternal
    - Simpan metadata ke tabel `attachments`, return path & id

27. **Buat API chat dengan streaming**
    - `POST /api/chat` → terima `{ conversationId, content, attachments[] }`
    - Ambil riwayat pesan sebelumnya dari database (untuk konteks AI)
    - Kirim ke OpenAI-compatible API menggunakan Vercel AI SDK (`streamText`)
    - Stream respons ke client via SSE
    - Setelah stream selesai, simpan pesan user dan respons assistant ke database
    - Update `updated_at` percakapan

28. **Hubungkan input dengan API chat**
    - Gunakan `useChat` hook dari Vercel AI SDK atau implementasi manual dengan `fetch` + `ReadableStream`
    - Tampilkan respons streaming secara progresif di MessageList
    - Tampilkan indikator loading ("AI sedang mengetik...") saat menunggu

---

## Phase 6 — Markdown Rendering

29. **Setup react-markdown**
    - Install plugin: `remark-gfm` (tabel, strikethrough), `rehype-highlight` (syntax highlighting)
    - Import CSS highlight.js theme yang sesuai dengan branding

30. **Buat komponen MarkdownRenderer**
    - Wrap `ReactMarkdown` dengan kustomisasi komponen: heading, code block, tabel, link
    - Code block: tampilkan nama bahasa di pojok kanan + tombol **"Copy"**
    - Link: buka di tab baru (`target="_blank"`)
    - Tabel: styled dengan border dan header berwarna primary

31. **Terapkan MarkdownRenderer ke pesan assistant**
    - Pesan dari role `assistant` dirender menggunakan `MarkdownRenderer`
    - Pesan dari role `user` ditampilkan sebagai plain text (preserve newline)

---

## Phase 7 — Halaman Profil & Pengaturan

32. **Buat halaman profil**
    - Route: `/chat/profile`
    - Form update nama
    - Form ganti password (password lama, password baru, konfirmasi)

33. **Buat API profil**
    - `PATCH /api/user/profile` → update nama atau password
    - Verifikasi password lama sebelum update password baru
    - Hash password baru sebelum disimpan

---

## Phase 8 — Polish & UX

34. **Loading states & skeleton**
    - Skeleton loading untuk daftar riwayat di sidebar saat fetch
    - Skeleton loading untuk pesan saat halaman chat pertama dibuka
    - Spinner di tombol kirim saat request berlangsung

35. **Error handling**
    - Toast notification untuk error: gagal kirim pesan, gagal upload, gagal hapus
    - Halaman error global (`error.tsx`) untuk error tak terduga
    - Empty state di sidebar jika belum ada percakapan

36. **Responsive & mobile**
    - Sidebar hidden by default di mobile, bisa dibuka via hamburger menu
    - Pastikan input chat tidak tertutup virtual keyboard di mobile
    - Test tampilan di layar 375px, 768px, dan 1280px

37. **Aksesibilitas dasar**
    - Semua tombol punya `aria-label` yang deskriptif
    - Focus management saat buka/tutup sidebar
    - Kontras warna memenuhi WCAG AA

---

## Phase 9 — Testing & QA

38. **Manual testing checklist**
    - [ ] Register akun baru berhasil
    - [ ] Login & logout berhasil
    - [ ] Proteksi route bekerja (redirect ke login jika belum auth)
    - [ ] Buat percakapan baru dan kirim pesan
    - [ ] Streaming respons AI muncul progresif
    - [ ] Markdown (kode, tabel, list) ter-render dengan benar
    - [ ] Upload gambar dan PDF, lampirkan ke chat
    - [ ] Riwayat percakapan muncul dan bisa dibuka kembali
    - [ ] Hapus percakapan berhasil
    - [ ] Update nama dan password di profil berhasil
    - [ ] Tampilan di mobile tidak ada yang rusak

39. **Cek keamanan**
    - [ ] API key AI tidak pernah muncul di response client atau Network tab browser
    - [ ] Percakapan user lain tidak bisa diakses (test dengan 2 akun)
    - [ ] Upload file: test file dengan ekstensi berbahaya (harus ditolak)

---

## Phase 10 — Deployment

40. **Persiapan production**
    - Set semua environment variable di platform deployment
    - Pastikan `NEXTAUTH_URL` diset ke domain production
    - Jalankan `npm run build` lokal untuk cek error TypeScript & build

41. **Deploy ke Vercel**
    - Push ke GitHub repository
    - Import project di Vercel dashboard
    - Isi environment variables di Vercel
    - Deploy & test di URL production

42. **Setup database production**
    - Gunakan MySQL managed (PlanetScale, Railway, atau server VPS sendiri)
    - Jalankan migrasi Drizzle ke database production
    - Test koneksi dari aplikasi yang sudah deploy

43. **Post-deploy checklist**
    - [ ] Landing page tampil dengan benar di domain production
    - [ ] Register & login berjalan normal
    - [ ] Chat & streaming berfungsi
    - [ ] Upload file berfungsi
    - [ ] Tidak ada error di Vercel logs

---

## Urutan Singkat (Quick Reference)

```
Phase 0  →  Project setup & konfigurasi
Phase 1  →  Database schema & migrasi
Phase 2  →  Autentikasi (register, login, middleware)
Phase 3  →  Landing page
Phase 4  →  Layout chat & sidebar riwayat
Phase 5  →  Chat interface & streaming AI
Phase 6  →  Markdown rendering
Phase 7  →  Halaman profil
Phase 8  →  Polish, UX, & responsivitas
Phase 9  →  Testing & QA
Phase 10 →  Deployment
```