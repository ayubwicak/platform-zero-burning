# Perencanaan Sistem Platform Insentif Zero Burning

| Atribut | Nilai |
|---|---|
| Nama sistem | Platform Insentif Zero Burning |
| Versi dokumen | 1.3.0 |
| Status | Aktif — Fase 3 (Dashboard Web) |
| Terakhir diperbarui | 21 Oktober 2026 |
| Pemilik | Tim Pengembang |
| Dokumen terkait | [ATURAN.md](./ATURAN.md), [STATUS-IMPLEMENTASI.md](./STATUS-IMPLEMENTASI.md), [CHANGELOG.md](./CHANGELOG.md) |

> Dokumen ini adalah **pedoman resmi** sistem. Setiap perubahan implementasi yang menyimpang dari rencana wajib memperbarui dokumen ini (lihat §17).

---

## 1. Ringkasan

Platform Insentif Zero Burning adalah sistem pencegahan kebakaran hutan dan lahan (karhutla) yang memberikan insentif kepada petani yang mengolah lahan **tanpa membakar**. Bukti kepatuhan diambil melalui foto progres lahan yang disertai koordinat GPS, lalu diverifikasi dua lapis: oleh sesama petani (komunitas) dan oleh petugas lapangan. Insentif berupa benih, pupuk, atau alat pertanian diklaim berdasarkan lahan yang telah terverifikasi.

## 2. Latar Belakang & Tujuan

Pembakaran lahan masih menjadi cara termurah bagi petani untuk membersihkan lahan, meskipun menimbulkan kabut asap dan kerusakan lingkungan. Pendekatan larangan saja kurang efektif tanpa alternatif yang menguntungkan petani.

**Tujuan sistem:**

1. Menyediakan mekanisme insentif yang terukur bagi praktik zero burning.
2. Menjamin bukti foto valid secara lokasi (geofencing) dan integritas berkas (hash).
3. Menyediakan verifikasi berlapis untuk mengurangi kecurangan.
4. Memberikan dashboard bagi admin/petugas untuk memantau, memverifikasi, dan menyalurkan insentif.
5. Menjadi dasar penulisan skripsi dan pengembangan lanjutan.

## 3. Aktor & Hak Akses

| Aktor | Role | Hak akses utama |
|---|---|---|
| Petani | `petani` | Registrasi, kelola lahan, unggah foto, verifikasi komunitas, klaim insentif |
| Petugas Lapangan | `petugas` | Verifikasi resmi foto, distribusi insentif, memantau pengajuan |
| Admin | `admin` | Akses penuh dashboard, verifikasi resmi, distribusi, pengelolaan katalog, serta manajemen pengguna & hak akses |

Catatan: verifikasi komunitas dilakukan oleh sesama petani yang terdaftar. Registrasi publik hanya melayani role `petani` dan `petugas`; akun `admin` dibuat oleh admin lain melalui menu Manajemen Pengguna atau melalui seed database (akun admin awal tersedia untuk pengembangan).

## 4. Ruang Lingkup

### 4.1 Termasuk dalam ruang lingkup

- Autentikasi & otorisasi berbasis JWT dengan tiga role.
- Pendataan lahan (nama, luas, jenis tanaman, koordinat).
- Unggah foto progres lahan + validasi radius 50 meter + hash SHA-256.
- Verifikasi komunitas dan verifikasi resmi petugas.
- Katalog kategori insentif, pengajuan klaim, dan pencatatan distribusi.
- API backend dan dashboard web admin.
- Halaman informasi publik (landing page) sebelum login.
- Skeleton aplikasi mobile Flutter (petani & petugas).

### 4.2 Di luar ruang lingkup (saat ini)

- Pembayaran insentif dalam bentuk uang tunai/transfer.
- Integrasi sensor IoT, citra satelit, atau API pihak ketiga.
- Notifikasi push/email/WhatsApp.
- Mode offline penuh untuk mobile.
- Multi-tenant/multi-daerah.
- Rilis produksi aplikasi mobile.

## 5. Kebutuhan Fungsional

Legenda: ✅ selesai · ◐ sebagian · ☐ belum

