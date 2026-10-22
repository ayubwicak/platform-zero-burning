# Status Implementasi

| Atribut | Nilai |
|---|---|
| Diperbarui | 22 Oktober 2026 |
| Fase aktif | Fase 3 selesai; lanjut pengujian & fitur pendukung |
| Dokumen acuan | [PERENCANAAN.md](./PERENCANAAN.md) |

Dokumen ini mencatat kondisi nyata sistem. Perbarui setiap kali ada perubahan yang memengaruhi status modul (wajib dalam PR yang sama).

---

## 1. Ringkasan

- Backend API inti **berjalan** dan telah diuji manual (registrasi, login, lahan, unggah foto, verifikasi, insentif).
- Database PostgreSQL lokal **berjalan** di port 5433 dengan skema non-PostGIS.
- **Landing page publik** tersedia di `/` dengan informasi sistem, alur, fitur, manfaat, katalog, dan FAQ.
- Dashboard web **selesai dari sisi UI/UX dan terhubung API**. Login, proteksi route, manajemen pengguna (khusus admin), serta **Lahan, Unggah Foto, Verifikasi, Verifikasi Warga, Klaim, Katalog, dan Distribusi** sudah terhubung ke API. Ringkasan dashboard memakai data program/personal dan aktivitas terbaru dari database.
- Aplikasi mobile Flutter masih **skeleton**.
- Lint backend sudah berjalan; test otomatis belum tersedia sehingga CI belum efektif.

## 2. Status per Modul

