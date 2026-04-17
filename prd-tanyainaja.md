# PRD — TanyainAja

## 1. Overview

**TanyainAja** adalah aplikasi web AI chat yang memungkinkan pengguna untuk bertanya dan berdiskusi tentang apa saja layaknya menggunakan Claude.ai. Aplikasi ini mendukung custom AI provider berbasis OpenAI-compatible API, sehingga admin atau pengguna dapat menghubungkan model AI pilihan mereka sendiri (base URL + API key).

Antarmuka dirancang bersih dan responsif dengan identitas visual yang kuat — primary color `#820000`, font Poppins, dan base putih — lengkap dengan landing page sebagai pintu masuk sebelum pengguna melakukan autentikasi.

---

## 2. Requirements

- **Landing Page:** Halaman publik yang menjelaskan fitur dan value proposition aplikasi sebelum pengguna masuk ke area autentikasi.
- **Autentikasi Pengguna:** Pengguna wajib login/register untuk mengakses fitur chat. Mendukung login via email & password.
- **AI Chat Interface:** Pengguna dapat mengajukan pertanyaan apa saja dan mendapatkan respons dari AI secara streaming (real-time).
- **Custom Model Provider:** Sistem menggunakan OpenAI-compatible API — konfigurasi base URL dan API key dilakukan di level aplikasi (server-side).
- **Riwayat Percakapan:** Semua sesi chat tersimpan dan dapat diakses kembali dari sidebar riwayat.
- **Upload File & Gambar:** Pengguna dapat melampirkan file atau gambar ke dalam percakapan sebagai konteks untuk AI.
- **Markdown Rendering:** Respons AI dirender dengan format Markdown yang lengkap (heading, list, code block, tabel, bold/italic).
- **Branding & Desain:** Primary color `#820000`, font Poppins, base putih, komponen dari shadcn/ui.

---

## 3. Core Features

### 3.1 Landing Page

- Halaman publik yang diakses pertama kali oleh pengunjung sebelum login.
- Menampilkan nama aplikasi, tagline, deskripsi singkat fitur utama, dan CTA (*"Mulai Sekarang"* / *"Login"*).
- Navigasi ke halaman Login dan Register.
- Desain menggunakan primary color `#820000` dan font Poppins.

### 3.2 Autentikasi

- Halaman **Register:** Form pendaftaran dengan input nama, email, dan password.
- Halaman **Login:** Form masuk dengan email dan password.
- Validasi input di sisi client dan server.
- Session management menggunakan JWT atau session cookie yang aman.
- Redirect otomatis ke dashboard chat setelah berhasil login.

### 3.3 AI Chat Interface

- Area utama berupa chat window yang menampilkan pesan pengguna dan respons AI secara bergantian.
- Input teks di bagian bawah dengan tombol kirim; mendukung pengiriman via `Enter` (dan `Shift+Enter` untuk baris baru).
- Respons AI ditampilkan secara **streaming** — teks muncul karakter demi karakter seperti sedang diketik.
- Respons AI dirender dalam format **Markdown** penuh (heading, list, code block dengan syntax highlighting, tabel, bold, italic).
- Tombol **"Chat Baru"** untuk memulai percakapan kosong.

### 3.4 Upload File & Gambar

- Tombol attachment di area input untuk memilih file dari perangkat pengguna.
- Format yang didukung: gambar (PNG, JPG, WEBP), dokumen teks (PDF, TXT, MD).
- Pratinjau thumbnail muncul di atas input sebelum pesan dikirim.
- File dikirim ke server, lalu konteksnya disertakan dalam prompt ke AI provider.

### 3.5 Riwayat Percakapan

- Sidebar kiri menampilkan daftar sesi chat yang pernah dibuat pengguna, diurutkan dari yang terbaru.
- Setiap item riwayat menampilkan judul otomatis (diambil dari pesan pertama) dan tanggal.
- Klik item riwayat untuk membuka dan melanjutkan percakapan tersebut.
- Opsi **hapus** sesi percakapan (dengan konfirmasi).
- Sidebar dapat di-collapse untuk memperluas area chat di layar yang lebih kecil.

### 3.6 Pengaturan Profil

- Halaman profil untuk mengubah nama tampilan dan password.
- Tombol logout.

