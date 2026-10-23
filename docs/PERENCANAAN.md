# Perencanaan Sistem Platform Insentif Zero Burning

| Atribut | Nilai |
|---|---|
| Nama sistem | Platform Insentif Zero Burning |
| Versi dokumen | 1.11.0 |
| Status | Aktif — Fase 3 selesai; lanjut pengujian & fitur pendukung |
| Terakhir diperbarui | 22 Oktober 2026 |
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

Catatan: verifikasi komunitas dilakukan oleh sesama petani yang terdaftar. Registrasi publik hanya melayani role `petani` melalui halaman `/register`. Akun `petugas` dan `admin` dibuat oleh admin melalui menu Manajemen Pengguna; akun admin awal tersedia melalui seed database untuk pengembangan.

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
| FR-01 | Registrasi akun petani (mandiri) serta petugas/admin (oleh admin) | ✅ | Halaman `/register` khusus petani + profil otomatis; petugas/admin dibuat melalui menu Pengguna |
| FR-02 | Login dan penerbitan token JWT | ✅ | Token berlaku 24 jam; akun nonaktif ditolak saat login dan request dengan token lama |
| FR-03 | Lihat dan ubah profil pengguna | ✅ | `GET /api/auth/me`, `PATCH /api/auth/profile`, halaman Profil & Keamanan, ubah password |
| FR-04 | Tambah, lihat, ubah, hapus lahan | ✅ | API + UI tambah/lihat/ubah; hapus memakai soft delete dan diblokir saat ada klaim `diajukan` |
| FR-05 | Unggah foto progres lahan | ✅ | API multipart + halaman web, maksimal 5 MB, hanya gambar |
| FR-06 | Hash SHA-256 berkas foto | ✅ | Disimpan di `field_photos.photo_hash` |
| FR-07 | Validasi geofencing radius 50 m | ✅ | Ditolak server bila di luar radius |
| FR-08 | Verifikasi komunitas | ✅ | API + halaman Verifikasi Warga; satu suara per petani per foto |
| FR-09 | Verifikasi resmi petugas | ✅ | API + halaman web; menentukan status akhir foto |
| FR-10 | Katalog kategori insentif | ✅ | Data seed + halaman admin untuk tambah kategori, ubah nama/persyaratan, dan perbarui stok |
| FR-11 | Pengajuan klaim insentif | ✅ | Syarat: foto terbaru lahan terverifikasi, stok tersedia, tanpa klaim aktif ganda |
| FR-12 | Pencatatan distribusi insentif | ✅ | API + halaman distribusi; antrean, bukti opsional, stok berkurang 1 |
| FR-13 | Dashboard web admin | ✅ | Ringkasan `GET /api/dashboard` + halaman distribusi & verifikasi warga |
| FR-14 | Notifikasi status | ☐ | Belum direncanakan detail |
| FR-15 | Audit log aktivitas | ◐ | Audit log administratif (role, status akun, katalog, stok) tersedia; aktivitas lahan/foto/verifikasi/klaim belum dicatat |
| FR-16 | Laporan/ekspor data | ☐ | Belum |
| FR-17 | Manajemen pengguna & hak akses | ✅ | Khusus admin: daftar, tambah pengguna, ubah role, serta nonaktifkan/aktifkan akun |
| FR-18 | Proteksi route & menu berdasarkan role | ✅ | Guard route, menu sidebar dinamis, profil navbar |
| FR-19 | Halaman informasi publik (landing) | ✅ | Hero, masalah/solusi, cara kerja, fitur, manfaat, katalog, FAQ, footer |
| FR-20 | Pemantauan seluruh lahan aktif oleh petugas/admin | ✅ | Halaman `/data-lahan` read-only: pemilik, kontak, koordinat, dan progres foto; `GET /api/fields` role-aware |

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
| BR-12 | Penghapusan lahan memakai soft delete (`fields.is_active = FALSE`). Lahan nonaktif tidak muncul di daftar, tidak dapat dipakai untuk unggah foto, verifikasi, atau klaim baru. Penghapusan ditolak bila masih ada klaim berstatus `diajukan`. |
| BR-13 | Registrasi publik hanya untuk role `petani`; akun `petugas` dan `admin` hanya dibuat oleh admin terautentikasi. |
| BR-14 | Admin tidak dapat mengubah role akunnya sendiri untuk mencegah kehilangan akses. |
| BR-15 | Perubahan role berlaku langsung: setiap request membaca ulang role dari database, bukan hanya dari klaim JWT. |
| BR-16 | Password 6–72 karakter; email disimpan dalam huruf kecil dan harus unik; NIK wajib 16 digit angka dan unik. |
| BR-17 | Hanya `admin` yang dapat menambah atau mengubah kategori katalog dan stok; stok tidak boleh negatif, dan perubahan nama/persyaratan tidak mengubah riwayat klaim yang sudah ada. |
| BR-18 | Penonaktifan akun memakai soft status (`users.is_active = FALSE`). Akun nonaktif tidak dapat login dan token aktifnya langsung ditolak; data serta riwayat tetap tersimpan. Admin tidak dapat menonaktifkan akun sendiri. |
| BR-19 | Petugas dan admin dapat melihat seluruh lahan aktif beserta nama/kontak pemilik untuk pemantauan. Hanya petani pemilik yang dapat menambah, mengubah, atau menghapus lahan. |
| BR-20 | Perubahan role, status akun, kategori, dan stok dicatat di `audit_logs` beserta snapshot pelaku, ringkasan, dan metadata. Pengurangan stok akibat distribusi dicatat dalam transaksi yang sama. Audit log hanya dapat dibaca admin. |

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