| ID | Kebutuhan | Status | Catatan |
|---|---|---|---|
| FR-01 | Registrasi akun petani/petugas/admin | ✅ | Data profil petani/petugas otomatis dibuat |
| FR-02 | Login dan penerbitan token JWT | ✅ | Token berlaku 24 jam |
| FR-03 | Lihat profil pengguna | ◐ | Data tersimpan di DB, endpoint profil belum ada |
| FR-04 | Tambah, lihat, ubah, hapus lahan | ◐ | Tambah/lihat + integrasi web; ubah/hapus belum |
| FR-05 | Unggah foto progres lahan | ✅ | API multipart + halaman web, maksimal 5 MB, hanya gambar |
| FR-06 | Hash SHA-256 berkas foto | ✅ | Disimpan di `field_photos.photo_hash` |
| FR-07 | Validasi geofencing radius 50 m | ✅ | Ditolak server bila di luar radius |
| FR-08 | Verifikasi komunitas | ✅ | Satu suara per petani per foto |
| FR-09 | Verifikasi resmi petugas | ✅ | API + halaman web; menentukan status akhir foto |
| FR-10 | Katalog kategori insentif | ✅ | Data seed tersedia |
| FR-11 | Pengajuan klaim insentif | ✅ | Syarat: foto terbaru lahan terverifikasi, stok tersedia, tanpa klaim aktif ganda |
| FR-12 | Pencatatan distribusi insentif | ✅ | Transaksi + bukti opsional; stok berkurang 1 |
| FR-13 | Dashboard web admin | ◐ | UI selesai; login, pengguna, lahan, unggah, verifikasi, klaim & katalog terhubung API; dashboard masih data mock |
| FR-14 | Notifikasi status | ☐ | Belum direncanakan detail |
| FR-15 | Audit log aktivitas | ☐ | Belum |
| FR-16 | Laporan/ekspor data | ☐ | Belum |
| FR-17 | Manajemen pengguna & hak akses | ✅ | Khusus admin: daftar, tambah pengguna, ubah role |
| FR-18 | Proteksi route & menu berdasarkan role | ✅ | Guard route, menu sidebar dinamis, profil navbar |
| FR-19 | Halaman informasi publik (landing) | ✅ | Hero, masalah/solusi, cara kerja, fitur, manfaat, katalog, FAQ, footer |

## 6. Aturan Bisnis

| ID | Aturan |
|---|---|
| BR-01 | Zero burning berarti tidak ada pembakaran pada lahan selama periode verifikasi. |
| BR-02 | Foto hanya sah bila diambil dalam radius **≤ 50 meter** dari titik lahan; server menolak (HTTP 400) jika melebihi radius. |
| BR-03 | Satu petani hanya dapat memberi satu verifikasi komunitas per foto (perubahan suara akan menimpa suara sebelumnya). |
| BR-04 | Satu foto hanya memiliki satu verifikasi resmi petugas (perubahan akan menimpa verifikasi sebelumnya). |
| BR-05 | Klaim insentif hanya dapat diajukan bila foto terbaru lahan berstatus `terverifikasi`. |
| BR-06 | Hanya `petugas`/`admin` yang boleh mencatat distribusi insentif. |
| BR-07 | Token JWT berlaku 24 jam dan wajib disertakan pada endpoint terproteksi. |
| BR-08 | Integritas foto dijaga dengan hash SHA-256 yang dihitung server saat unggah. |
| BR-09 | Status foto: `menunggu_verifikasi`, `terverifikasi`, `ditolak`. |
| BR-10 | Status klaim: `diajukan`, `disetujui`. |
| BR-11 | Nama berkas foto menggunakan pola unik `timestamp-random.ext`; URL disimpan relatif (`/uploads/...`). |
| BR-12 | Penghapusan lahan direncanakan sebagai soft delete melalui `fields.is_active = FALSE`. |
| BR-13 | Registrasi publik hanya untuk role `petani` dan `petugas`; akun `admin` hanya dibuat oleh admin terautentikasi. |
| BR-14 | Admin tidak dapat mengubah role akunnya sendiri untuk mencegah kehilangan akses. |
| BR-15 | Perubahan role berlaku langsung: setiap request membaca ulang role dari database, bukan hanya dari klaim JWT. |
| BR-16 | Password minimal 6 karakter; email disimpan dalam huruf kecil dan harus unik. |

## 7. Alur Bisnis Utama