---

## 4. User Flow

1. **Landing Page:** Pengunjung tiba di halaman publik, membaca fitur aplikasi, lalu menekan tombol *"Mulai Sekarang"*.
2. **Register/Login:** Pengguna mendaftar akun baru atau masuk dengan akun yang sudah ada.
3. **Dashboard Chat:** Setelah login, pengguna diarahkan ke halaman chat utama dengan sesi baru yang kosong.
4. **Mulai Chat:** Pengguna mengetik pertanyaan (dan/atau melampirkan file), lalu mengirimnya.
5. **Streaming Response:** AI merespons secara real-time; pengguna membaca jawaban yang muncul progresif.
6. **Riwayat:** Percakapan otomatis tersimpan dan muncul di sidebar kiri; pengguna bisa mengakses sesi lama kapan saja.

---

## 5. Architecture

Aplikasi menggunakan arsitektur **full-stack** berbasis Next.js 14 App Router. API Routes di Next.js menangani komunikasi dengan custom AI provider (OpenAI-compatible) secara server-side agar API key tidak pernah terekspos ke browser. Respons AI di-stream ke client menggunakan Server-Sent Events (SSE) / Vercel AI SDK streaming.

> **Catatan Keamanan:** Base URL dan API key untuk AI provider disimpan sebagai environment variable di server. Tidak ada informasi ini yang dikirim ke client.

```
┌──────────────────────────────────────────────────────────┐
│                     Browser (Client)                     │
│  Landing Page  →  Auth Pages  →  Chat UI (Next.js RSC)  │
└────────────────────────┬─────────────────────────────────┘
                         │ HTTP / SSE (streaming)
┌────────────────────────▼─────────────────────────────────┐
│             Next.js 14 API Routes (Server)               │
│  /api/auth  |  /api/chat  |  /api/conversations          │
└────────┬───────────────────────────┬─────────────────────┘
         │                           │
┌────────▼────────┐         ┌────────▼────────┐
│  OpenAI-compat  │         │  MySQL Database  │
│  AI Provider    │         │  (via Drizzle)   │
│  (custom URL)   │         │                  │
└─────────────────┘         └──────────────────┘
```

---

## 6. Database Schema

### USERS
Menyimpan data akun pengguna.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | varchar(36) PK | UUID pengguna |
| `name` | varchar(100) | Nama tampilan |
| `email` | varchar(255) | Email login, unik |
| `password_hash` | varchar(255) | Password terenkripsi (bcrypt) |
| `created_at` | datetime | Tanggal registrasi |
| `updated_at` | datetime | Tanggal terakhir diubah |

### CONVERSATIONS
Menyimpan setiap sesi percakapan.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | varchar(36) PK | UUID percakapan |
| `user_id` | varchar(36) FK | Relasi ke USERS |
| `title` | varchar(255) | Judul otomatis dari pesan pertama |
| `created_at` | datetime | Waktu percakapan dibuat |
| `updated_at` | datetime | Waktu pesan terakhir |

### MESSAGES
Menyimpan setiap pesan dalam percakapan.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | varchar(36) PK | UUID pesan |
| `conversation_id` | varchar(36) FK | Relasi ke CONVERSATIONS |
| `role` | enum | `'user'` atau `'assistant'` |
| `content` | text | Isi pesan (teks Markdown) |
| `attachments` | json | Array metadata file yang dilampirkan (nullable) |
| `created_at` | datetime | Waktu pesan dikirim |

### ATTACHMENTS
Menyimpan metadata file yang diunggah pengguna.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | varchar(36) PK | UUID file |
| `message_id` | varchar(36) FK | Relasi ke MESSAGES |
| `file_name` | varchar(255) | Nama asli file |
| `file_type` | varchar(50) | MIME type (image/png, application/pdf, dll) |
| `file_size` | int | Ukuran file dalam bytes |
| `storage_path` | varchar(500) | Path penyimpanan file di server |
| `created_at` | datetime | Waktu file diunggah |

```
USERS ||--o{ CONVERSATIONS : "memiliki"
CONVERSATIONS ||--o{ MESSAGES : "mengandung"
MESSAGES ||--o{ ATTACHMENTS : "memiliki lampiran"
```