Catatan implementasi: halaman Verifikasi Warga sudah tersedia dan jumlah suara komunitas dihitung oleh API, namun ambang batas otomatis untuk mengubah status foto **belum** diaktifkan. Status akhir saat ini ditentukan oleh verifikasi resmi petugas.

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
- Frontend web memakai proxy Vite `/api` dan `/uploads` → `http://localhost:3000`.
- Pada `NODE_ENV=production`, Express menyajikan hasil build `frontend-web/dist`.

## 9. Model Data

Database: `zero_burning` (PostgreSQL 18). Skema ada di `database/schema.sql`, seed di `database/seed.sql`.

| Tabel | Fungsi | Kolom kunci |
|---|---|---|
| `users` | Akun semua aktor | `nama`, `email`, `password` (bcrypt), `role`, `is_active` |
| `farmers` | Profil petani | `id_user`, `nik`, `phone`, `address` |
| `officers` | Profil petugas | `id_user`, `nip`, `position`, `unit` |
| `fields` | Lahan petani | `farmer_id`, `name`, `area`, `crop_type`, `latitude`, `longitude`, `is_active` |
| `field_photos` | Foto progres | `field_id`, `photo_url`, `taken_at`, `latitude`, `longitude`, `photo_hash`, `status` |
| `community_verifications` | Suara komunitas | `photo_id`, `verifier_id`, `status`, `note` |
| `official_verifications` | Verifikasi petugas | `photo_id`, `officer_id`, `status`, `note` |
| `incentive_categories` | Katalog insentif | `name`, `quantity`, `requirements` |
| `incentive_claims` | Klaim petani | `field_id`, `farmer_id`, `category_id`, `status` |
| `incentive_distributions` | Distribusi | `claim_id`, `officer_id`, `category_id`, `receipt_proof` |
| `audit_logs` | Jejak perubahan administratif | `actor_id`, `actor_name`, `actor_role`, `action`, `entity_type`, `entity_id`, `summary`, `metadata`, `created_at` |

**Catatan penting:** koordinat disimpan sebagai `DECIMAL` biasa (bukan PostGIS). Perhitungan jarak memakai formula Haversine di `geofencingMiddleware.js`.

## 10. Kontrak API

Base URL: `http://localhost:3000`. Endpoint terproteksi memerlukan header `Authorization: Bearer <token>`.

