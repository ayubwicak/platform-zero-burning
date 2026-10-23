# Status Implementasi

| Atribut | Nilai |
|---|---|
| Diperbarui | 22 Oktober 2026 |
| Fase aktif | Fase 3 selesai; lanjut pengujian & fitur pendukung |
| Dokumen acuan | [PERENCANAAN.md](./PERENCANAAN.md) |

Dokumen ini mencatat kondisi nyata sistem. Perbarui setiap kali ada perubahan yang memengaruhi status modul (wajib dalam PR yang sama).

---

## 1. Ringkasan

- Backend API inti **berjalan** dan telah diuji manual (registrasi, login, lahan, unggah foto, verifikasi, insentif, pengelolaan katalog oleh admin, serta audit log administratif).
- Database PostgreSQL lokal **berjalan** di port 5433 dengan skema non-PostGIS.
- **Landing page publik** tersedia di `/` dengan informasi sistem, alur, fitur, manfaat, katalog, dan FAQ.
- Dashboard web **selesai dari sisi UI/UX dan terhubung API**. Login, registrasi petani mandiri, status akun, proteksi route, manajemen pengguna (khusus admin), pengelolaan katalog (khusus admin), audit log (khusus admin), serta **Profil, Lahan, Data Lahan, Unggah Foto, Verifikasi, Verifikasi Warga, Klaim, Katalog, dan Distribusi** sudah terhubung ke API. Ringkasan dashboard memakai data program/personal dan aktivitas terbaru dari database.
- Aplikasi mobile Flutter masih **skeleton**.
- Lint backend sudah berjalan; test otomatis belum tersedia sehingga CI belum efektif.

## 2. Status per Modul

