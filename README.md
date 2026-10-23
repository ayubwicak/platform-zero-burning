# Platform Insentif Zero Burning

Sistem pencegahan karhutla berbasis insentif bagi petani dengan verifikasi fotografi dan lokasi GPS. Petani yang mengolah lahan tanpa membakar dapat mengunggah foto progres, memperoleh verifikasi komunitas dan petugas, lalu mengajukan insentif berupa benih, pupuk, atau alat pertanian.

## Struktur Proyek

```
platform-zero-burning/
├── backend/              # API Node.js + Express + PostgreSQL
├── frontend-web/         # Dashboard Web petani/petugas/admin (React + Vite + Tailwind)
├── frontend-mobile/      # Skeleton aplikasi Flutter (petani & petugas)
├── database/             # Skema & seed SQL (PostgreSQL, tanpa PostGIS)
├── docs/                 # Pedoman sistem (perencanaan, aturan, status)
├── .github/              # Workflow CI
└── package.json          # Script monorepo
```

## Dokumentasi Pedoman

| Dokumen | Isi |
|---|---|
| [`docs/PERENCANAAN.md`](docs/PERENCANAAN.md) | Perencanaan sistem, arsitektur, API, roadmap, log penyesuaian |
| [`docs/ATURAN.md`](docs/ATURAN.md) | Aturan Git, commit, review, kode, keamanan, dokumentasi |
| [`docs/STATUS-IMPLEMENTASI.md`](docs/STATUS-IMPLEMENTASI.md) | Status nyata setiap modul & langkah berikutnya |
| [`docs/CHANGELOG.md`](docs/CHANGELOG.md) | Riwayat perubahan versi |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Panduan kontribusi singkat |

> **Aturan sinkronisasi:** setiap perubahan implementasi yang menyimpang dari rencana wajib memperbarui `PERENCANAAN.md`, `STATUS-IMPLEMENTASI.md`, dan `CHANGELOG.md` dalam Pull Request yang sama.

## Cara Menjalankan

Prasyarat: Node.js ≥ 18 dan PostgreSQL 18.

```bash
# 1. Instal dependensi backend & frontend web
npm run install:all

# 2. Siapkan environment
cp backend/.env.example backend/.env
# sesuaikan DATABASE_URL dan JWT_SECRET bila perlu

# 3. Jalankan database lokal (cluster .pgdata, port 5433)
npm run db:start

# 4. Buat database + skema + seed (sekali saja)
npm run db:setup

# 5. Jalankan backend + frontend web
npm run dev
```

| Layanan | URL |
|---|---|
| Halaman informasi publik | http://localhost:5173 |
| Registrasi Petani | http://localhost:5173/register |
| Login | http://localhost:5173/login |
| Dashboard Web | http://localhost:5173/dashboard |
| API Backend | http://localhost:3000 |
| Health Check | http://localhost:3000/health |
| PostgreSQL | `localhost:5433` (database `zero_burning`) |

Perintah lain:

| Perintah | Fungsi |
|---|---|
| `npm run db:start` | Menyalakan PostgreSQL lokal |
| `npm run db:stop` | Menghentikan PostgreSQL lokal |
| `npm run db:setup` | Membuat DB + skema + seed |
| `npm run build:web` | Build dashboard web ke `frontend-web/dist` |
| `npm start` | Menjalankan backend (produksi) |

Setelah komputer restart, jalankan `npm run db:start` sebelum `npm run dev`.

**Akun admin awal (development):** `admin@zeroburning.id` / `admin123`. Ganti password sebelum produksi. **Petani dapat mendaftar mandiri** melalui `/register`; akun **petugas dan admin** hanya dapat dibuat melalui menu **Pengguna** setelah login sebagai admin. Setelah login, klik nama/avatar di navbar atau kartu profil sidebar untuk membuka **Profil & Keamanan**.

## Status Singkat

- ✅ Backend API inti (auth, lahan, foto, verifikasi, insentif) berjalan.
- ✅ Database & seed tersedia, termasuk akun admin awal.
- ✅ Landing page publik, registrasi petani mandiri, login web, proteksi route, serta manajemen pengguna/hak akses dan status akun (khusus admin) tersedia.
- ✅ Halaman Lahan (termasuk ubah/hapus), Data Lahan untuk petugas/admin, Unggah Foto, Verifikasi, Verifikasi Warga, Klaim, Katalog, dan Distribusi sudah terhubung API.
- ✅ Halaman Profil & Keamanan tersedia: ubah nama/kontak sesuai role dan ubah password; akses dari navbar atau kartu profil di sidebar.
- ✅ Dashboard sudah terhubung API: ringkasan program/personal dan aktivitas terbaru dari database.
- ✅ Pengelolaan katalog khusus admin: tambah kategori, ubah nama/persyaratan, dan perbarui stok dari halaman `/katalog`.
- ✅ Audit log khusus admin: perubahan role/status akun, kategori, dan stok tercatat otomatis dan dapat ditelusuri dari halaman `/audit-log`.
- ◐ Aplikasi mobile Flutter masih skeleton.
- ☐ Pengujian otomatis & deployment produksi belum.