---

## 7. Tech Stack

| Kategori | Teknologi | Keterangan |
|---|---|---|
| **Framework** | Next.js 14 (App Router) | Full-stack, SSR, API Routes |
| **Styling** | Tailwind CSS | Utility-first CSS |
| **UI Components** | shadcn/ui | Komponen accessible & customizable |
| **Font** | Poppins (Google Fonts) | Font utama seluruh aplikasi |
| **ORM** | Drizzle ORM | Type-safe query ke MySQL |
| **Database** | MySQL | Penyimpanan data utama |
| **Auth** | NextAuth.js / jose | Manajemen session & JWT |
| **Password** | bcryptjs | Hashing password |
| **AI Streaming** | Vercel AI SDK | Streaming respons dari OpenAI-compat API |
| **AI Provider** | OpenAI-compatible API | Custom base URL + API key (env variable) |
| **Markdown** | react-markdown + rehype-highlight | Rendering & syntax highlighting |
| **File Upload** | multer / formidable | Handling multipart upload di server |
| **Deployment** | Vercel / VPS + Docker | Rekomendasi utama: Vercel |

---

## 8. API Specification

| Method | Endpoint | Deskripsi |
|---|---|---|
| `POST` | `/api/auth/register` | Registrasi akun baru |
| `POST` | `/api/auth/login` | Login dan membuat session |
| `POST` | `/api/auth/logout` | Menghapus session |
| `GET` | `/api/conversations` | Ambil semua sesi chat milik user yang login |
| `POST` | `/api/conversations` | Buat sesi chat baru |
| `GET` | `/api/conversations/:id` | Ambil detail sesi beserta seluruh pesan |
| `DELETE` | `/api/conversations/:id` | Hapus sesi percakapan |
| `POST` | `/api/chat` | Kirim pesan & terima respons AI via streaming SSE |
| `POST` | `/api/upload` | Upload file/gambar, return metadata & storage path |
| `PATCH` | `/api/user/profile` | Update nama atau password pengguna |

---

## 9. UI & Branding

- **Primary Color:** `#820000` (deep red) — digunakan untuk tombol utama, aksen, link aktif, dan elemen highlight.
- **Base Color:** Putih (`#FFFFFF`) untuk background utama, dan abu-abu terang (`#F5F5F5`) untuk sidebar/panel.
- **Font:** Poppins (Google Fonts) — digunakan untuk seluruh teks aplikasi (Regular 400, Medium 500, SemiBold 600).
- **Dark Mode:** Opsional untuk fase berikutnya; tidak dalam scope v1.
- **Komponen:** Seluruh UI dibangun di atas shadcn/ui yang dikustomisasi dengan warna primary `#820000`.

---

## 10. Non-Functional Requirements

- **Performa:** Halaman chat harus ter-load dalam < 2 detik. Streaming respons AI mulai muncul dalam < 1 detik setelah request dikirim.
- **Keamanan:** API key dan base URL AI provider hanya ada di environment variable server, tidak pernah terekspos ke client. Setiap request ke API divalidasi dengan session token. Password di-hash dengan bcrypt (salt rounds ≥ 10).
- **Privasi Data:** Percakapan pengguna bersifat privat — hanya bisa diakses oleh pengguna pemiliknya.
- **Reliabilitas Upload:** Maksimum ukuran file upload 10MB per lampiran. File yang gagal diproses memberikan pesan error yang jelas.
- **Responsivitas:** Antarmuka bekerja baik di desktop maupun mobile. Sidebar riwayat dapat di-collapse di layar kecil.
- **Skalabilitas:** Arsitektur stateless memungkinkan horizontal scaling. Index database pada kolom `user_id` dan `conversation_id` untuk query yang cepat.

---

## 11. Scope & Prioritas

### v1.0 (MVP)
- Landing page
- Register & Login
- Chat interface dengan streaming
- Riwayat percakapan (sidebar)
- Markdown rendering
- Upload file & gambar

### v1.x (Future)
- Dark mode
- Ekspor percakapan ke Markdown/PDF
- Pengaturan model (pilih model dari provider yang tersedia)
- Fitur search di riwayat chat
- Multi-language UI (EN/ID)