```
Registrasi/Login
      │
      ▼
Daftarkan lahan (nama, luas, jenis tanaman, latitude, longitude)
      │
      ▼
Ambil foto progres (GPS aktif)
      │
      ▼
Server: validasi radius ≤ 50 m + hitung hash SHA-256
      │
      ▼
Foto berstatus "menunggu_verifikasi"
      │
      ├──► Verifikasi komunitas (sesama petani: setuju / tidak_setuju)
      │
      ▼
Verifikasi resmi petugas (lolos / tidak_lolos)
      │
      ├── tidak_lolos ──► status foto "ditolak"
      │
      ▼ lolos
Status foto "terverifikasi"
      │
      ▼
Ajukan klaim insentif (kategori: benih/pupuk/alat)
      │
      ▼
Petugas mencatat distribusi + bukti penerimaan
```

Catatan implementasi: jumlah suara komunitas sudah dihitung dan dikembalikan API, namun ambang batas otomatis untuk mengubah status foto **belum** diaktifkan. Status akhir saat ini ditentukan oleh verifikasi resmi petugas.

## 8. Arsitektur Sistem

```
┌──────────────────┐      ┌──────────────────┐
│  Mobile Flutter  │      │  Dashboard Web   │
│  (petani/petugas)│      │  React + Vite    │
└────────┬─────────┘      └────────┬─────────┘
         │ HTTP/JSON               │ HTTP/JSON (proxy /api)
         └───────────┬─────────────┘
                     ▼
          ┌─────────────────────┐
          │  Express API :3000  │
          │  auth, fields,      │
          │  photos, verifikasi,│
          │  insentif           │
          └──────┬───────┬──────┘
                 │ SQL   │ file
                 ▼       ▼
   ┌──────────────────┐  ┌───────────────┐
   │ PostgreSQL :5433 │  │ uploads/      │
   │ zero_burning     │  │ (foto lokal)  │
   └──────────────────┘  └───────────────┘
```

- Monorepo dengan root `package.json` (concurrently) menjalankan backend dan frontend web bersamaan.
- Frontend web memakai proxy Vite `/api` → `http://localhost:3000`.
- Pada `NODE_ENV=production`, Express menyajikan hasil build `frontend-web/dist`.

## 9. Model Data

Database: `zero_burning` (PostgreSQL 18). Skema ada di `database/schema.sql`, seed di `database/seed.sql`.

| Tabel | Fungsi | Kolom kunci |
|---|---|---|
| `users` | Akun semua aktor | `nama`, `email`, `password` (bcrypt), `role` |
| `farmers` | Profil petani | `id_user`, `nik`, `phone`, `address` |
| `officers` | Profil petugas | `id_user`, `nip`, `position`, `unit` |
| `fields` | Lahan petani | `farmer_id`, `name`, `area`, `crop_type`, `latitude`, `longitude`, `is_active` |
| `field_photos` | Foto progres | `field_id`, `photo_url`, `taken_at`, `latitude`, `longitude`, `photo_hash`, `status` |
| `community_verifications` | Suara komunitas | `photo_id`, `verifier_id`, `status`, `note` |
| `official_verifications` | Verifikasi petugas | `photo_id`, `officer_id`, `status`, `note` |
| `incentive_categories` | Katalog insentif | `name`, `quantity`, `requirements` |
| `incentive_claims` | Klaim petani | `field_id`, `farmer_id`, `category_id`, `status` |
| `incentive_distributions` | Distribusi | `claim_id`, `officer_id`, `category_id`, `receipt_proof` |

**Catatan penting:** koordinat disimpan sebagai `DECIMAL` biasa (bukan PostGIS). Perhitungan jarak memakai formula Haversine di `geofencingMiddleware.js`.

## 10. Kontrak API

Base URL: `http://localhost:3000`. Endpoint terproteksi memerlukan header `Authorization: Bearer <token>`.

