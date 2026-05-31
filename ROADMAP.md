# Roadmap

Roadmap ini menjaga arah pengembangan TanyainAja tetap jelas dan mudah ditinjau.

## Sudah Tersedia

- Landing page produk dengan ringkasan fitur utama.
- Autentikasi WhatsApp OTP untuk register dan login.
- Workspace chat dengan riwayat percakapan per user.
- Streaming response dari provider OpenAI-compatible.
- Upload lampiran gambar dan dokumen dengan validasi tipe file.
- Analisis gambar saat model aktif mendukung vision.
- Halaman profile dengan avatar, usage, ranking, dan top user.
- Superadmin dashboard untuk monitoring usage.

## Prioritas Berikutnya

- Menambahkan automated test untuk auth, conversation ownership, upload, dan chat API.
- Menambahkan seed script untuk data demo lokal.
- Memperjelas empty state dan error state pada halaman chat.
- Menambahkan dokumentasi deployment production yang lebih rinci.
- Menambahkan observability dasar untuk request AI, error upload, dan webhook OTP.

## Rencana Lanjutan

- Export percakapan ke Markdown atau PDF.
- Pencarian percakapan dan filter berdasarkan tanggal.
- Label atau folder untuk mengelompokkan chat penting.
- Admin policy untuk limit token dan quota user.
- Integrasi storage object untuk upload production.
- Rate limiting per user untuk endpoint chat dan upload.

## Prinsip Pengembangan

- Setiap fitur user-facing harus punya state loading, error, dan empty yang jelas.
- Perubahan auth, upload, dan chat API wajib mempertahankan ownership check.
- Secret production tidak boleh masuk commit, screenshot, atau log.
