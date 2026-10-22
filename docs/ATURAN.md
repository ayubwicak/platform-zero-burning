# Aturan Pengembangan Platform Insentif Zero Burning

Dokumen ini mengikat seluruh kontributor. Aturan berlaku untuk kode, dokumentasi, konfigurasi, dan aset di repositori ini.

---

## 1. Prinsip Utama

1. **Kode ditulis dan dipahami oleh manusia.** AI hanya boleh digunakan sebagai alat bantu (analisis, draf, dokumentasi). Commit yang dibuat otomatis oleh AI **dilarang**.
2. Setiap kontributor bertanggung jawab penuh atas isi commit yang dibuat atas namanya.
3. Kualitas lebih penting daripada kecepatan; jangan menggabungkan kode yang belum dipahami.
4. Perencanaan adalah pedoman: lihat [`PERENCANAAN.md`](./PERENCANAAN.md). Penyimpangan wajib dicatat dan disetujui.
5. Rahasia (kredensial, token, `.env`) tidak boleh masuk repositori.

## 2. Alur Kerja Git

### 2.1 Branch

| Branch | Fungsi | Aturan |
|---|---|---|
| `main` | Produksi/stabil | **Diproteksi**; dilarang push langsung & force push |
| `develop` | Integrasi fitur | Target utama Pull Request |
| `feature/<nama>` | Fitur baru | Dibuat dari `develop` |
| `fix/<nama>` | Perbaikan bug | Dibuat dari `develop` |
| `docs/<nama>` | Dokumentasi | Dibuat dari `develop` |
| `hotfix/<nama>` | Perbaikan darurat produksi | Dari `main`, PR ke `main` dan `develop` |

Contoh: `feature/integrasi-dashboard-api`, `fix/geofencing-radius`, `docs/pedoman-sistem`.

### 2.2 Alur

```
main ◄── hotfix/* (darurat)
  ▲
  │ PR (rilis)
develop ◄── PR ◄── feature/* | fix/* | docs/*
```

1. Sinkronkan `develop` sebelum membuat branch.
2. Kerjakan perubahan kecil dan terfokus.
3. Buka Pull Request ke `develop`.
4. Minimal **1 reviewer** menyetujui dan CI lulus.
5. Merge menggunakan squash merge (riwayat rapi) kecuali disepakati lain.
6. Hapus branch setelah merge.

### 2.3 Larangan

- Push langsung ke `main` atau `develop`.
- Force push ke branch yang sudah dibagikan.
- Merge tanpa review.
- Commit berisi file rahasia, `node_modules/`, `.pgdata/`, `uploads/`, atau hasil build `dist/`.
- Commit yang dihasilkan otomatis oleh AI tanpa peninjauan manusia.

## 3. Conventional Commits

Format:

```
<tipe>(<cakupan opsional>): <deskripsi singkat>

[body opsional]

[footer opsional]
```

| Tipe | Penggunaan |
|---|---|
| `feat` | Fitur baru |
| `fix` | Perbaikan bug |
| `docs` | Dokumentasi |
| `style` | Formatting tanpa perubahan logika |
| `refactor` | Restrukturisasi kode |
| `perf` | Peningkatan performa |
| `test` | Menambah/memperbaiki tes |
| `chore` | Tooling, dependensi, konfigurasi |
| `ci` | Perubahan pipeline CI |

Contoh:

```
feat(verifikasi): tambah aksi setujui/tolak foto
fix(geofencing): perbaiki pembulatan jarak radius
docs(perencanaan): catat penyesuaian penyimpanan foto lokal
```

Aturan tambahan:

- Deskripsi memakai bahasa Indonesia atau Inggris secara konsisten per commit.
- Maksimal 72 karakter untuk baris pertama.
- Satu commit = satu tujuan logis.

## 4. Pull Request & Review

Setiap PR wajib memuat:

- Ringkasan perubahan dan alasannya.
- Cara menguji (langkah reproduksi).
- Dampak terhadap perencanaan (bila ada) + dokumen yang diperbarui.
- Screenshot untuk perubahan UI.
- Checklist:
  - [ ] Kode dipahami dan ditulis/ditinjau manusia.
  - [ ] Tidak ada rahasia/kredensial.
  - [ ] `npm run build:web` dan/atau lint lulus.
  - [ ] Dokumentasi diperbarui bila ada penyimpangan rencana.
  - [ ] Tidak ada perubahan di luar cakupan PR.

Reviewer wajib memeriksa kebenaran logika, keamanan, konsistensi gaya, dan sinkronisasi dokumen. Reviewer tidak boleh menyetujui PR yang belum dipahami.

## 5. Standar Kode Backend