| Metode | Endpoint | Akses | Body/Parameter | Keterangan |
|---|---|---|---|---|
| GET | `/health` | Publik | — | Status layanan |
| POST | `/api/auth/register` | Publik | `nama`, `email`, `password`, `role` (`petani`/`petugas`), `nik`/`nip`, `phone`, `address`/`position`, `unit` | Membuat akun + profil; role `admin` ditolak (403) |
| POST | `/api/auth/login` | Publik | `email`, `password` | Mengembalikan token + user |
| GET | `/api/users` | Admin | — | Daftar pengguna beserta data profil |
| POST | `/api/users` | Admin | `nama`, `email`, `password`, `role`, `nik`/`nip`, `phone`, `address`/`position`, `unit` | Membuat akun dengan role apa pun |
| PATCH | `/api/users/:id/role` | Admin | `role`, `nik?`, `nip?`, `position?`, `unit?` | Ubah hak akses; profil dibuat bila belum ada |
| GET | `/api/fields` | Petani | — | Daftar lahan aktif milik petani + hitungan foto |
| POST | `/api/fields` | Petani | `name`, `area`, `crop_type`, `latitude`, `longitude` | Tambah lahan + validasi input |
| GET | `/api/fields/:id` | Terautentikasi | — | Detail lahan; petani hanya miliknya |
| GET | `/api/photos` | Petani | `field_id?` | Daftar 30 foto terbaru milik petani |
| POST | `/api/photos` | Petani | multipart: `foto`, `field_id`, `latitude`, `longitude`, `taken_at`, `timestamp` | Validasi radius + hash + duplikat |
| GET | `/api/verifications` | Petugas/Admin | `status?` | Daftar foto semua status + nama petani |
| POST | `/api/verifications/community` | Petani | `photo_id`, `status` (`setuju`/`tidak_setuju`), `note` | Upsert suara; foto sendiri ditolak |
| POST | `/api/verifications/official` | Petugas/Admin | `photo_id`, `status` (`lolos`/`tidak_lolos`), `note` | Validasi status; menentukan status foto |
| GET | `/api/verifications/pending` | Petugas/Admin | — | Foto menunggu verifikasi |
| GET | `/api/incentives/categories` | Terautentikasi | — | Katalog insentif + stok |
| GET | `/api/incentives/claims` | Petani | — | Riwayat klaim + lahan, kategori, distribusi |
| POST | `/api/incentives/claims` | Petani | `field_id`, `category_id` | Syarat foto terverifikasi, stok > 0, tanpa klaim aktif ganda |
| POST | `/api/incentives/distributions` | Petugas/Admin | `claim_id`, `receipt_proof?` | Catat distribusi; status klaim + stok diperbarui dalam transaksi |
| GET | `/uploads/:filename` | Publik | — | Berkas foto statis |

Format respons sukses: `{ "success": true, "data": ... }`. Format error: `{ "error": "pesan" }` dengan status HTTP sesuai (400/401/403/404/409/500).

## 11. Teknologi

| Lapisan | Teknologi | Catatan |
|---|---|---|
| Backend | Node.js ≥ 18, Express 4 | Entry point `backend/src/server.js` |
| Database | PostgreSQL 18 | Cluster lokal `.pgdata` port **5433** |
| Autentikasi | JWT (`jsonwebtoken`), bcryptjs | Token 24 jam, hash cost 10 |
| Unggah berkas | Multer (disk storage) | Maks. 5 MB, hanya `image/*` |
| Frontend web | React 18, Vite 5, React Router 6 | Port 5173 |
| Styling | Tailwind CSS 3.4.17, lucide-react | Font Inter |
| Mobile | Flutter (skeleton) | Belum dijalankan/diuji |
| Tooling | concurrently, nodemon, ESLint, Jest | Konfigurasi lint/test masih perlu dilengkapi |

## 12. Kebutuhan Non-Fungsional

| Aspek | Target |
|---|---|
| Usability | Antarmuka Bahasa Indonesia, responsif (mobile & desktop), konsisten |
| Performa | Halaman web termuat < 2 detik di lingkungan lokal |
| Keamanan | Password ter-hash, JWT wajib, otorisasi role, validasi lokasi di server |
| Reliabilitas | Penolakan foto di luar radius; transaksi DB untuk registrasi |
| Maintainability | Pemisahan routes/controllers/middleware; dokumen pedoman diperbarui |
| Portabilitas | Konfigurasi melalui `.env`; data foto di folder lokal |

## 13. Keamanan