| Metode | Endpoint | Akses | Body/Parameter | Keterangan |
|---|---|---|---|---|
| GET | `/health` | Publik | — | Status layanan |
| POST | `/api/auth/register` | Publik | `nama`, `email`, `password`, `nik` (16 digit), `role?` (`petani`), `phone?`, `address?` | Membuat akun + profil petani; role selain `petani` ditolak (403); email/NIK duplikat ditolak (400) |
| POST | `/api/auth/login` | Publik | `email`, `password` | Mengembalikan token + user; akun nonaktif ditolak (403) |
| GET | `/api/auth/me` | Terautentikasi | — | Profil pengguna + data petani (`nik`, `phone`, `address`) atau petugas (`nip`, `position`, `unit`) |
| PATCH | `/api/auth/profile` | Terautentikasi | `nama`, `phone?`, `address?` (petani), `position?`, `unit?` (petugas) | Memperbarui nama dan profil role; email/NIK/NIP/role tidak dapat diubah dari endpoint ini |
| PATCH | `/api/auth/password` | Terautentikasi | `current_password`, `new_password` | Verifikasi password lama; password baru minimal 6 karakter |
| GET | `/api/dashboard` | Terautentikasi | — | Ringkasan role-aware: metrik program untuk admin/petugas, metrik personal untuk petani, serta aktivitas terbaru untuk admin/petugas |
| GET | `/api/users` | Admin | — | Daftar pengguna beserta data profil dan status akun |
| POST | `/api/users` | Admin | `nama`, `email`, `password`, `role`, `nik`/`nip`, `phone`, `address`/`position`, `unit` | Membuat akun dengan role apa pun |
| PATCH | `/api/users/:id/role` | Admin | `role`, `nik?`, `nip?`, `position?`, `unit?` | Ubah hak akses; profil dibuat bila belum ada |
| PATCH | `/api/users/:id/status` | Admin | `is_active` (boolean) | Nonaktifkan/aktifkan akun; akun sendiri tidak dapat dinonaktifkan |
| GET | `/api/audit-logs` | Admin | `limit?` (default 50, maks. 100), `offset?`, `action?`, `entity_type?`, `q?` | Audit log perubahan role/status/katalog/stok + ringkasan jumlah per kategori |
| GET | `/api/fields` | Petani, Petugas, Admin | — | Role-aware: petani melihat miliknya; petugas/admin melihat semua lahan aktif + pemilik, kontak, hitungan foto, dan status foto terbaru |
| POST | `/api/fields` | Petani | `name`, `area`, `crop_type`, `latitude`, `longitude` | Tambah lahan + validasi input |
| GET | `/api/fields/:id` | Terautentikasi | — | Detail lahan aktif; petani hanya miliknya |
| PATCH | `/api/fields/:id` | Petani | `name`, `area`, `crop_type`, `latitude`, `longitude` | Ubah lahan aktif milik sendiri + validasi input |
| DELETE | `/api/fields/:id` | Petani | — | Soft delete lahan milik sendiri; ditolak (409) bila ada klaim `diajukan` |
| GET | `/api/photos` | Petani | `field_id?` | Daftar 30 foto terbaru milik petani |
| POST | `/api/photos` | Petani | multipart: `foto`, `field_id`, `latitude`, `longitude`, `taken_at`, `timestamp` | Validasi radius + hash + duplikat |
| GET | `/api/verifications` | Petugas/Admin | `status?` | Daftar foto semua status + nama petani |
| GET | `/api/verifications/community` | Petani | — | Foto `menunggu_verifikasi` dari petani lain + jumlah suara + `my_status` |
| POST | `/api/verifications/community` | Petani | `photo_id`, `status` (`setuju`/`tidak_setuju`), `note` | Upsert suara; foto sendiri ditolak |
| POST | `/api/verifications/official` | Petugas/Admin | `photo_id`, `status` (`lolos`/`tidak_lolos`), `note` | Validasi status; menentukan status foto |
| GET | `/api/verifications/pending` | Petugas/Admin | — | Foto menunggu verifikasi |
| GET | `/api/incentives/categories` | Terautentikasi | — | Katalog insentif + stok |
| POST | `/api/incentives/categories` | Admin | `name`, `quantity`, `requirements?` | Menambah kategori katalog; nama harus unik |
| PATCH | `/api/incentives/categories/:id` | Admin | `name?`, `quantity?`, `requirements?` | Mengubah kategori atau stok; stok bilangan bulat ≥ 0 |
| GET | `/api/incentives/claims` | Petani | — | Riwayat klaim + lahan, kategori, distribusi |
| GET | `/api/incentives/claims/pending` | Petugas/Admin | — | Antrean klaim `diajukan` + petani, lahan, kategori, stok, bukti foto |
| POST | `/api/incentives/claims` | Petani | `field_id`, `category_id` | Syarat foto terverifikasi, stok > 0, tanpa klaim aktif ganda |
| GET | `/api/incentives/distributions` | Petugas/Admin | — | 20 distribusi terbaru + total distribusi |
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
- Perubahan role, status akun, katalog, dan stok dicatat ke `audit_logs`; endpoint audit log hanya dapat diakses admin.
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
| 3 | Landing page + Dashboard web admin (UI/UX + auth + manajemen pengguna) | ✅ Selesai |
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
| A-07 | Dashboard langsung terhubung API | Ringkasan dashboard memakai `GET /api/dashboard`; halaman distribusi, verifikasi warga, profil, registrasi petani, pengelolaan lahan, dan pengelolaan katalog admin sudah tersedia | Integrasi selesai | Seluruh modul web utama terhubung API |
| A-08 | Klaim divalidasi dari seluruh riwayat verifikasi | Dicek dari foto **terbaru** lahan | Penyederhanaan logika | Perlu pengayaan aturan bila diperlukan |
| A-09 | Ambang verifikasi komunitas otomatis | Jumlah suara dikembalikan, status belum otomatis | Menunggu definisi ambang | Status akhir ditentukan petugas |
| A-10 | CI lengkap (lint + test) | Workflow ada, ESLint backend sudah berjalan, test otomatis belum | Prioritas fitur inti | CI belum efektif; perlu test |
| A-11 | Admin dibuat melalui registrasi | Registrasi publik menolak `admin`; admin awal via seed `admin@zeroburning.id` | Mencegah eskalasi hak akses | Password seed wajib diganti di produksi |
| A-12 | Role dari klaim JWT | Role dibaca ulang dari database setiap request | Perubahan hak akses langsung berlaku | Tambahan satu query per request |
| A-13 | Registrasi publik untuk petani dan petugas | Registrasi publik hanya untuk petani; petugas/admin dibuat admin | Mencegah pembuatan akun berhak verifikasi/distribusi secara bebas | Menu Pengguna menjadi satu-satunya jalur pembuatan petugas/admin |

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
8. Admin dapat membuat pengguna baru, mengubah role, serta menonaktifkan/mengaktifkan akun; pengguna non-admin ditolak saat mengakses menu maupun endpoint manajemen pengguna.
9. Halaman informasi publik dapat diakses tanpa login dan menjelaskan alur, fitur, manfaat, serta kebijakan pendaftaran akun.
10. Admin dapat menambah/mengubah kategori katalog dan stok dengan validasi nama unik serta stok bilangan bulat `>= 0`; petani/petugas tidak dapat mengubah katalog.
11. Petugas/admin dapat melihat seluruh lahan aktif melalui halaman Data Lahan tanpa dapat menambah, mengubah, atau menghapus lahan petani.
12. Admin dapat melihat audit log perubahan role, status akun, katalog, dan stok; pengguna non-admin ditolak saat mengakses endpoint maupun halaman audit log.

> Status 22 Oktober 2026: butir 1, 6, 8, 10, 11, dan 12 terpenuhi untuk seluruh modul inti, termasuk registrasi petani mandiri, status akun, dashboard, distribusi, verifikasi warga, profil, pengelolaan lahan, pemantauan lahan oleh petugas/admin, pengelolaan katalog, dan audit log administratif. Akun petugas dan admin tetap dibuat oleh administrator sesuai kebijakan keamanan.

## 20. Referensi Dokumen

- [ATURAN.md](./ATURAN.md) — aturan pengembangan & kontribusi.
- [STATUS-IMPLEMENTASI.md](./STATUS-IMPLEMENTASI.md) — status modul terkini.
- [CHANGELOG.md](./CHANGELOG.md) — riwayat perubahan.
- [../README.md](../README.md) — ringkasan proyek & cara menjalankan.
- [../CONTRIBUTING.md](../CONTRIBUTING.md) — panduan kontribusi.
