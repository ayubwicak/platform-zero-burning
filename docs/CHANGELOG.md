# Changelog

Semua perubahan penting pada proyek ini dicatat di sini.

Format mengikuti [Keep a Changelog](https://keepachangelog.com/id/1.1.0/) dan penomoran versi [Semantic Versioning](https://semver.org/lang/id/).

---

## [Unreleased]

### Added

- **Penyimpanan Foto Permanen Abstraksi Storage (Tahap 1):**
  - Abstraksi penyimpanan berkas terpusat `backend/src/utils/storage.js` dengan driver ganda: `local` (default dev/test) dan `s3` (kompatibel AWS S3, Cloudflare R2, dan Supabase Storage).
  - Pemuatan driver dinamis melalui variabel lingkungan `STORAGE_DRIVER`, `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_BASE_URL`, dan `S3_FORCE_PATH_STYLE`.
  - Pola penyimpanan privat: database hanya menyimpan object key (`photos/<filename>`), foto disajikan kepada klien terautentikasi melalui presigned URL GET temporer (default berlaku 10 menit).
  - Mekanisme transaksi kompensasi saat unggah foto di `photoController.js`: jika penyimpanan gagal, transaksi DB dibatalkan; jika query DB gagal setelah unggah, objek storage otomatis dihapus untuk mencegah file yatim (orphan).
  - Skrip migrasi idempoten `backend/scripts/migrate-storage.js` (`npm run storage:migrate`) untuk memindahkan file lama di `backend/uploads/` ke S3 dan memperbarui kolom database tanpa menghapus file lokal asli.
  - Fallback transisi aman: path lokal lama (`/uploads/...`) dan URL eksternal (Unsplash seed) tetap terbaca valid.
  - Unit test komprehensif `backend/__tests__/storage.test.js` (11 unit test untuk driver lokal dan mock S3 tanpa jaringan).

- **Penyempurnaan Landing Page Publik `/` (Bagian A - E):**
  - **Bagian A (Kejujuran Konten & Dampak Nyata):**
    - File data terpusat `frontend-web/src/content/testimonials.js` dengan flag `verified: boolean`. Blok "Suara dari Lapangan" kini hanya dirender bila ada entri yang bernilai `verified: true`.
    - Kartu foto hero diberi label jelas *"Contoh ilustrasi"* untuk menjaga integritas data publik.
    - Endpoint publik `GET /api/public/stats` (bebas autentikasi, rate limit 300 req/15m, in-memory cache 5 menit dengan header `Cache-Control: public, max-age=300`) yang hanya mengembalikan agregat numerik (*total_farmers*, *total_fields*, *verified_fields*, *verified_area_ha*, *distributed_incentives*) tanpa mengekspos PII, nama, maupun koordinat spasial.
    - Strip statistik dampak dinamis pada landing page dengan skeleton loading, fallback tersembunyi saat offline, dan pesan jujur (*"Program baru dimulai. Jadilah petani pertama..."*) saat sistem masih kosong.
    - Komponen `AnimatedCounter.jsx` yang memformat angka pemisah ribuan standar Indonesia (`Intl.NumberFormat('id-ID')`) dan menghormati preferensi pengguna `prefers-reduced-motion`.
    - Test suite backend `backend/__tests__/public-stats.test.js` untuk memvalidasi keamanan agregasi data, header caching, dan penanganan nilai kosong.
  - **Bagian B (Pusat FAQ & Jalur Bantuan):**
    - File data `frontend-web/src/content/faq.js` memuat 11 pertanyaan terstruktur dalam 4 kategori (*Pendaftaran*, *Foto & Verifikasi*, *Insentif*, *Data & Keamanan*) dengan bahasa sederhana yang ramah petani dan penjelasan istilah teknis.
    - Komponen accordion FAQ yang accessible (`aria-expanded`, `aria-controls`, `id`, navigasi keyboard), fitur pencarian teks instan sisi klien, filter kategori interaktif, serta tombol tanggapan *"Apakah ini membantu? Ya/Tidak"* tanpa menyimpan data pribadi.
    - Kartu jalur bantuan langsung WhatsApp (`https://wa.me/...`) dan Email (`mailto:...`) yang terhubung dinamis ke environment variable (`VITE_CONTACT_WHATSAPP`, `VITE_CONTACT_EMAIL`) dengan conditional rendering otomatis bila variabel tidak dikonfigurasi.
    - Structured data schema.org `FAQPage` via JSON-LD script untuk optimasi Rich Snippets pada mesin pencari.
  - **Bagian C (Kontak, Identitas Penyelenggara, dan Dokumen Legal):**
    - Halaman legal draf `/kebijakan-privasi` (`KebijakanPrivasi.jsx`) dan `/syarat-penggunaan` (`SyaratPenggunaan.jsx`) dengan penanda jelas draf peninjauan hukum, tanggal pembaruan (30 Oktober 2026), keterbukaan pengumpulan data, hak pengguna, tata kelola RBAC, dan alamat pengaduan.
    - Footer lengkap memuat nama dan alamat lembaga penyelenggara dari variabel lingkungan (`VITE_ORG_NAME`, `VITE_ORG_ADDRESS`), tautan dokumen legal, serta tautan navigasi dinamis menurut status login pengguna (menampilkan *Buka Dashboard* saat terautentikasi, atau *Masuk ke Sistem* dan *Daftar sebagai Petani* saat tamu).
    - Checkbox persetujuan pada formulir pendaftaran `/register` kini menautkan langsung teks "Kebijakan Privasi" dengan target `_blank` dan `rel="noopener noreferrer"`.
    - File `.env.example` untuk panduan konfigurasi variabel publik.
  - **Bagian D (Hierarki Nilai & Keterbacaan Aksesibilitas WCAG AA):**
    - Hero headline diperkaya kalimat manfaat konkret dari katalog: *"Lahan terverifikasi berhak atas benih padi unggul bersertifikat, pupuk organik hayati, dan pinjaman alat pengolah tanah."*
    - Reposisi section Katalog Bantuan lebih naik (tepat setelah section Cara Kerja) untuk memperkuat motivasi utama petani.
    - Peningkatan kontras warna teks oranye pada tema krem melalui kelas `.text-ember-contrast` (`rgb(176, 73, 24)`) dan pada latar hijau forest melalui `.text-ember-light` (`rgb(248, 146, 82)`), menghasilkan rasio kontras WCAG AA $\ge 4.5:1$ (bahkan $\ge 7:1$ pada latar gelap).
    - Penjelasan istilah teknis operasional (validasi geofence 50 m, sidik jari digital SHA-256, verifikasi dua lapis, dan transparansi audit log).
  - **Bagian E (Optimasi Teknis, SEO, Mobile, & Lighthouse):**
    - Metadata `index.html` lengkap: meta description deskriptif, `lang="id"`, canonical link, Open Graph (`og:type`, `og:image`, `og:title`, `og:description`), dan Twitter Card summary large image.
    - Aset Open Graph resolusi tinggi 1200x630 `public/og-image.jpg` dengan branding visual Zero Burning.
    - Format gambar responsif WebP modern (`hero-rice-field.webp` dan `hero-rice-field-mobile.webp`) dengan atribut eksplisit `width`, `height`, dan `fetchpriority="high"`.
    - Pemuatan Google Fonts non-render blocking dengan `<link rel="preload" as="style">` dan fallback `onload="this.media='all'"`.
    - Tata letak seluler adaptif: navigasi hamburger mobile yang mulus, target interaksi minimum $\ge 44\text{ px}$, tombol *Kembali ke Atas* mengapung saat menggulir halaman, dan scroll anchor dengan offset `scroll-padding-top: 5rem`.
    - Berkas perayapan mesin pencari `robots.txt` dan `sitemap.xml` yang hanya menyertakan halaman publik dan memblokir rute administratif berautentikasi.
    - Test suite komprehensif Playwright `frontend-web/tests/e2e/landing-enhanced.spec.js` yang menguji statistik publik, pencarian FAQ, accordion, footer auth-aware, link legal, dan ketiadaan horizontal overflow pada viewport sempit 360px.
    - Hasil audit Lighthouse seluler (mode preview teroptimasi):
      - **Performance**: 85 (Target $\ge$ 85)
      - **Accessibility**: 100 (Target $\ge$ 95)
      - **SEO**: 100 (Target $\ge$ 95)

- **Fitur A (Alur Penolakan & Pembatalan Klaim Insentif):**
  - Endpoint `POST /api/claims/:id/reject` dan `POST /api/claims/:id/cancel` dengan validasi transisi status (409 Conflict bila status invalid).
  - Skema database diperluas dengan kolom `reason`, `processed_by`, dan `processed_at` pada tabel `incentive_claims` (status `ditolak` dan `dibatalkan`).
  - Validasi alasan wajib dengan opsi terstandar (*Petani tidak hadir*, *Lahan bermasalah kembali*, *Data tidak sesuai*, *Stok tidak tersedia*, *Kekeliruan input*, *Lainnya*) serta catatan teks tambahan (wajib jika memilih alasan *Lainnya*).
  - Kebijakan pembatalan klaim yang telah didistribusikan: khusus role `admin`, mengembalikan stok kategori insentif secara atomik, dan menghapus entri distribusi terkait.
  - Pencatatan peristiwa penolakan dan pembatalan klaim ke tabel `audit_logs` secara transaksional.
  - Antarmuka `Distribusi.jsx` dilengkapi filter status klaim (Menunggu, Ditolak, Dibatalkan, Semua), modal aksi penolakan & pembatalan dengan alasan terstandar, dan badge status semantik.
  - Antarmuka `Klaim.jsx` menampilkan status terkini (`ditolak`/`dibatalkan`) beserta alasan penolakan/pembatalan bagi petani, serta memungkinkan pengajuan ulang klaim baru.
- **Fitur B (Ambang Batas Otomatis Verifikasi Warga):**
  - Konfigurasi ambang batas dinamis melalui variabel lingkungan: `VOTE_APPROVE_THRESHOLD` (default: 5), `VOTE_REJECT_THRESHOLD` (default: 3), dan `VOTE_AUTO_MODE` (`off` | `flag` | `auto`, default: `flag`).
  - Kalkulasi suara warga terverifikasi secara valid (1 suara per akun per foto, akun aktif, bukan pemilik lahan yang sama).
  - Mode `flag` memberikan label rekomendasi (`rekomendasi_setuju` atau `perlu_ditinjau`) pada `field_photos.community_recommendation` tanpa mengubah status foto.
  - Mode `auto` secara otomatis memvalidasi foto berstatus `menunggu_verifikasi` menjadi `terverifikasi` (`verified_by_system = true`) apabila suara setuju memenuhi threshold, suara tolak di bawah threshold, dan radius geofencing valid (jarak $\le$ 50m). Tidak ada penolakan otomatis (foto mencurigakan ditandai `perlu_ditinjau` untuk inspeksi manusia).
  - Endpoint `POST /api/verifications/override` untuk petugas/admin menganulir hasil verifikasi otomatis dengan catatan alasan wajib minimal 5 karakter, tercatat di Audit Log dengan aksi `verify_override`.
  - Antarmuka `Verifikasi.jsx` menampilkan progress bar suara warga terhadap ambang batas, badge rekomendasi warga / verifikasi otomatis, filter Prioritas Warga, dan modal anulir bagi petugas/admin.
- **Fitur C (Notifikasi Berbasis Event):**
  - Tabel `notifications` pada database PostgreSQL dan SQLite dengan kolom `user_id`, `type`, `title`, `message`, `data`, `read_at`, dan `created_at`.
  - Service terpusat `backend/src/utils/notificationService.js` untuk pembuatan notifikasi atomik dalam transaksi database dan pembersihan otomatis notifikasi usang (> 90 hari).
  - Endpoint API notifikasi: `GET /api/notifications` (dengan dukungan unread filter dan limit), `GET /api/notifications/unread-count`, `PATCH /api/notifications/:id/read`, dan `POST /api/notifications/read-all`.
  - Integrasi generator event: verifikasi resmi petugas, auto-verifikasi warga, unggahan foto baru, persetujuan klaim distribusi, penolakan klaim, dan pembatalan klaim.
  - Panel notifikasi interaktif di `Navbar.jsx`: tombol lonceng dengan badge jumlah unread (maksimal 9+), polling ringan berkala dengan pemeriksaan `document.visibilityState` (ramah baterai & bandwidth), list item dengan ikon semantik dan format waktu relatif, tombol tandai satu/semua dibaca, navigasi cerdas sesuai tipe event, dan empty state ramah pengguna.
- Test suite integrasi `advanced-features.integration.test.js` mencakup 11 pengujian komprehensif untuk Fitur A, B, dan C (seluruh 68 tes backend passing 100%).
- Pengujian E2E Playwright `advanced-features.spec.js` untuk memvalidasi interaksi Navbar notifikasi, filter Distribusi, dan prioritas Verifikasi.

- Rate limiter khusus upload foto (`uploadLimiter`) via `express-rate-limit` pada endpoint `POST /api/photos` dengan batas 30 unggahan per jam per pengguna (konfigurasi via `UPLOAD_RATE_LIMIT`), key generator user ID dengan fallback IP, `trust proxy`, dan penanganan status 429 ramah di frontend `Upload.jsx`.
- Test suite integrasi `photo.integration.test.js` untuk menguji kuota rate limiting upload foto per user tanpa mempengaruhi user lain.
- Aset visual perbandingan skala visual sebelum dan sesudah 80% pada `docs/screenshots/dashboard-scale-comparison.svg`.
- Token layout konsisten `--header-h` (4rem) dan `--sidebar-w` (16rem / 20rem) pada root CSS.
- Sistem batas keterbacaan teks minimum 12px aktual untuk token caption, badge, label, subtext, dan header tabel di bawah layout admin.
- Penegakan target sentuh interaktif mobile dan tablet minimal 40px pada seluruh elemen klik dan tautan admin.
- Komponen layout bersama `AdminLayout`, `Card`, `Button`, `Badge`, dan `StatCard` untuk standardisasi antarmuka admin pasca-login.
- Aset visual preview redesign dashboard admin pada `docs/screenshots/dashboard-preview.svg`.
- Komponen `BackToHome` pada halaman Login dan Register dengan target sentuh minimal 40px, data-testid, dan navigasi langsung ke beranda.
- Pengujian E2E Playwright untuk alur navigasi `BackToHome` dan validasi pemuatan serta vertical centering halaman auth pada resolusi desktop (1920x920, 1440x900, 1366x768).
- Proteksi keamanan backend dengan HTTP security headers via `helmet` dan rate limiting pada endpoint `/api/auth` (100 permintaan / 15 menit) via `express-rate-limit`.
- Validasi magic bytes (JPEG, PNG, WebP) pada `photoController.js` dan pengecekan ketat ekstensi/MIME pada `uploadMiddleware.js` untuk mencegah file spoofing.
- Validasi kedaluwarsa foto progres (maksimal 30 hari) dan keharusan status terverifikasi pada pengajuan klaim insentif (`incentiveController.js`).
- Logika UPSERT pada `community_verifications` dan `official_verifications` untuk mencegah duplikasi entri serta memperbarui waktu verifikasi.
- Konfigurasi ESLint frontend (`.eslintrc.cjs`) beserta dependensi `eslint-plugin-react` dan `eslint-plugin-react-hooks`.
- Dukungan responsivitas resolusi tinggi dan ultra-wide pada `frontend-web` dengan breakpoint Tailwind `3xl` (1920px) dan `4xl` (2560px), penyesuaian max-width layout, serta grid adaptif di halaman Dashboard, DataLahan, Fields, Katalog, Laporan, Upload, dan VerifikasiKomunitas.
- Layout auth tanpa scroll (`.auth-shell`) pada Login dan Register dengan adaptasi viewport height untuk layar pendek/keyboard virtual.
- Redesain landing page publik dan komponen `AuthShell` bersama untuk halaman auth.

### Changed

- Standardisasi antarmuka `Laporan.jsx` menggunakan `PageHeader` (dengan aksen dot ember & font Fraunces), token warna semantik (`text-foreground`, `text-muted-foreground`, `bg-muted/40`, `card`), dan kelas `.table-header`/`.table-cell` tanpa kelas warna Tailwind mentah.
- Penyelarasan format gambar yang didukung pada `Upload.jsx` (pesan validasi, dropzone, dan atribut `accept` pada `<input type="file">` kini konsisten mendukung JPG, PNG, dan WebP sesuai backend).
- Penegakan otorisasi role admin via middleware `authorizeRoles('admin')` pada route `/api/reports` dan `/api/reports/export` di `reportRoutes.js`.
- Penerapan skala visual proporsional 80% (root font-size 80% / 12.8px) khusus antarmuka admin/pasca-login pada desktop (`min-width: 1024px`) via `html.admin-mode` dan `html:has(.admin-layout)` tanpa memakai CSS zoom atau transform scale, dengan isolasi penuh sehingga halaman publik (Landing, Login, Register) tetap 100% (16px).
- Penyelarasan sistem desain dashboard admin dan seluruh halaman pasca-login dengan identitas visual publik (font serif Fraunces, latar krem hangat, palet forest & aksen terakota ember, pill navigation & button).
- Pembaruan utility classes komponen pada `frontend-web/src/index.css` (`.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-ghost-light`, `.card`, `.badge`, `.table-header`, `.table-cell`, `.input-field`, `.sidebar-link`).
- Pembaruan `Layout.jsx`, `Navbar.jsx`, `Sidebar.jsx`, dan `PageHeader.jsx` agar konsisten dengan branding "Zero Burning".
- Pembaruan visual halaman `Dashboard.jsx` (hero banner forest, stat cards seragam, dan quick actions palet terbatas).
- Konversi `frontend-web/playwright.config.js` dari CommonJS syntax (`require`/`module.exports`) ke ES module syntax (`import`/`export default`) sesuai `"type": "module"` pada `frontend-web/package.json`.
- Job `frontend-build` pada `.github/workflows/ci.yml` untuk memvalidasi linting dan build frontend pada pipeline CI.
- Konfigurasi database test SQLite terisolasi (`globalSetup.js`, `globalTeardown.js`, `setupEnv.js`) pada Jest runner sehingga seluruh unit dan integration test (53 test) dapat berjalan deterministik di lingkungan CI/CD tanpa dependensi eksternal.
- Halaman **Laporan Program** (`/laporan`) untuk admin dengan visualisasi ringkasan metrik (lahan, foto, klaim, petani), status lahan, stok kategori, tabel top 10 petani, dan tren bulanan 12 bulan terakhir.
- Fitur ekspor laporan program admin dalam format CSV dan JSON dengan timestamp.
- Route `/laporan` di `frontend-web/src/App.jsx` dan navigasi sidebar dengan ikon dokumen.
- Skrip migrasi SQLite di `database/`: `fix-columns.sql`, `migrate-safe.sql`, dan `migrate-sqlite.sql`.
- Ignored pattern untuk file database `*.db`, `*.sqlite*`, dan file backup di `.gitignore`.

### Changed

- Pembaruan workflow CI `.github/workflows/ci.yml`: upgrade `actions/checkout@v7` dan `actions/setup-node@v7` dengan Node.js 22 untuk menghapus peringatan deprecation Node 20 runner.
- Perbaikan assertion dan endpoint contract pada test integrasi (`auth.integration.test.js`, `field.integration.test.js`, `report.integration.test.js`).
- Konfigurasi `allowedHosts: ['.trycloudflare.com']` di `frontend-web/vite.config.js` untuk mendukung akses tunnel Cloudflare.
- Adaptasi controller backend (`authController`, `fieldController`, `photoController`, `verificationController`, `incentiveController`, `dashboardController`, `reportController`, `userController`, `auditController`, `otpService`) untuk kompatibilitas penuh SQLite dan PostgreSQL.
- Transaksi serialisasi dan locking pada adapter `SQLitePool` di `db-sqlite.js` untuk mencegah race condition.
- PERENCANAAN.md: FR-16 (Laporan/ekspor data) kini ditandai ✅ selesai.
- STATUS-IMPLEMENTASI.md: diperbarui status modul laporan program dan tanggal per 24 Oktober 2026.

- Integration tests backend (44 test cases untuk auth, field, report endpoints)
- Testing documentation dengan setup guide dan manual testing flow
- Halaman VerifyEmail (`/verify-email`): form OTP 6 digit, tombol resend dengan countdown 60 detik
- Verifikasi OTP dengan max 5 percobaan, error handling per percobaan
- Masked email display pada halaman verifikasi
- Success state dengan auto-redirect ke login setelah 2 detik
- Update Register flow: redirect ke `/verify-email` setelah sukses register
- Info box dengan tips cek folder spam/promotions
- Kolom `email_verified` dan `verified_at` di tabel `users`
- OTP service utility: generate OTP 6 digit, create/verify/resend OTP dengan ekspirasi
- Endpoint `POST /api/auth/send-otp` - generate dan kirim OTP ke email user
- Endpoint `POST /api/auth/verify-email` - verifikasi OTP dan set email_verified = true
- Endpoint `POST /api/auth/resend-otp` - buat OTP baru dan kirim ulang
- Mock email sending untuk development (log ke console)
- Unit tests untuk utility functions: audit log helper, geofencing distance calculation
- Input validation tests: NIK 16 digit, email format, password length, koordinat validity
- CSV export escaping tests dan datetime formatting tests
- 9 unit tests passing (geofencing, validasi, format)
- Endpoint `GET /api/audit-logs/export` untuk mengekspor audit log dalam format CSV atau JSON dengan filter.
- Tombol **Unduh** pada halaman Audit Log dengan dropdown menu untuk memilih format (CSV/JSON).
- Helper `convertToCSV()` untuk mengonversi data audit log ke format CSV dengan proper escaping.
- Metadata lengkap pada setiap pencatatan audit: nama field, koordinat, status foto, kategori klaim, dll.

### Changed

- Halaman **Audit Log** perbarui subtitle untuk mencakup aktivitas operasional (lahan/foto/verifikasi/klaim) selain administratif (role/status/katalog/stok).
- PERENCANAAN.md: FR-15 ditandai ✅ selesai, FR-16 ditandai ◐ sebagian (audit log export selesai, laporan progres belum).
- BR-20 diperluas: mencakup pencatatan lahan, foto, verifikasi, dan klaim; export audit log tersedia dalam CSV dan JSON.
- Registrasi mandiri petani melalui `POST /api/auth/register`: normalisasi email, validasi server, pembuatan profil `farmers`, dan penanganan email/NIK duplikat.
- Status pendaftaran berhasil pada halaman login beserta email yang otomatis terisi.
- Tautan “Daftar sebagai petani” pada halaman login, navigasi landing, hero, langkah cara kerja, CTA, dan footer.
- Endpoint `GET /api/dashboard` yang mengembalikan ringkasan role-aware: metrik program untuk admin/petugas, metrik personal untuk petani, serta aktivitas terbaru dari database.
- Integrasi dashboard web dengan API: kartu statistik, KPI banner, aktivitas terkini, dan status kesiapan klaim memakai data nyata; data mock dihapus.
- Loading skeleton, state error dengan tombol coba lagi, dan empty state aktivitas pada dashboard.
- Halaman **Distribusi Insentif** untuk petugas/admin: statistik antrean, pencarian, tabel klaim terverifikasi, modal pencatatan distribusi + bukti serah terima, dan riwayat distribusi.
- Halaman **Verifikasi Warga** untuk petani: kartu foto pending dari petani lain, jumlah suara komunitas, serta aksi setuju/tidak setuju yang dapat diubah.
- Endpoint `GET /api/incentives/claims/pending` untuk antrean distribusi petugas/admin.
- Endpoint `GET /api/incentives/distributions` untuk riwayat distribusi terbaru beserta totalnya.
- Endpoint `GET /api/verifications/community` untuk daftar foto pending petani lain, jumlah suara, dan status suara pengguna.
- Halaman **Profil & Keamanan** (`/profil`) untuk semua role: ringkasan akun, ubah nama/kontak sesuai role, dan ubah password.
- Endpoint `GET /api/auth/me`, `PATCH /api/auth/profile`, dan `PATCH /api/auth/password`.
- Endpoint `PATCH /api/fields/:id` dan `DELETE /api/fields/:id`; hapus lahan memakai soft delete dan ditolak bila masih ada klaim `diajukan`.
- Aksi ubah dan hapus pada kartu lahan beserta modal konfirmasi, state loading, dan notifikasi hasil.
- Mode admin pada halaman **Katalog**: ringkasan kategori/stok, tombol tambah kategori, modal tambah/kelola, serta notifikasi hasil.
- Endpoint admin `POST /api/incentives/categories` dan `PATCH /api/incentives/categories/:id` untuk menambah kategori serta mengubah nama, persyaratan, dan stok.
- **Status akun pengguna**: endpoint `PATCH /api/users/:id/status` dan aksi nonaktifkan/aktifkan pada halaman Pengguna; akun nonaktif tidak dapat login dan token aktifnya langsung ditolak.
- Filter status akun, badge `Nonaktif`, modal konfirmasi status, dan ringkasan jumlah akun nonaktif.
- Halaman **Data Lahan** (`/data-lahan`) untuk petugas/admin: daftar read-only seluruh lahan aktif, nama/kontak pemilik, tanaman, luas, koordinat, serta hitungan foto terverifikasi/menunggu/ditolak dan status foto terbaru.
- Pencarian, filter status foto, statistik lahan/luas, dan state loading/error/empty pada halaman Data Lahan.
- Endpoint `GET /api/fields` kini role-aware: petani melihat lahan miliknya, sedangkan petugas/admin melihat seluruh lahan aktif beserta data pemilik dan ringkasan foto.
- Halaman **Audit Log** (`/audit-log`) khusus admin: ringkasan aktivitas, riwayat perubahan, pencarian, filter akun/katalog/stok, serta state loading/error/empty.
- Endpoint `GET /api/audit-logs` untuk membaca audit log dengan filter `action`/`entity_type`/`q`, pagination `limit`/`offset`, dan ringkasan jumlah per kategori.
- Tabel `audit_logs` beserta index untuk mencatat pelaku, aksi, entitas, ringkasan, metadata, dan waktu kejadian.
- Pencatatan otomatis pembuatan akun, perubahan role, perubahan status akun, pembuatan/perubahan kategori, serta pengurangan stok akibat distribusi.
- Menu sidebar **Audit Log** khusus admin dengan proteksi route dan pembatasan endpoint.
- Menu sidebar dan aksi cepat dashboard untuk Distribusi (petugas/admin) serta Verifikasi Warga (petani).

### Changed

- Kebijakan akun: registrasi publik hanya untuk petani; akun petugas dan admin tetap dibuat administrator melalui menu Pengguna.
- Landing page kini mengarahkan pengunjung ke pendaftaran petani, sementara pengguna lama dapat memilih masuk ke sistem.
- FAQ, langkah “Daftar akun”, dan footer landing menjelaskan perbedaan registrasi petani mandiri dengan pembuatan akun petugas/admin.
- Menyederhanakan desain landing page: palet hijau-netral, tipografi Inter, hero dua kolom, kartu sederhana, dan tata letak yang lebih tenang.
- Mengganti kartu contoh verifikasi di hero dengan foto petani menanam padi di sawah.
- Membuat kontainer landing page memenuhi lebar layar dengan padding responsif.
- Menambahkan aksen warna hijau, kuning, dan biru pada statistik, ikon, serta kartu agar tampilan lebih hidup namun tetap sederhana.
- Melembutkan tampilan landing page dengan sudut membulat, kartu berwarna lembut, timeline langkah, dan tombol pill.
- Menambahkan favicon ZB serta metadata halaman utama.
- Menyesuaikan label dan CTA dashboard berdasarkan role; petani mendapat ringkasan personal tanpa feed aktivitas program.
- Menyempurnakan aksesibilitas dan perilaku UI: skip link, kontras, serta penutupan notifikasi via Escape/backdrop.
- Mengganti angka dampak ilustratif di landing dengan jaminan sistem yang faktual agar tidak bertentangan dengan data dashboard.
- "Ingat saya" kini menyimpan sesi di `localStorage`, sedangkan sesi tanpa "Ingat saya" disimpan di `sessionStorage`.
- Menambahkan `min-w-0` pada area konten agar tabel lebar tidak menyebabkan overflow horizontal di halaman mobile.
- Menyesuaikan kontras label, badge peringatan, tombol aksi, dan teks bantuan pada halaman distribusi/verifikasi komunitas.
- Meningkatkan kontras chip filter aktif (`.chip-active`) agar teks putih memenuhi rasio aksesibilitas pada latar hijau.
- Halaman Katalog menampilkan aksi dan ringkasan khusus admin tanpa mengubah tampilan petani/petugas.
- Nama pada navbar ikut diperbarui setelah profil disimpan; avatar/name navbar dan kartu profil sidebar kini menuju `/profil`.
- Manajemen pengguna kini menampilkan status aktif/nonaktif dan mencegah admin menonaktifkan akun sendiri.
- Menu **Data Lahan** ditambahkan untuk petugas/admin; mutasi lahan tetap khusus petani pemilik.
- Lahan nonaktif tidak lagi muncul pada antrean verifikasi komunitas/resmi dan tidak dapat dipakai untuk unggah foto atau klaim baru.
- Validasi input lahan dipusatkan agar tambah dan ubah lahan memakai aturan yang sama.
- Perubahan status akun, role, kategori, dan stok kini disimpan bersama audit log dalam transaksi yang sama; kegagalan menulis audit log membatalkan perubahan data.
- Perubahan role/status/katalog/stok tetap dilakukan dari halaman Pengguna atau Katalog; hasilnya langsung terlihat pada Audit Log tanpa pencatatan manual.

### Fixed

- Kolom `community_verifications.status` dan `official_verifications.status` diperlebar dari `VARCHAR(10)` ke `VARCHAR(20)` agar nilai `tidak_setuju` dan `tidak_lolos` dapat disimpan.
- Path static `/uploads` diperbaiki agar menyajikan berkas dari `backend/uploads`, sehingga foto tidak lagi 404 di UI.
- `taken_at` foto kini dikirim sebagai objek tanggal agar waktu lokal tersimpan konsisten dan tidak bergeser beberapa jam.
- Overflow horizontal halaman distribusi pada viewport mobile diperbaiki.
- Kontras label NIK/NIP, badge “Anda”, dan teks “Akun Anda” pada halaman Pengguna diperbaiki; modal pengguna kini memakai role dialog, label aksesibel, dan dapat ditutup dengan Escape.

### Docs

- Memperbarui status implementasi, perencanaan (versi 1.11.0), README, README backend, dan changelog untuk registrasi petani mandiri, status akun, data lahan petugas/admin, pengelolaan katalog admin, audit log administratif, halaman distribusi, verifikasi warga, profil, serta ubah/hapus lahan.

### Rencana

- Verifikasi email/WhatsApp pada registrasi, perluasan audit log ke aktivitas operasional, serta kebijakan hapus permanen/retensi akun dan audit log.
- Unit/integration test backend (ESLint sudah aktif).
- Pembangunan aplikasi mobile Flutter petani/petugas.
- Persiapan deployment produksi (object storage, HTTPS, ganti password admin).

---

## [1.4.0] - 2026-10-21

### Added

- Integrasi halaman **Lahan** dengan API: daftar lahan, tambah lahan, statistik luas/foto, koordinat GPS, dan progres verifikasi.
- Integrasi halaman **Unggah Foto** dengan API: pilih lahan, pengambilan lokasi GPS, unggah multipart, hash SHA-256, dan riwayat 30 unggahan terbaru.
- Integrasi halaman **Verifikasi** dengan API: daftar semua status, pencarian petani/lahan, thumbnail, serta aksi setujui/tolak.
- Integrasi halaman **Klaim** dengan API: pilih kategori/lahan, validasi lahan terverifikasi dan stok, stepper, serta riwayat klaim.
- Integrasi halaman **Katalog** dengan API: daftar kategori, stok, filter, pencarian, dan tautan pengajuan klaim.
- Endpoint `GET /api/photos` untuk daftar foto milik petani (filter `field_id` opsional).
- Endpoint `GET /api/verifications` untuk daftar foto semua status beserta nama petani (filter `status` opsional).
- Endpoint `GET /api/incentives/claims` untuk riwayat klaim petani beserta lahan, kategori, dan distribusi.
- Deteksi foto duplikat per lahan berdasarkan hash SHA-256 (HTTP 409).
- Utilitas format tanggal/luas/koordinat di `frontend-web/src/lib/format.js`.
- Proxy Vite `/uploads` agar foto lokal tampil di lingkungan pengembangan.

### Changed

- `GET /api/fields` dan `POST /api/fields` kini khusus role `petani`.
- Detail lahan memeriksa kepemilikan: petani hanya dapat mengakses lahannya sendiri.
- Geofencing memvalidasi koordinat, memeriksa kepemilikan lahan, dan menghapus berkas sementara saat validasi gagal.
- Pengajuan klaim menolak kategori tanpa stok, lahan tanpa foto terverifikasi, dan klaim aktif ganda untuk lahan/kategori yang sama.
- `POST /api/incentives/distributions` kini hanya membutuhkan `claim_id` dan `receipt_proof` opsional; `category_id` mengikuti klaim.
- Distribusi berjalan dalam transaksi, mengubah status klaim menjadi `disetujui`, dan mengurangi stok kategori sebanyak 1 tanpa boleh negatif.
- `taken_at` pada unggah foto otomatis memakai waktu server bila tidak dikirim.
- Berkas unggahan dibersihkan bila penyimpanan gagal atau duplikat.
- `/api/verifications/pending` dibatasi untuk petugas/admin; verifikasi komunitas khusus petani.
- Aksi verifikasi resmi memvalidasi keberadaan foto dan status `lolos`/`tidak_lolos`.

### Security

- Petani tidak dapat mengunggah foto ke lahan milik petani lain.
- Foto identik tidak dapat diunggah berulang kali pada lahan yang sama.
- Petani tidak dapat memberikan verifikasi komunitas pada foto lahannya sendiri.
- Daftar verifikasi hanya dapat diakses petugas dan admin.

### Docs

- Memperbarui status implementasi, perencanaan, README, dan README backend.

---

## [1.3.0] - 2026-10-21

### Added

- Landing page publik di `/` berisi hero, masalah & solusi, cara kerja lima langkah, fitur verifikasi, manfaat per aktor, pratinjau katalog insentif, kebijakan pendaftaran akun, FAQ interaktif, CTA, dan footer.
- Navigasi publik responsif (menu mobile) dengan tombol masuk/dashboard sesuai status login.
- Ilustrasi kartu verifikasi contoh (foto, GPS, jarak, hash) pada hero.

### Changed

- Dashboard admin dipindah dari `/` ke `/dashboard`; route `/` kini publik.
- Route tak dikenal diarahkan ke landing page.
- Statistik dampak tidak ditampilkan sebagai angka nyata; landing memakai indikator fitur yang faktual.

### Docs

- Memperbarui perencanaan, status implementasi, dan README untuk landing page.

---

## [1.2.0] - 2026-10-21

### Added

- Modul **Manajemen Pengguna** khusus admin: statistik pengguna, filter role, pencarian, daftar pengguna + profil, tambah pengguna, dan ubah hak akses.
- Endpoint admin `GET /api/users`, `POST /api/users`, dan `PATCH /api/users/:id/role`.
- Halaman Login terhubung ke `/api/auth/login` dengan penyimpanan token, pesan error, dan redirect.
- `AuthContext` + instance axios dengan header `Authorization: Bearer`.
- Guard route `RequireAuth` & `RequireAdmin` serta menu sidebar dinamis berdasarkan role.
- Profil pengguna (nama, role, inisial) pada navbar dan sidebar, termasuk tombol keluar.
- Akun admin awal melalui seed: `admin@zeroburning.id` (password pengembangan di `database/seed.sql`).

### Changed

- Registrasi publik sekarang hanya menerima role `petani` dan `petugas`.
- `authenticateToken` membaca ulang role dan profil dari database setiap request agar perubahan hak akses langsung berlaku.
- Seed kategori insentif dibuat idempoten (tidak menggandakan data saat dijalankan ulang).

### Security

- Menutup celah pendaftaran admin melalui endpoint publik.
- Admin tidak dapat mengubah role akunnya sendiri.
- Password minimal 6 karakter dan email dinormalisasi menjadi huruf kecil.
- Seluruh endpoint manajemen pengguna dilindungi `authorizeRoles('admin')`.

### Docs

- Memperbarui perencanaan, status implementasi, README, dan README backend sesuai fitur baru.

### Fixed

- Perubahan role tidak lagi tertunda sampai token JWT kedaluwarsa.

---

## [1.1.0] - 2026-10-21

### Added

- Dokumen pedoman sistem: `docs/PERENCANAAN.md`, `docs/ATURAN.md`, `docs/STATUS-IMPLEMENTASI.md`, `docs/CHANGELOG.md`.
- `CONTRIBUTING.md` sebagai panduan kontribusi.
- Komponen `PageHeader` untuk konsistensi judul halaman.
- Kelas komponen & animasi baru di `frontend-web/src/index.css` (`.card`, `.btn-primary`, `.chip`, `.badge-*`, `.icon-tile`, fade-up, dll.).
- Halaman Login split-screen dengan panel branding.

### Changed

- Redesign UI/UX seluruh dashboard web:
  - Dashboard: banner gradient, kartu statistik, timeline aktivitas, aksi cepat.
  - Lahan: ringkasan status, kartu progres verifikasi, modal gradient.
  - Unggah Foto: layout dua kolom, preview foto + hash, panduan bernomor.
  - Verifikasi: kartu statistik, tab filter, pencarian, tabel dengan aksi setujui/tolak.
  - Klaim: stepper tiga langkah, kartu kategori dengan stok, panel konfirmasi, riwayat.
  - Katalog: chip filter, pencarian, kartu stok dan harga.
- Navbar menampilkan ikon perisai gradient + identitas "Zero Burning / Admin Panel".
- Struktur `README.md` diperbarui mengikuti implementasi nyata (tanpa PostGIS, menyertakan dokumen pedoman).
- `frontend-web/package.json` memakai `"type": "module"` untuk menghilangkan peringatan Node.

### Fixed

- Peringatan reparsing ES module pada saat build Vite.
- Ketidaksesuaian dokumentasi lama yang masih menyebut PostGIS.

### Docs

- Mencatat seluruh penyimpangan implementasi terhadap rencana awal (PostGIS, MinIO, Tailwind, entry point, data mock, dan lainnya).

---

## [1.0.0] - 2026-10-21

### Added

- Struktur monorepo: `backend/`, `frontend-web/`, `frontend-mobile/`, `database/`.
- Backend Express: autentikasi JWT, pengelolaan lahan, unggah foto, verifikasi komunitas & petugas, katalog/klaim/distribusi insentif.
- Geofencing radius 50 meter dengan formula Haversine.
- Hash SHA-256 untuk integritas foto; penyimpanan lokal `uploads/`.
- Skema database PostgreSQL 10 tabel dan seed 3 kategori insentif.
- Script root: `install:all`, `dev`, `start`, `build:web`, `db:start`, `db:stop`, `db:setup`.
- Dashboard web React + Vite + Tailwind (versi awal).
- Workflow CI dasar (`.github/workflows/ci.yml`).
- Skeleton aplikasi mobile Flutter.

### Fixed

- Script `dev`/`start` backend menunjuk entry point yang benar (`server.js`).
- `farmerId`/`officerId` tidak terbaca pada controller akibat middleware terpisah.
- Ikon `Corn` tidak tersedia di `lucide-react` (diganti `Wheat`).
- Konflik nama komponen `Upload` pada halaman Unggah.
- `App.js` berisi JSX (di-rename menjadi `App.jsx`).
- Tailwind v4 tidak kompatibel dengan konfigurasi (diturunkan ke v3.4.17).
