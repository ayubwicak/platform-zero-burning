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

**Akun admin awal (development):** `admin@zeroburning.id` / `admin123`. Ganti password sebelum produksi. Akun petani/petugas baru dapat dibuat melalui menu **Pengguna** setelah login sebagai admin.

## Status Singkat

- ✅ Backend API inti (auth, lahan, foto, verifikasi, insentif) berjalan.
- ✅ Database & seed tersedia, termasuk akun admin awal.
- ✅ Landing page publik, login web, proteksi route, dan manajemen pengguna/hak akses (khusus admin) tersedia.
- ✅ Halaman Lahan, Unggah Foto, Verifikasi, Verifikasi Warga, Klaim, Katalog, dan Distribusi sudah terhubung API.
- ✅ Dashboard sudah terhubung API: ringkasan program/personal dan aktivitas terbaru dari database.
- ◐ UI registrasi mandiri, profil/ubah password, dan pengelolaan katalog admin belum tersedia.
- ◐ Aplikasi mobile Flutter masih skeleton.
- ☐ Pengujian otomatis & deployment produksi belum.

## Manajemen Pengguna & Hak Akses

Login sebagai **admin**, lalu buka menu **Pengguna**:

- **Tambah Pengguna** — membuat akun petani (butuh NIK) atau petugas (butuh NIP).
- **Atur Akses** — mengubah role pengguna menjadi petani, petugas, atau admin.
- Perubahan role langsung berlaku; pengguna perlu login ulang agar menu barunya tampil.
- Admin tidak dapat mengubah role akunnya sendiri.

| Role | Hak akses |
|---|---|
| `petani` | Lahan, unggah foto, verifikasi komunitas, klaim insentif |
| `petugas` | Verifikasi resmi, distribusi insentif |
| `admin` | Semua akses + manajemen pengguna |

Detail: [`docs/STATUS-IMPLEMENTASI.md`](docs/STATUS-IMPLEMENTASI.md).

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
