# Panduan Kontribusi

Terima kasih telah berkontribusi pada **Platform Insentif Zero Burning**.

Dokumen ini adalah ringkasan. Aturan lengkap dan mengikat ada di [`docs/ATURAN.md`](docs/ATURAN.md). Perencanaan sistem ada di [`docs/PERENCANAAN.md`](docs/PERENCANAAN.md).

---

## Prinsip Wajib

1. **Semua kode ditulis dan dipahami oleh manusia.** AI hanya alat bantu; commit otomatis oleh AI dilarang.
2. `main` diproteksi. Jangan push langsung.
3. Semua perubahan melalui Pull Request ke `develop` dengan minimal **1 reviewer**.
4. Gunakan **Conventional Commits** (`feat:`, `fix:`, `docs:`, `refactor:`, dst).
5. Jangan commit `.env`, kredensial, `node_modules/`, `.pgdata/`, `uploads/`, atau `dist/`.
6. Jika implementasi menyimpang dari rencana, perbarui `docs/PERENCANAAN.md`, `docs/STATUS-IMPLEMENTASI.md`, dan `docs/CHANGELOG.md` **dalam PR yang sama**.

## Alur Singkat

```bash
git checkout develop
git pull origin develop
git checkout -b feature/nama-fitur

# kerjakan perubahan...
npm run build:web        # verifikasi frontend
npm run dev              # uji backend + frontend

git add <file-yang-relevan>
git commit -m "feat(cakupan): deskripsi singkat"
git push origin feature/nama-fitur
```

Lalu buka Pull Request ke `develop`.

## Sebelum Membuat PR

- [ ] Perubahan terfokus dan tidak di luar cakupan.
- [ ] Sudah diuji secara manual (atau otomatis bila tersedia).
- [ ] Build/lint tidak menghasilkan error baru.
- [ ] Dokumentasi diperbarui bila ada penyimpangan rencana.
- [ ] Tidak ada rahasia atau file yang tidak seharusnya di-commit.
- [ ] Deskripsi PR menjelaskan perubahan, alasan, dan cara menguji.

## Struktur Commit yang Dianjurkan

```
feat(lahan): tambah filter status verifikasi
fix(geofencing): koreksi perhitungan jarak
docs(perencanaan): catat migrasi penyimpanan foto
```

## Menjalankan Proyek

Lihat [`README.md`](README.md) bagian **Cara Menjalankan**.