- Gunakan `async/await` dan `try/catch` dengan `next(err)`.
- Pisahkan `routes`, `controllers`, `middleware`, `config`.
- Nama file/variabel: `camelCase`; tabel/kolom database: `snake_case`.
- Validasi input di server; jangan percaya data klien.
- Query selalu memakai parameter (`$1`, `$2`) untuk mencegah SQL injection.
- Transaksi database untuk operasi multi-tabel (contoh: registrasi).
- Error response konsisten: `{ error: 'pesan' }`.
- Jangan menaruh logika bisnis di routes.
- Variabel lingkungan melalui `process.env` dan `.env` (tidak di-commit).

## 6. Standar Kode Frontend

- Gunakan komponen fungsi + hooks.
- Satu halaman = satu file di `src/pages/`; komponen bersama di `src/components/`.
- Gunakan `PageHeader` untuk judul halaman agar konsisten.
- Manfaatkan kelas komponen di `src/index.css` (`.card`, `.btn-primary`, `.chip`, `.badge-*`) sebelum membuat gaya baru.
- Tailwind utility-first; hindari CSS global baru tanpa alasan.
- Ikon dari `lucide-react`; pastikan ikon benar-benar tersedia.
- Teks antarmuka berbahasa Indonesia.
- Aksesibilitas dasar: label input, kontras cukup, tombol memiliki teks/aria-label.
- Jangan menaruh data sensitif atau URL backend hardcoded (gunakan proxy `/api`).

## 7. Standar Database

- Skema resmi di `database/schema.sql`; data awal di `database/seed.sql`.
- Perubahan skema harus disertai pembaruan file SQL dan catatan di CHANGELOG.
- Gunakan `CREATE TABLE IF NOT EXISTS` dan indeks untuk kolom pencarian.
- Jangan menghapus data produksi secara manual tanpa backup.
- Perubahan tipe/kolom harus kompatibel mundur atau melalui migrasi bertahap.
- Database lokal berjalan di port **5433** (lihat `package.json`).

## 8. Keamanan

- Jangan commit `.env`, token, password, atau kunci API.
- `JWT_SECRET` wajib acak dan panjang; beda untuk produksi.
- Password hanya disimpan sebagai hash bcrypt.
- Endpoint baru wajib memakai `authenticateToken` dan `authorizeRoles` bila perlu.
- Validasi tipe & ukuran berkas unggahan.
- Jangan menampilkan detail error internal ke pengguna produksi.
- Laporkan celah keamanan secara privat kepada pemilik proyek, bukan melalui issue publik.

## 9. Dokumentasi & Sinkronisasi Perencanaan (Wajib)

Setiap perubahan yang memengaruhi perencanaan **wajib** memperbarui:

1. [`docs/PERENCANAAN.md`](./PERENCANAAN.md) — terutama §16 (log penyimpangan) dan bagian terkait.
2. [`docs/STATUS-IMPLEMENTASI.md`](./STATUS-IMPLEMENTASI.md) — status modul.
3. [`docs/CHANGELOG.md`](./CHANGELOG.md) — entri perubahan.

Semua pembaruan tersebut dilakukan **dalam PR yang sama** dengan perubahan kode. PR yang mengubah perilaku sistem tanpa memperbarui dokumen tidak boleh digabung.

Kriteria perubahan yang perlu persetujuan khusus (diskusi sebelum implementasi):

- Menambah/menghapus fitur dalam ruang lingkup.
- Mengubah arsitektur, model data, atau kontrak API.
- Mengganti teknologi utama.
- Mengubah aturan bisnis (mis. radius geofencing, syarat klaim).

## 10. Pengujian & CI

- Perubahan backend wajib diuji minimal secara manual (endpoint terkait).
- Utamakan penambahan unit/integration test untuk logika bisnis (geofencing, klaim, verifikasi).
- Sebelum PR: jalankan build frontend (`npm run build:web`) dan backend (`npm run lint`, `npm test` bila tersedia).
- CI resmi: `.github/workflows/ci.yml` (lint + test backend).
- Status saat ini: konfigurasi ESLint dan test belum lengkap; melengkapinya adalah prioritas Fase 5.

## 11. Definition of Done

Sebuah pekerjaan dianggap selesai bila:

- [ ] Kode berjalan sesuai kebutuhan dan diuji.
- [ ] Tidak ada error build/lint yang diperkenalkan.
- [ ] Review minimal 1 orang selesai.
- [ ] Dokumentasi (perencanaan/status/changelog) diperbarui bila relevan.
- [ ] Tidak ada rahasia atau file yang tidak seharusnya masuk repositori.
- [ ] Perubahan digabung melalui PR ke `develop`.

## 12. Penegakan

Pelanggaran aturan (terutama commit AI otomatis, push langsung ke `main`, atau kebocoran rahasia) wajib ditindak dengan:

1. Menghentikan proses merge.
2. Memperbaiki/revert perubahan.
3. Mencatat insiden dan pembelajaran di diskusi tim.

Aturan dapat diperbarui melalui PR ke `develop` dengan persetujuan pemilik proyek.
