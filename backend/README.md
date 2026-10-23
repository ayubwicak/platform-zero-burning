# Backend API - Platform Insentif Zero Burning

## Persyaratan

- Node.js v18+
- PostgreSQL 18 (tanpa ekstensi PostGIS)

Foto disimpan di folder lokal `backend/uploads/` dan disajikan melalui `/uploads`.

## Instalasi

Dari root proyek:

```bash
npm run install:all
cp backend/.env.example backend/.env
# sesuaikan DATABASE_URL dan JWT_SECRET bila perlu
```

Konfigurasi `.env`:

```
NODE_ENV=development
PORT=3000
JWT_SECRET=<string-acak-panjang>
DATABASE_URL=postgresql://postgres@localhost:5433/zero_burning
```

## Database

Database berjalan sebagai cluster lokal di `.pgdata` (port **5433**).

```bash
npm run db:start   # nyalakan PostgreSQL
npm run db:setup   # buat DB + skema + seed (sekali saja)
npm run db:stop    # hentikan PostgreSQL
```

Skema: `database/schema.sql` · Seed: `database/seed.sql`.

## Menjalankan Server

Development (dari root, bersama frontend):

```bash
npm run dev
```

Hanya backend:

```bash
cd backend && npm run dev
```

Produksi:

```bash
npm start
```

## Endpoint Utama

| Method | Endpoint | Akses |
|--------|----------|-------|
| GET | /health | Publik |
| POST | /api/auth/register | Publik |
| POST | /api/auth/login | Publik |
| GET | /api/fields | Petani (milik sendiri), Petugas/Admin (semua) |
| POST | /api/fields | Petani |
| GET | /api/fields/:id | Terautentikasi (petani hanya miliknya) |
| GET | /api/photos | Petani |
| POST | /api/photos | Petani |
| GET | /api/verifications | Petugas/Admin |
| POST | /api/verifications/community | Petani |
| POST | /api/verifications/official | Petugas/Admin |
| GET | /api/verifications/pending | Petugas/Admin |
| GET | /api/incentives/categories | Terautentikasi |
| POST | /api/incentives/categories | Admin |
| PATCH | /api/incentives/categories/:id | Admin |
| GET | /api/incentives/claims | Petani |
| POST | /api/incentives/claims | Petani |
| POST | /api/incentives/distributions | Petugas/Admin |
| GET | /api/users | Admin |
| POST | /api/users | Admin |
| PATCH | /api/users/:id/role | Admin |
| PATCH | /api/users/:id/status | Admin |
| GET | /api/audit-logs | Admin |

`POST /api/auth/register` hanya menerima role `petani`; akun `petugas` dan `admin` dibuat oleh admin melalui `/api/users`.

`GET /api/fields` bersifat role-aware: petani hanya menerima lahan miliknya, sedangkan petugas/admin menerima seluruh lahan aktif beserta `owner_name`, `owner_phone`, hitungan foto, dan `latest_photo_status`. Mutasi lahan tetap khusus petani.

Admin dapat menonaktifkan atau mengaktifkan akun melalui `PATCH /api/users/:id/status` dengan body `{ "is_active": false }` atau `true`. Akun nonaktif ditolak saat login dan token yang masih aktif langsung tidak berlaku; admin tidak dapat menonaktifkan akun sendiri.

Admin dapat menambah kategori lewat `POST /api/incentives/categories` dan mengubah nama, persyaratan, atau stok lewat `PATCH /api/incentives/categories/:id`. Nama kategori harus unik tanpa membedakan huruf besar/kecil dan stok wajib bilangan bulat `>= 0`.

Perubahan role, status akun, kategori, dan stok dicatat otomatis ke tabel `audit_logs` dengan snapshot pelaku. Pencatatan dilakukan dalam transaksi yang sama dengan perubahan data. `GET /api/audit-logs` hanya untuk admin dan mendukung `limit` (maks. 100), `offset`, `action`, `entity_type`, serta `q`; respons menyertakan total dan ringkasan jumlah akun/katalog/stok.

Pencatatan distribusi berjalan dalam satu transaksi: status klaim menjadi `disetujui`, stok kategori berkurang 1, dan audit log `stock.distributed` dibuat. `category_id` mengikuti klaim, bukan dikirim ulang oleh klien.

Detail kontrak API: [`docs/PERENCANAAN.md`](../docs/PERENCANAAN.md) §10.

## Aturan Git (Wajib Dibaca)

Semua commit harus ditulis oleh manusia. Dilarang komit langsung ke branch `main`. Semua perubahan melalui Pull Request dari branch `feature/*` ke `develop` dengan minimal 1 review dari anggota tim. Aturan lengkap: [`docs/ATURAN.md`](../docs/ATURAN.md).
