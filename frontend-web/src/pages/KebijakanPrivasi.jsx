import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, AlertTriangle } from 'lucide-react';

export default function KebijakanPrivasi() {
  const contactEmail = import.meta.env.VITE_CONTACT_EMAIL || 'bantuan@zeroburning.id';

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      {/* Header Publik Ringkas */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5" aria-label="Beranda Zero Burning">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-primary font-display text-lg text-primary-foreground">
              Z
            </span>
            <span className="font-display text-xl">Zero Burning</span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Beranda
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:py-16">
        {/* Banner Penanda Draf */}
        <div className="mb-8 flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 sm:text-sm">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="font-semibold">
              Draf dokumen — Perlu ditinjau oleh pihak hukum dan penyelenggara resmi sebelum rilis final.
            </p>
            <p className="mt-1 text-amber-800/90">
              Terakhir diperbarui: 30 Oktober 2026.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs uppercase tracking-wider text-muted-foreground">
            <Shield className="h-3.5 w-3.5 text-primary" /> Dokumen Hukum & Keterbukaan
          </div>
          <h1 className="font-display text-4xl sm:text-5xl tracking-tight text-foreground">
            Kebijakan Privasi
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            Kebijakan ini menjelaskan bagaimana platform Zero Burning mengumpulkan, menggunakan,
            menyimpan, dan melindungi data pribadi yang Anda berikan dalam pelaksanaan program insentif pertanian tanpa membakar.
          </p>
        </div>

        <article className="mt-10 space-y-8 text-sm leading-relaxed text-foreground sm:text-base">
          <section className="space-y-3 rounded-2xl border border-border bg-card p-6 sm:p-8">
            <h2 className="font-display text-xl text-primary sm:text-2xl">
              1. Data yang Dikumpulkan
            </h2>
            <p className="text-muted-foreground">
              Untuk memverifikasi keaslian praktik tanpa bakar dan mendistribusikan insentif secara tepat sasaran, platform mengumpulkan data berikut:
            </p>
            <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
              <li>
                <strong className="text-foreground">Identitas Pribadi:</strong> Nama lengkap, Nomor Induk Kependudukan (NIK 16 digit), alamat domisili, dan nomor telepon aktif/email.
              </li>
              <li>
                <strong className="text-foreground">Data Lahan Pertanian:</strong> Nama penanda lahan, perkiraan luas lahan (dalam hektare), komoditas tanaman, alamat lahan, dan titik koordinat geografis (latitude dan longitude).
              </li>
              <li>
                <strong className="text-foreground">Bukti Visual Lapangan:</strong> Foto progres kondisi lahan, metadata waktu pengambilan, koordinat GPS saat pemotretan, dan sidik jari digital berkas (hash SHA-256).
              </li>
            </ul>
          </section>

          <section className="space-y-3 rounded-2xl border border-border bg-card p-6 sm:p-8">
            <h2 className="font-display text-xl text-primary sm:text-2xl">
              2. Tujuan Penggunaan Data
            </h2>
            <p className="text-muted-foreground">
              Data yang dikumpulkan hanya digunakan untuk keperluan teknis dan operasional program:
            </p>
            <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
              <li>Memvalidasi bahwa foto diambil langsung di lokasi lahan (validasi radius maksimal 50 meter).</li>
              <li>Mencegah manipulasi atau duplikasi foto bukti untuk klaim ganda.</li>
              <li>Memproses permohonan klaim dan menyalurkan bantuan insentif (benih, pupuk, atau alat) kepada petani yang berhak.</li>
              <li>Menyusun laporan agregat dampak lingkungan tanpa membocorkan identitas perorangan.</li>
            </ul>
          </section>

          <section className="space-y-3 rounded-2xl border border-border bg-card p-6 sm:p-8">
            <h2 className="font-display text-xl text-primary sm:text-2xl">
              3. Dasar Persetujuan & Hak Pengguna
            </h2>
            <p className="text-muted-foreground">
              Pengumpulan data didasarkan pada persetujuan eksplisit yang Anda berikan saat mendaftar akun. Anda memiliki hak untuk:
            </p>
            <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
              <li>Melihat seluruh riwayat data lahan, foto, dan klaim Anda melalui antarmuka dashboard.</li>
              <li>Memperbarui atau mengoreksi data profil dan lahan Anda jika terjadi kesalahan data.</li>
              <li>Mengajukan permohonan penonaktifan akun atau penghapusan data dengan menghubungi penyelenggara program.</li>
            </ul>
          </section>

          <section className="space-y-3 rounded-2xl border border-border bg-card p-6 sm:p-8">
            <h2 className="font-display text-xl text-primary sm:text-2xl">
              4. Pihak yang Dapat Mengakses Data
            </h2>
            <p className="text-muted-foreground">
              Akses terhadap data dibatasi secara ketat berdasarkan peran (Role-Based Access Control):
            </p>
            <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
              <li><strong className="text-foreground">Petani:</strong> Hanya dapat mengakses data akun dan lahan miliknya sendiri.</li>
              <li><strong className="text-foreground">Petugas Lapangan:</strong> Mengakses data lahan dan foto untuk keperluan verifikasi lapangan di wilayah tugasnya.</li>
              <li><strong className="text-foreground">Administrator:</strong> Mengakses audit log dan data distribusi untuk pengawasan penyaluran bantuan.</li>
              <li>Data Anda <strong className="text-foreground">tidak pernah dijual, disewakan, atau dibagikan</strong> kepada pihak ketiga di luar kemitraan resmi program.</li>
            </ul>
          </section>

          <section className="space-y-3 rounded-2xl border border-border bg-card p-6 sm:p-8">
            <h2 className="font-display text-xl text-primary sm:text-2xl">
              5. Keamanan & Retensi Data
            </h2>
            <p className="text-muted-foreground">
              Kata sandi pengguna diacak dengan metode hashing satu arah yang aman. Akses API diamankan menggunakan JSON Web Token (JWT) dan transmisi data dilindungi protokol SSL/TLS. Data riwayat verifikasi dan distribusi insentif disimpan selama program berjalan untuk keperluan audit akuntabilitas publik.
            </p>
          </section>

          <section className="space-y-3 rounded-2xl border border-border bg-card p-6 sm:p-8">
            <h2 className="font-display text-xl text-primary sm:text-2xl">
              6. Cara Menghubungi Kami
            </h2>
            <p className="text-muted-foreground">
              Jika Anda memiliki pertanyaan mengenai privasi data Anda atau ingin mengajukan hak koreksi, silakan hubungi tim pengelola program melalui email resmi di{' '}
              <a href={`mailto:${contactEmail}`} className="font-semibold text-primary underline">
                {contactEmail}
              </a>.
            </p>
          </section>
        </article>
      </main>

      <footer className="mt-16 border-t border-border bg-card py-8 text-center text-xs text-muted-foreground">
        <p>© 2026 Zero Burning · Draf Kebijakan Privasi</p>
      </footer>
    </div>
  );
}