| Modul | Status | Keterangan | Lokasi utama |
|---|---|---|---|
| Setup monorepo | ✅ Selesai | `concurrently`, script DB & build | `package.json` |
| Database & skema | ✅ Selesai | 11 tabel, seed 3 kategori | `database/` |
| Autentikasi (register/login) | ✅ Selesai | JWT 24 jam, bcrypt, profil otomatis; registrasi publik khusus petani, role petugas/admin ditolak; akun nonaktif tidak dapat login | `backend/src/controllers/authController.js` |
| Profil & keamanan akun | ✅ Selesai | `GET /api/auth/me`, ubah nama/kontak profil, ubah password; halaman `/profil` dan nama navbar ikut diperbarui | `authController.js`, `pages/Profil.jsx` |
| Middleware auth & role | ✅ Selesai | `authenticateToken`, `authorizeRoles`; role dan status aktif dibaca ulang dari DB | `backend/src/middleware/authMiddleware.js` |
| Manajemen pengguna | ✅ Selesai | Khusus admin: daftar, tambah pengguna, ubah role + profil, nonaktifkan/aktifkan akun | `backend/src/controllers/userController.js` |
| Audit log admin | ✅ Selesai | Khusus admin: jejak perubahan role, status akun, kategori, dan stok; filter, pencarian, ringkasan, dan pagination API | `auditController.js`, `utils/auditLog.js`, `pages/AuditLog.jsx` |
| Proteksi route & menu | ✅ Selesai | Guard login/admin, sidebar dinamis berdasarkan role | `frontend-web/src/components/RouteGuards.jsx`, `Sidebar.jsx` |
| Pengelolaan lahan | ✅ Selesai | List/tambah/detail/ubah/hapus (soft delete) + integrasi web; hapus diblokir bila ada klaim `diajukan` | `fieldController.js`, `pages/Fields.jsx` |
| Pemantauan lahan | ✅ Selesai | `GET /api/fields` role-aware; petugas/admin melihat semua lahan aktif beserta pemilik, kontak, dan progres foto | `fieldController.js`, `pages/DataLahan.jsx` |
| Unggah foto + hash | ✅ Selesai | Multer 5 MB, SHA-256, tolak duplikat, riwayat foto | `photoController.js`, `uploadMiddleware.js` |
| Geofencing 50 m | ✅ Selesai | Haversine, tolak di server | `geofencingMiddleware.js` |
| Verifikasi komunitas | ✅ Selesai | Upsert suara per petani/foto + halaman Verifikasi Warga untuk petani | `verificationController.js`, `pages/VerifikasiKomunitas.jsx` |
| Verifikasi petugas | ✅ Selesai | API + UI verifikasi resmi; menentukan status foto | `verificationController.js`, `pages/Verifikasi.jsx` |
| Katalog insentif | ✅ Selesai | Endpoint kategori + seed; admin dapat menambah kategori, mengubah nama/persyaratan, dan memperbarui stok | `incentiveController.js` |
| Klaim insentif | ✅ Selesai | Syarat foto terbaru terverifikasi, cek stok, cegah klaim aktif ganda | `incentiveController.js` |
| Distribusi insentif | ✅ Selesai | API transaksi + halaman distribusi: antrean, catat penyaluran, riwayat; stok berkurang 1 | `incentiveController.js`, `pages/Distribusi.jsx` |
| Landing page publik | ✅ Selesai | Hero, cara kerja, fitur, manfaat, katalog, FAQ, CTA, footer | `pages/Landing.jsx` |
| Layout & navigasi web | ✅ Selesai | Navbar fixed, sidebar, drawer mobile | `frontend-web/src/components/` |
| Dashboard web | ✅ Selesai | Ringkasan program/personal + aktivitas dari `GET /api/dashboard`; loading, error, dan empty state role-aware | `pages/Dashboard.jsx`, `dashboardController.js` |
| Halaman Lahan | ✅ Selesai | Terhubung API: daftar, tambah, ubah, hapus, GPS, statistik & progres foto | `pages/Fields.jsx` |
| Halaman Data Lahan | ✅ Selesai | Khusus petugas/admin, read-only: seluruh lahan aktif, pemilik/kontak, koordinat, filter status, pencarian, dan progres foto | `pages/DataLahan.jsx` |
| Halaman Unggah Foto | ✅ Selesai | Pilih lahan, GPS, unggah multipart, riwayat & status | `pages/Upload.jsx` |
| Halaman Verifikasi | ✅ Selesai | Verifikasi resmi petugas: semua status, pencarian, setujui/tolak, thumbnail | `pages/Verifikasi.jsx` |
| Halaman Verifikasi Warga | ✅ Selesai | Foto pending petani lain, jumlah suara komunitas, ubah suara | `pages/VerifikasiKomunitas.jsx` |
| Halaman Klaim | ✅ Selesai | Terhubung API: pilih kategori/lahan, validasi verifikasi & stok, stepper, riwayat | `pages/Klaim.jsx` |
| Halaman Katalog | ✅ Selesai | Kategori, stok, filter, pencarian, tautan klaim; mode admin untuk tambah/ubah kategori dan stok | `pages/Katalog.jsx` |
| Halaman Distribusi | ✅ Selesai | Antrean klaim terverifikasi, catat distribusi + bukti, riwayat terbaru | `pages/Distribusi.jsx` |
| Halaman Registrasi | ✅ Selesai | `/register` khusus petani: validasi NIK 16 digit, konfirmasi password, sukses diarahkan ke login dengan email terisi | `pages/Register.jsx` |
| Halaman Login | ✅ Selesai | Terhubung `/api/auth/login`, simpan token, redirect; menampilkan status pendaftaran berhasil | `pages/Login.jsx` |
| Halaman Profil | ✅ Selesai | Ringkasan akun, ubah nama/kontak sesuai role, ubah password; akses dari navbar & kartu sidebar | `pages/Profil.jsx` |
| Halaman Pengguna (admin) | ✅ Selesai | Statistik, filter role/status, pencarian, tambah pengguna, ubah role, nonaktifkan/aktifkan akun | `pages/Pengguna.jsx` |
| Integrasi web ↔ API | ✅ Selesai | Login, registrasi petani, profil, pengguna, audit log, lahan, data lahan, unggah, verifikasi, verifikasi warga, klaim, katalog admin, distribusi, dan ringkasan dashboard terhubung ke API | `frontend-web/src/` |
| Mobile Flutter | ◐ Skeleton | Belum dijalankan/diuji | `frontend-mobile/` |
| CI (lint + test) | ◐ Sebagian | Workflow ada; ESLint backend sudah berjalan, test otomatis belum | `.github/workflows/ci.yml` |