- Password tidak pernah disimpan mentah (bcrypt, cost 10).
- `JWT_SECRET` hanya di `.env` dan tidak di-commit.
- Middleware `authenticateToken` memverifikasi token dan melampirkan `farmerId`/`officerId`.
- `authorizeRoles` membatasi endpoint distribusi & verifikasi resmi.
- Geofencing divalidasi di server, bukan hanya di klien.
- Unggah berkas dibatasi tipe gambar dan ukuran 5 MB.
- `.env`, `.pgdata`, `uploads/`, dan `node_modules/` diabaikan Git.

**Belum diterapkan:** rate limiting, Helmet, validasi input menyeluruh dengan `express-validator`, pemindaian malware berkas, dan HTTPS produksi.

## 14. Lingkungan Pengembangan & Cara Menjalankan

Prasyarat: Node.js ≥ 18, PostgreSQL 18 (binari lokal), npm.

```bash
# 1. Instalasi dependensi
npm run install:all

# 2. Siapkan environment
cp backend/.env.example backend/.env   # sesuaikan bila perlu

# 3. Jalankan database lokal (cluster .pgdata, port 5433)
npm run db:start

# 4. Buat database + skema + seed (sekali saja)
npm run db:setup

# 5. Jalankan backend + frontend web
npm run dev
```

| Layanan | URL |
|---|---|
| Frontend web | http://localhost:5173 |
| Backend API | http://localhost:3000 |
| Health check | http://localhost:3000/health |
| PostgreSQL | `localhost:5433`, database `zero_burning` |

Konfigurasi backend (`backend/.env`):

```
NODE_ENV=development
PORT=3000
JWT_SECRET=<string-acak-panjang>
DATABASE_URL=postgresql://postgres@localhost:5433/zero_burning
```

Menghentikan database: `npm run db:stop`. Setelah komputer restart, jalankan `npm run db:start` sebelum `npm run dev`.

## 15. Roadmap & Status

| Fase | Cakupan | Status |
|---|---|---|
| 1 | Fondasi proyek, monorepo, konfigurasi lingkungan | ✅ Selesai |
| 2 | Database, autentikasi, API lahan/foto/verifikasi/insentif | ✅ Selesai (inti) |
| 3 | Landing page + Dashboard web admin (UI/UX + auth + manajemen pengguna) | ◐ Landing page, UI, auth, pengguna, lahan, unggah, verifikasi, klaim & katalog selesai; dashboard masih data mock |
| 4 | Aplikasi mobile Flutter petani/petugas | ◐ Skeleton |
| 5 | Integrasi end-to-end, pengujian, dokumentasi, deployment | ☐ Belum |

## 16. Penyimpangan dari Rencana Awal (Log Penyesuaian)

Rencana disesuaikan dengan kondisi nyata lingkungan pengembangan. Perubahan ini **resmi** dan menjadi acuan baru.

| No | Rencana awal | Implementasi saat ini | Alasan | Dampak |
|---|---|---|---|---|
| A-01 | PostGIS untuk data spasial | Kolom `latitude`/`longitude` + Haversine | PostGIS tidak tersedia di lingkungan | Tanpa spatial index; cukup untuk radius titik |
| A-02 | Object storage MinIO/S3 | Folder lokal `uploads/` + static Express | Menyederhanakan lingkungan lokal | Perlu migrasi storage untuk produksi |
| A-03 | PostgreSQL sistem | Cluster lokal `.pgdata` port 5433 | Password superuser sistem tidak diketahui | Port & path khusus; harus `db:start` |
| A-04 | Tailwind CSS v4 | Tailwind CSS 3.4.17 | Kompatibilitas konfigurasi & PostCSS | Konfigurasi memakai `tailwind.config.js` |
| A-05 | Entry `app.js` menjalankan server | `app.js` (konfigurasi) + `server.js` (listen) | Pemisahan tanggung jawab | Script `dev`/`start` menunjuk `server.js` |
| A-06 | Middleware profil terpisah | Profil dilampirkan di `authenticateToken` | Menghindari query ganda & bug `farmerId` | `req.user.farmerId`/`officerId` tersedia |
| A-07 | Dashboard langsung terhubung API | Login, pengguna, lahan, unggah, verifikasi, klaim & katalog terhubung API; dashboard masih mock | Fokus penyelesaian UI/UX lebih dulu | Integrasi dashboard menjadi pekerjaan Fase 3 lanjutan |
| A-08 | Klaim divalidasi dari seluruh riwayat verifikasi | Dicek dari foto **terbaru** lahan | Penyederhanaan logika | Perlu pengayaan aturan bila diperlukan |
| A-09 | Ambang verifikasi komunitas otomatis | Jumlah suara dikembalikan, status belum otomatis | Menunggu definisi ambang | Status akhir ditentukan petugas |
| A-10 | CI lengkap (lint + test) | Workflow ada, konfigurasi ESLint & test belum | Prioritas fitur inti | CI belum efektif; perlu dilengkapi |
| A-11 | Admin dibuat melalui registrasi | Registrasi publik menolak `admin`; admin awal via seed `admin@zeroburning.id` | Mencegah eskalasi hak akses | Password seed wajib diganti di produksi |
| A-12 | Role dari klaim JWT | Role dibaca ulang dari database setiap request | Perubahan hak akses langsung berlaku | Tambahan satu query per request |

