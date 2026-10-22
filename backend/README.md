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
| GET | /api/fields | Petani |
| POST | /api/fields | Petani |
| GET | /api/fields/:id | Terautentikasi (petani hanya miliknya) |
| GET | /api/photos | Petani |
| POST | /api/photos | Petani |
| GET | /api/verifications | Petugas/Admin |
| POST | /api/verifications/community | Petani |
| POST | /api/verifications/official | Petugas/Admin |
| GET | /api/verifications/pending | Petugas/Admin |
| GET | /api/incentives/categories | Terautentikasi |
| GET | /api/incentives/claims | Petani |
| POST | /api/incentives/claims | Petani |
| POST | /api/incentives/distributions | Petugas/Admin |

Pencatatan distribusi berjalan dalam satu transaksi: status klaim menjadi `disetujui` dan stok kategori berkurang 1. `category_id` mengikuti klaim, bukan dikirim ulang oleh klien.
| GET | /api/users | Admin |
| POST | /api/users | Admin |
| PATCH | /api/users/:id/role | Admin |

Detail kontrak API: [`docs/PERENCANAAN.md`](../docs/PERENCANAAN.md) §10.

## Aturan Git (Wajib Dibaca)

Semua commit harus ditulis oleh manusia. Dilarang komit langsung ke branch `main`. Semua perubahan melalui Pull Request dari branch `feature/*` ke `develop` dengan minimal 1 review dari anggota tim. Aturan lengkap: [`docs/ATURAN.md`](../docs/ATURAN.md).