Catatan metrik dashboard: jumlah lahan terverifikasi mengikuti status foto terbaru lahan (konsisten dengan syarat klaim), sedangkan “Insentif Tersalurkan” adalah jumlah paket distribusi karena skema belum menyimpan nilai uang.

## 3. Penyesuaian terhadap Rencana

Ringkasan penyimpangan resmi (detail lengkap di `PERENCANAAN.md` §16):

1. **PostGIS → `latitude`/`longitude` + Haversine.** PostGIS tidak tersedia; radius dihitung di JavaScript.
2. **MinIO/S3 → folder lokal `uploads/`.** Foto disajikan Express melalui `/uploads`.
3. **PostgreSQL sistem → cluster lokal `.pgdata` port 5433.** Password superuser sistem tidak diketahui.
4. **Tailwind v4 → v3.4.17.** Kompatibilitas konfigurasi.
5. **`app.js` → `app.js` + `server.js`.** Entry point listen dipisahkan.
6. **Profil petugas/petani dilampirkan di `authenticateToken`.** Menghilangkan middleware terpisah dan bug `farmerId`.
7. **Dashboard dan seluruh modul inti sudah ber-UI.** Ringkasan dashboard memakai API; halaman distribusi, verifikasi warga, profil, registrasi petani, ubah/hapus lahan, data lahan petugas/admin, serta pengelolaan katalog admin sudah tersedia. Akun petugas/admin dibuat admin melalui menu Pengguna.
8. **Klaim memeriksa foto terbaru lahan.** Belum mempertimbangkan seluruh riwayat.
9. **Ambang verifikasi komunitas belum otomatis.** Status akhir ditentukan petugas.
10. **CI belum lengkap.** ESLint backend sudah berjalan; unit/integration test belum tersedia.
11. **Admin awal via seed.** Registrasi publik menolak `admin`; akun `admin@zeroburning.id` disediakan untuk pengembangan dan wajib ganti password di produksi.
12. **Role dibaca ulang dari database setiap request.** Perubahan hak akses langsung berlaku, dengan tambahan satu query per request.
13. **Registrasi publik hanya petani.** Akun petugas dan admin dibuat admin melalui menu Pengguna agar hak verifikasi/distribusi tidak dapat diperoleh lewat pendaftaran bebas.

## 4. Batasan & Isu Diketahui

- Registrasi mandiri belum memverifikasi kepemilikan email/WhatsApp dan belum mencocokkan NIK ke Dukcapil; validasi saat ini hanya format 16 digit dan keunikan NIK.
- Audit log mencakup perubahan role/status akun serta katalog/stok; aktivitas operasional seperti tambah/ubah lahan, unggah foto, verifikasi, dan klaim belum dicatat.
- Audit log belum memiliki kebijakan retensi atau fitur ekspor.
- Penonaktifan akun bersifat soft status; belum ada endpoint hapus permanen atau kebijakan retensi data akun.
- Jarak geofencing hanya dikembalikan di respons, tidak disimpan di database.
- Pagination baru diterapkan pada audit log; endpoint lain belum memiliki pagination, rate limiting, Helmet, dan validasi input menyeluruh.
- Belum ada unit/integration test; `npm test` baru lulus karena `--passWithNoTests`.
- Frontend-mobile belum dijalankan.
- Akun admin seed masih memakai password awal; wajib diganti sebelum produksi.

## 5. Langkah Berikutnya (Prioritas)

