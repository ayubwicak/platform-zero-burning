import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, AlertTriangle } from 'lucide-react';

export default function SyaratPenggunaan() {
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
            <FileText className="h-3.5 w-3.5 text-primary" /> Dokumen Hukum & Pedoman Partisipasi
          </div>
          <h1 className="font-display text-4xl sm:text-5xl tracking-tight text-foreground">
            Syarat & Ketentuan Penggunaan
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            Syarat dan ketentuan ini mengatur hak, kewajiban, dan tata tertib keikutsertaan petani dan petugas dalam sistem verifikasi program insentif Zero Burning.
          </p>
        </div>

        <article className="mt-10 space-y-8 text-sm leading-relaxed text-foreground sm:text-base">
          <section className="space-y-3 rounded-2xl border border-border bg-card p-6 sm:p-8">
            <h2 className="font-display text-xl text-primary sm:text-2xl">
              1. Komitmen Bebas Bakar (Zero Burning)
            </h2>
            <p className="text-muted-foreground">
              Setiap peserta yang mendaftarkan lahan berkomitmen secara sukarela dan bersungguh-sungguh untuk tidak melakukan pembakaran jerami, sisa biomassa panen, atau semak belukar pada lahan yang didaftarkan selama masa pengolahan dan persiapan tanam.
            </p>
          </section>

          <section className="space-y-3 rounded-2xl border border-border bg-card p-6 sm:p-8">
            <h2 className="font-display text-xl text-primary sm:text-2xl">
              2. Ketentuan Pendaftaran Akun & Lahan
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
              <li>Pendaftar wajib mengisi data identitas yang benar, termasuk NIK dan nomor kontak yang dapat dihubungi.</li>
              <li>Titik koordinat lahan yang didaftarkan harus mencerminkan posisi sebenarnya dari lahan yang dikelola petani.</li>
              <li>Satu akun petani berhak mendaftarkan beberapa petak lahan selama lahan tersebut memang berada di bawah pengelolaan petani bersangkutan.</li>
            </ul>
          </section>

          <section className="space-y-3 rounded-2xl border border-border bg-card p-6 sm:p-8">
            <h2 className="font-display text-xl text-primary sm:text-2xl">
              3. Ketentuan Pengunggahan Bukti Foto
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
              <li>Foto harus diambil di lokasi secara langsung dalam radius maksimal 50 meter dari titik koordinat lahan.</li>
              <li>Dilarang mengunggah foto duplikat, foto hasil tangkapan layar (screenshot), foto lahan orang lain tanpa hak, atau foto yang dimanipulasi secara digital.</li>
              <li>Setiap berkas foto akan dibuatkan sidik jari digital (hash SHA-256) untuk memastikan keaslian dan mencegah klaim ganda.</li>
            </ul>
          </section>

          <section className="space-y-3 rounded-2xl border border-border bg-card p-6 sm:p-8">
            <h2 className="font-display text-xl text-primary sm:text-2xl">
              4. Penyaluran & Pembatalan Insentif
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
              <li>Pemberian insentif (benih unggul, pupuk organik, atau alat olah lahan) tunduk pada ketersediaan alokasi bantuan pada periode berjalan.</li>
              <li>Status verifikasi dapat dianulir (override) oleh petugas berwenang jika ditemukan ketidaksesuaian nyata di lapangan dengan alasan tertulis dan terdokumentasi dalam audit log.</li>
              <li>Penyelenggara berhak membatalkan klaim insentif jika ditemukan indikasi kecurangan atau pelanggaran komitmen tanpa bakar.</li>
            </ul>
          </section>

          <section className="space-y-3 rounded-2xl border border-border bg-card p-6 sm:p-8">
            <h2 className="font-display text-xl text-primary sm:text-2xl">
              5. Bantuan & Pengaduan
            </h2>
            <p className="text-muted-foreground">
              Apabila terdapat perselisihan data atau kendala teknis verifikasi, petani dapat menyampaikan klarifikasi kepada petugas lapangan setempat atau melalui email:{' '}
              <a href={`mailto:${contactEmail}`} className="font-semibold text-primary underline">
                {contactEmail}
              </a>.
            </p>
          </section>
        </article>
      </main>

      <footer className="mt-16 border-t border-border bg-card py-8 text-center text-xs text-muted-foreground">
        <p>© 2026 Zero Burning · Draf Syarat Penggunaan</p>
      </footer>
    </div>
  );
}