## Manajemen Pengguna & Hak Akses

Login sebagai **admin**, lalu buka menu **Pengguna**:

- **Tambah Pengguna** — membuat akun petani (butuh NIK) atau petugas (butuh NIP). Petani juga dapat mendaftar mandiri di `/register`; petugas dan admin hanya dibuat dari menu ini.
- **Atur Akses** — mengubah role pengguna menjadi petani, petugas, atau admin.
- **Nonaktifkan/Aktifkan** — mencabut atau memulihkan akses akun tanpa menghapus data. Akun nonaktif tidak dapat login dan token aktifnya langsung ditolak.
- Perubahan role dan status langsung berlaku; pengguna perlu login ulang agar menu barunya tampil.
- Admin tidak dapat mengubah role atau menonaktifkan akunnya sendiri. Filter status dan badge `Nonaktif` memudahkan pencarian akun.

| Role | Hak akses |
|---|---|
| `petani` | Lahan, unggah foto, verifikasi komunitas, klaim insentif |
| `petugas` | Verifikasi resmi, distribusi insentif, pemantauan data lahan |
| `admin` | Semua akses + manajemen pengguna + pengelolaan katalog + pemantauan data lahan + audit log |

Detail: [`docs/STATUS-IMPLEMENTASI.md`](docs/STATUS-IMPLEMENTASI.md).

## Pemantauan Data Lahan (Petugas/Admin)

Login sebagai **petugas** atau **admin**, lalu buka menu **Data Lahan**:

- Melihat seluruh lahan aktif milik petani, termasuk nama dan nomor telepon pemilik, tanaman, luas, serta koordinat.
- Memantau jumlah foto **terverifikasi**, **menunggu**, dan **ditolak** per lahan.
- Memfilter berdasarkan status foto dan mencari nama lahan, pemilik, nomor telepon, atau tanaman.
- Halaman bersifat **read-only**; tambah, ubah, dan hapus lahan tetap hanya dapat dilakukan petani pemilik melalui menu **Lahan Saya**.

## Pengelolaan Katalog (Admin)

Login sebagai **admin**, lalu buka menu **Katalog**:

- **Tambah Kategori** — membuat kategori insentif baru dengan nama, stok awal, dan persyaratan opsional.
- **Kelola Kategori** — mengubah nama, persyaratan, atau stok pada kartu kategori.
- Nama kategori harus unik (tanpa membedakan huruf besar/kecil); stok harus bilangan bulat `>= 0`.
- Stok berkurang otomatis saat petugas mencatat distribusi. Perubahan katalog hanya dapat dilakukan admin; petani dan petugas tetap dapat melihat katalog.
- Endpoint: `POST /api/incentives/categories` dan `PATCH /api/incentives/categories/:id`.

## Audit Log (Admin)

Login sebagai **admin**, lalu buka menu **Audit Log**:

- Melihat jejak perubahan **role**, **status akun**, **katalog**, dan **stok** beserta nama pelaku, waktu, dan ringkasan perubahan.
- Pencarian serta filter **Akun & Role**, **Katalog**, dan **Stok** membantu menelusuri aktivitas.
- Pencatatan berjalan otomatis di backend. Perubahan role/status/katalog/stok dan distribusi disimpan dalam transaksi yang sama dengan audit log.
- Halaman dan endpoint `GET /api/audit-logs` hanya dapat diakses admin; petani/petugas ditolak.
- Audit log bersifat **read-only**; aktivitas operasional lain seperti tambah lahan, unggah foto, verifikasi, dan klaim belum dicatat.

## Aturan Kontribusi (Ringkas)

1. **Kode ditulis dan dipahami manusia.** Tidak ada commit otomatis hasil AI.
2. `main` diproteksi; fitur via branch `feature/*` → PR ke `develop`.
3. Pull Request wajib review minimal 1 orang dan CI lulus.
4. Conventional Commits (`feat`, `fix`, `docs`, dst).
5. Rahasia tidak boleh masuk repositori.
6. Dokumen perencanaan wajib diperbarui bila ada penyimpangan.

Aturan lengkap: [`docs/ATURAN.md`](docs/ATURAN.md).

## Lisensi

Internal Project — Pengelolaan Karhutla.