1. Tambahkan verifikasi email/WhatsApp pada registrasi, perluas audit log ke aktivitas operasional, serta tetapkan kebijakan hapus permanen/retensi akun.
2. Tambahkan unit/integration test backend (registrasi, geofencing, klaim, verifikasi, distribusi, katalog, dashboard, audit log, akses role).
3. Bangun aplikasi Flutter petani/petugas.
4. Siapkan deployment (object storage, HTTPS, environment produksi, ganti password admin).

## 6. Cara Verifikasi Cepat

```bash
# Backend
curl http://localhost:3000/health

# Frontend (build)
cd frontend-web && npx vite build

# Semua layanan
npm run dev
```

## 7. Riwayat Pembaruan Status

| Tanggal | Perubahan |
|---|---|
| 21 Okt 2026 | Dokumen dibuat; status awal seluruh modul dicatat |
| 21 Okt 2026 | Redesign UI/UX selesai (Dashboard, Lahan, Unggah, Verifikasi, Klaim, Katalog, Login); build & route web terverifikasi |
| 21 Okt 2026 | Login web terhubung API, guard route/menu berbasis role, dan modul Manajemen Pengguna khusus admin (buat akun & ubah role) selesai diuji |
| 21 Okt 2026 | Landing page publik di `/` selesai; dashboard dipindah ke `/dashboard`; build & route terverifikasi |
| 21 Okt 2026 | Halaman Lahan & Unggah Foto terhubung API; daftar foto, kepemilikan lahan, deteksi duplikat, proxy `/uploads`, dan pengujian end-to-end selesai |
| 21 Okt 2026 | Halaman Verifikasi terhubung API: daftar semua status, aksi setujui/tolak, pembatasan role, dan verifikasi komunitas diuji |
| 21 Okt 2026 | Halaman Klaim & Katalog terhubung API; klaim divalidasi (stok, verifikasi lahan, duplikat) dan distribusi mengurangi stok dalam transaksi |
| 22 Okt 2026 | Dashboard terhubung `GET /api/dashboard`: metrik program untuk admin/petugas, metrik personal untuk petani, aktivitas real dari database, serta state loading/error/empty |
| 22 Okt 2026 | Penyempurnaan UI/UX landing, login, dashboard, notifikasi, dan aksesibilitas; build web, lint backend, serta pemeriksaan axe dan responsif selesai |
| 22 Okt 2026 | Halaman Distribusi dan Verifikasi Warga terhubung API; endpoint antrean klaim, riwayat distribusi, dan daftar foto komunitas; perbaikan penyajian `/uploads`, tipe status verifikasi, zona waktu `taken_at`, overflow mobile, dan kontras |
| 22 Okt 2026 | Halaman Profil & Keamanan serta endpoint profil/ubah password; Lahan kini mendukung ubah dan hapus soft delete dengan proteksi klaim aktif; verifikasi/klaim menolak lahan nonaktif |
| 22 Okt 2026 | Registrasi mandiri petani `/register` + validasi API; login menampilkan status berhasil dan email terisi; landing, FAQ, CTA, serta dokumentasi diselaraskan dengan kebijakan registrasi publik khusus petani |
| 22 Okt 2026 | Pengelolaan katalog admin: tambah kategori, ubah nama/persyaratan, dan perbarui stok melalui `/katalog`; API `POST/PATCH /api/incentives/categories` dengan proteksi role admin dan validasi nama/stok |
| 22 Okt 2026 | Status akun pengguna: admin dapat menonaktifkan/mengaktifkan akun melalui `/pengguna`; login dan token akun nonaktif langsung ditolak, dengan proteksi akun sendiri |
| 22 Okt 2026 | Data Lahan untuk petugas/admin: `/data-lahan` read-only dengan pemilik/kontak, koordinat, filter status, pencarian, dan progres foto; `GET /api/fields` menjadi role-aware tanpa membuka mutasi lahan |
| 22 Okt 2026 | Audit log admin: pencatatan perubahan role/status akun, kategori, dan stok (termasuk distribusi); endpoint `GET /api/audit-logs` dengan filter/pagination dan halaman `/audit-log` read-only |
