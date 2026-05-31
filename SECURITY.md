# Security Policy

## Supported Versions

Project ini masih berada di fase aktif pengembangan. Security fix diprioritaskan untuk branch utama yang sedang dipakai production atau demo terbaru.

## Melaporkan Kerentanan

Jika menemukan celah keamanan, jangan buat issue publik berisi detail exploit. Laporkan secara privat ke maintainer repository dan sertakan:

- ringkasan masalah,
- langkah reproduksi,
- impact yang mungkin terjadi,
- endpoint atau file terkait,
- bukti konsep yang aman dan tidak mengekspos data sensitif.

Maintainer akan meninjau laporan, memvalidasi impact, lalu menyiapkan patch sebelum detail teknis dipublikasikan.

## Praktik Keamanan

- Jangan commit `.env`, API key, token webhook, credential database, atau secret NextAuth.
- Gunakan `NEXTAUTH_SECRET` yang panjang dan unik untuk tiap environment.
- Gunakan database production terpisah dari database development.
- Batasi akses ke endpoint superadmin dengan credential yang kuat.
- Pastikan upload file divalidasi dari tipe dan ukuran sebelum diproses.
- Pastikan setiap operasi conversation mengecek session dan ownership user.
- Rotasi secret jika pernah terekspos di log, screenshot, issue, atau commit.

## Scope

Yang termasuk scope utama:

- Auth register/login dan OTP WhatsApp.
- Session handling NextAuth.
- Endpoint chat, conversation, upload, profile, dan superadmin.
- Penyimpanan lampiran user.
- Integrasi provider AI dan webhook OTP.

Yang tidak termasuk scope:

- Serangan fisik atau social engineering.
- Masalah pada provider pihak ketiga di luar konfigurasi TanyainAja.
- Vulnerability yang membutuhkan akses langsung ke credential production yang sudah bocor dari sumber lain.