## 17. Pengelolaan Perubahan Perencanaan

Aturan wajib:

1. Setiap perubahan implementasi yang menyimpang dari dokumen ini **harus dicatat** pada §16 tabel penyimpangan.
2. Perubahan wajib memperbarui [`STATUS-IMPLEMENTASI.md`](./STATUS-IMPLEMENTASI.md) dan [`CHANGELOG.md`](./CHANGELOG.md) **dalam Pull Request yang sama**.
3. Perubahan yang mengubah ruang lingkup, arsitektur, model data, atau kontrak API harus dibahas dan disetujui reviewer sebelum digabung.
4. Versi dokumen mengikuti Semantic Versioning:
   - **MAJOR**: perubahan arsitektur/ruang lingkup yang tidak kompatibel.
   - **MINOR**: fitur atau penyesuaian rencana baru.
   - **PATCH**: koreksi redaksi/typo.
5. Dokumen ini adalah sumber kebenaran (source of truth) perencanaan; jika kode dan dokumen berbeda, perbedaan harus segera diselesaikan dan dicatat.

## 18. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Foto palsu / lokasi dimanipulasi | Insentif salah sasaran | Geofencing server, hash berkas, verifikasi berlapis |
| Petani kesulitan menggunakan aplikasi | Adopsi rendah | UI sederhana, panduan langkah, pendampingan petugas |
| Data foto menumpuk di disk lokal | Kapasitas penuh | Batas 5 MB, rencana migrasi object storage |
| Database lokal hilang | Kehilangan data | Backup berkala; dokumentasi setup ulang |
| CI belum berjalan efektif | Regresi kode | Lengkapi ESLint & test; aktifkan proteksi branch |
| Ketergantungan pada satu petugas | Verifikasi lambat | Dukungan multi-petugas dan antrean verifikasi |

## 19. Kriteria Penerimaan

Sistem dinyatakan memenuhi rencana inti apabila:

1. Petani dapat registrasi, login, dan mendaftarkan lahan.
2. Foto di luar radius 50 m ditolak server; foto valid tersimpan dengan hash.
3. Petugas dapat memverifikasi foto hingga berstatus `terverifikasi`/`ditolak`.
4. Klaim hanya berhasil untuk lahan dengan foto terverifikasi.
5. Petugas/admin dapat mencatat distribusi insentif.
6. Dashboard web menampilkan seluruh modul dan terhubung ke API (bukan mock).
7. Dokumen perencanaan, status, dan changelog selalu sinkron dengan implementasi.
8. Admin dapat membuat pengguna baru dan mengubah role; pengguna non-admin ditolak saat mengakses menu maupun endpoint manajemen pengguna.
9. Halaman informasi publik dapat diakses tanpa login dan menjelaskan alur, fitur, manfaat, serta kebijakan pendaftaran akun.

## 20. Referensi Dokumen

- [ATURAN.md](./ATURAN.md) — aturan pengembangan & kontribusi.
- [STATUS-IMPLEMENTASI.md](./STATUS-IMPLEMENTASI.md) — status modul terkini.
- [CHANGELOG.md](./CHANGELOG.md) — riwayat perubahan.
- [../README.md](../README.md) — ringkasan proyek & cara menjalankan.
- [../CONTRIBUTING.md](../CONTRIBUTING.md) — panduan kontribusi.