| Modul | Status | Keterangan | Lokasi utama |
|---|---|---|---|
| Setup monorepo | ✅ Selesai | `concurrently`, script DB & build | `package.json` |
| Database & skema | ✅ Selesai | 10 tabel, seed 3 kategori | `database/` |
| Autentikasi (register/login) | ✅ Selesai | JWT 24 jam, bcrypt, profil otomatis, registrasi admin ditolak | `backend/src/controllers/authController.js` |
| Middleware auth & role | ✅ Selesai | `authenticateToken`, `authorizeRoles`; role dibaca ulang dari DB | `backend/src/middleware/authMiddleware.js` |
| Manajemen pengguna | ✅ Selesai | Khusus admin: daftar, tambah pengguna, ubah role + profil | `backend/src/controllers/userController.js` |
| Proteksi route & menu | ✅ Selesai | Guard login/admin, sidebar dinamis berdasarkan role | `frontend-web/src/components/RouteGuards.jsx`, `Sidebar.jsx` |
| Pengelolaan lahan | ◐ Sebagian | List/tambah/detail + integrasi web; ubah/hapus belum | `fieldController.js` |
| Unggah foto + hash | ✅ Selesai | Multer 5 MB, SHA-256, tolak duplikat, riwayat foto | `photoController.js`, `uploadMiddleware.js` |
| Geofencing 50 m | ✅ Selesai | Haversine, tolak di server | `geofencingMiddleware.js` |
| Verifikasi komunitas | ✅ Selesai | Upsert suara per petani/foto + halaman Verifikasi Warga untuk petani | `verificationController.js`, `pages/VerifikasiKomunitas.jsx` |
| Verifikasi petugas | ✅ Selesai | API + UI verifikasi resmi; menentukan status foto | `verificationController.js`, `pages/Verifikasi.jsx` |
| Katalog insentif | ✅ Selesai | Endpoint kategori + seed; pengelolaan katalog admin belum | `incentiveController.js` |
| Klaim insentif | ✅ Selesai | Syarat foto terbaru terverifikasi, cek stok, cegah klaim aktif ganda | `incentiveController.js` |
| Distribusi insentif | ✅ Selesai | API transaksi + halaman distribusi: antrean, catat penyaluran, riwayat; stok berkurang 1 | `incentiveController.js`, `pages/Distribusi.jsx` |
| Landing page publik | ✅ Selesai | Hero, cara kerja, fitur, manfaat, katalog, FAQ, CTA, footer | `pages/Landing.jsx` |
| Layout & navigasi web | ✅ Selesai | Navbar fixed, sidebar, drawer mobile | `frontend-web/src/components/` |
| Dashboard web | ✅ Selesai | Ringkasan program/personal + aktivitas dari `GET /api/dashboard`; loading, error, dan empty state role-aware | `pages/Dashboard.jsx`, `dashboardController.js` |
| Halaman Lahan | ✅ Selesai | Terhubung API: daftar, tambah, GPS, statistik & progres foto | `pages/Fields.jsx` |
| Halaman Unggah Foto | ✅ Selesai | Pilih lahan, GPS, unggah multipart, riwayat & status | `pages/Upload.jsx` |
| Halaman Verifikasi | ✅ Selesai | Verifikasi resmi petugas: semua status, pencarian, setujui/tolak, thumbnail | `pages/Verifikasi.jsx` |
| Halaman Verifikasi Warga | ✅ Selesai | Foto pending petani lain, jumlah suara komunitas, ubah suara | `pages/VerifikasiKomunitas.jsx` |
| Halaman Klaim | ✅ Selesai | Terhubung API: pilih kategori/lahan, validasi verifikasi & stok, stepper, riwayat | `pages/Klaim.jsx` |
| Halaman Katalog | ✅ Selesai | Terhubung API: kategori, stok, filter, pencarian, tautan klaim | `pages/Katalog.jsx` |
| Halaman Distribusi | ✅ Selesai | Antrean klaim terverifikasi, catat distribusi + bukti, riwayat terbaru | `pages/Distribusi.jsx` |
| Halaman Login | ✅ Selesai | Terhubung `/api/auth/login`, simpan token, redirect | `pages/Login.jsx` |
| Halaman Pengguna (admin) | ✅ Selesai | Statistik, filter, pencarian, tambah pengguna, ubah role | `pages/Pengguna.jsx` |
| Integrasi web ↔ API | ◐ Sebagian | Login, pengguna, lahan, unggah, verifikasi, verifikasi warga, klaim, katalog, distribusi, dan ringkasan dashboard terhubung; UI pendaftaran mandiri, profil, serta pengelolaan katalog admin belum | `frontend-web/src/` |
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
7. **Dashboard dan modul inti sudah ber-UI.** Ringkasan dashboard memakai API serta halaman distribusi dan verifikasi warga sudah tersedia; sisa UI pendaftaran mandiri, profil, dan pengelolaan katalog admin.
8. **Klaim memeriksa foto terbaru lahan.** Belum mempertimbangkan seluruh riwayat.
9. **Ambang verifikasi komunitas belum otomatis.** Status akhir ditentukan petugas.
10. **CI belum lengkap.** ESLint backend sudah berjalan; unit/integration test belum tersedia.
11. **Admin awal via seed.** Registrasi publik menolak `admin`; akun `admin@zeroburning.id` disediakan untuk pengembangan dan wajib ganti password di produksi.
12. **Role dibaca ulang dari database setiap request.** Perubahan hak akses langsung berlaku, dengan tambahan satu query per request.

## 4. Batasan & Isu Diketahui

- Belum ada halaman registrasi mandiri; akun petani/petugas dibuat admin melalui menu Pengguna.
- Belum ada halaman profil/ubah password.
- Belum ada halaman katalog untuk pengelolaan stok/kategori oleh admin.
- Belum ada endpoint hapus pengguna; akun nonaktif belum didukung.
- `GET /api/fields` hanya tersedia untuk petani; petugas/admin belum memiliki endpoint daftar lahan.
- Jarak geofencing hanya dikembalikan di respons, tidak disimpan di database.
- Belum ada pagination, rate limiting, Helmet, dan validasi input menyeluruh.
- Belum ada unit/integration test; `npm test` baru lulus karena `--passWithNoTests`.
- Frontend-mobile belum dijalankan.
- Akun admin seed masih memakai password awal; wajib diganti sebelum produksi.

## 5. Langkah Berikutnya (Prioritas)

1. Lengkapi UI registrasi mandiri, profil/ubah password, serta update/hapus lahan.
2. Tambahkan pengelolaan katalog admin, endpoint hapus/nonaktifkan pengguna, audit log perubahan role, dan daftar lahan untuk petugas/admin.
3. Tambahkan unit/integration test backend (geofencing, klaim, verifikasi, distribusi, dashboard, akses role).
4. Bangun aplikasi Flutter petani/petugas.
5. Siapkan deployment (object storage, HTTPS, environment produksi, ganti password admin).

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
