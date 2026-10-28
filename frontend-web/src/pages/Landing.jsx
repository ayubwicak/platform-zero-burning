import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navLinks = [
  { label: 'Tentang', href: '#tentang' },
  { label: 'Cara Kerja', href: '#cara-kerja' },
  { label: 'Manfaat', href: '#manfaat' },
  { label: 'Katalog', href: '#katalog' },
  { label: 'FAQ', href: '#faq' },
];

const stats = [
  { value: '50 m', label: 'radius foto' },
  { value: '2 lapis', label: 'verifikasi' },
  { value: '5', label: 'langkah' },
];

const steps = [
  ['Daftar akun', 'Petani mendaftar mandiri atau dibantu petugas setempat.'],
  ['Daftarkan lahan', 'Simpan nama, luas, jenis tanaman, dan titik koordinat lahan.'],
  ['Unggah bukti foto', 'Foto diambil langsung di lokasi, maksimal 50 meter dari titik.'],
  ['Verifikasi dua lapis', 'Sistem memeriksa otomatis, lalu petugas meninjau di lapangan.'],
  ['Klaim insentif', 'Lahan terverifikasi dapat ditukar dengan bantuan dari katalog.'],
];

const pillars = [
  ['50 m', 'Radius validasi lokasi foto terhadap titik lahan.'],
  ['SHA-256', 'Sidik jari setiap foto — perubahan sekecil apa pun terdeteksi.'],
  ['2 lapis', 'Pemeriksaan sistem dan petugas sebelum insentif cair.'],
  ['Terbuka', 'Riwayat klaim dan status tercatat, bisa ditelusuri kapan saja.'],
];

const testimonials = [
  [
    'Dulu saya bakar jerami karena cepat. Sekarang diolah jadi pupuk, dan dapat bibit gratis.',
    'Budi Santoso',
    'Petani padi, Indramayu',
  ],
  [
    'Verifikasi jadi rapi. Foto sudah ada koordinatnya, saya tinggal cek di lapangan.',
    'Siti Rahayu',
    'Petugas lapangan, Karawang',
  ],
  [
    'Dashboard membantu kami melihat sebaran lahan tanpa bakar secara nyata.',
    'Ir. Ahmad Wijaya',
    'Dinas Pertanian',
  ],
];

const catalog = [
  ['Benih padi unggul', '5 kg per lahan terverifikasi'],
  ['Pupuk organik', 'Pengganti hara dari jerami yang tidak dibakar'],
  ['Alat pengolah lahan', 'Pinjam alat untuk musim tanam berikutnya'],
];

const faqs = [
  {
    q: 'Siapa yang dapat menggunakan sistem ini?',
    a: 'Sistem digunakan oleh petani, petugas lapangan, dan admin program. Petani dapat mendaftar sendiri melalui halaman registrasi, lalu masuk menggunakan email dan password yang dibuatnya. Akun petugas lapangan dan admin dibuat oleh administrator.',
  },
  {
    q: 'Bagaimana bukti foto divalidasi?',
    a: 'Foto harus diambil dalam radius maksimal 50 meter dari titik lahan. Server menghitung jarak, membuat hash SHA-256 berkas, lalu foto masuk antrean verifikasi komunitas dan petugas.',
  },
  {
    q: 'Mengapa foto bisa ditolak?',
    a: 'Foto ditolak bila lokasi pengambilan berada di luar radius lahan, berkas bukan gambar yang valid, atau hasil verifikasi petugas menyatakan bukti tidak sesuai.',
  },
  {
    q: 'Insentif apa yang tersedia?',
    a: 'Katalog awal mencakup benih padi, pupuk organik, dan alat pengolahan lahan. Klaim hanya dapat diajukan untuk lahan yang sudah terverifikasi zero burning.',
  },
  {
    q: 'Apakah data pengguna aman?',
    a: 'Password disimpan dalam bentuk hash, akses memakai token JWT, dan setiap endpoint diperiksa berdasarkan role pengguna.',
  },
];

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  const primaryHref = isAuthenticated ? '/dashboard' : '/register';
  const primaryLabel = isAuthenticated ? 'Buka dashboard' : 'Daftar sebagai petani';
  const navPrimaryLabel = isAuthenticated ? 'Dashboard' : 'Daftar';

  return (
    <div className="public-landing min-h-screen bg-background font-sans text-foreground">
      <a href="#main-content" className="skip-link">
        Lewati ke konten utama
      </a>

      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5" aria-label="Zero Burning">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-primary font-display text-lg text-primary-foreground">
              Z
            </span>
            <span className="hidden whitespace-nowrap font-display text-xl min-[360px]:inline">
              Zero Burning
            </span>
          </Link>

          <nav className="hidden gap-8 text-sm text-muted-foreground md:flex" aria-label="Navigasi utama">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3 text-sm">
            {!isAuthenticated && (
              <Link
                to="/login"
                className="hidden text-muted-foreground transition-colors hover:text-foreground sm:inline"
              >
                Masuk
              </Link>
            )}
            <Link
              to={primaryHref}
              className="rounded-full bg-primary px-4 py-2.5 font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 sm:px-5"
            >
              {navPrimaryLabel}
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="rounded-lg p-2 text-foreground transition-colors hover:bg-secondary md:hidden"
              aria-label={menuOpen ? 'Tutup menu' : 'Buka menu'}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div id="mobile-menu" className="border-t border-border bg-background px-6 py-4 md:hidden">
            <nav className="space-y-1" aria-label="Navigasi seluler">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  {link.label}
                </a>
              ))}
            </nav>
            {!isAuthenticated && (
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="mt-3 flex w-full items-center justify-center rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
              >
                Masuk
              </Link>
            )}
            <Link
              to={primaryHref}
              onClick={() => setMenuOpen(false)}
              className="mt-2 flex w-full items-center justify-center rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              {primaryLabel}
            </Link>
          </div>
        )}
      </header>

      <main id="main-content">
        <section className="mx-auto grid max-w-7xl gap-12 px-6 pb-20 pt-12 lg:grid-cols-12 lg:pt-20">
          <div className="animate-rise lg:col-span-6 lg:pt-10">
            <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-ember" /> Program insentif petani
            </p>
            <h1 className="text-5xl leading-[1.02] tracking-tight md:text-7xl">
              Olah lahan <em className="text-ember">tanpa</em> membakar.
              <br />
              <span className="text-primary">Panen insentifnya.</span>
            </h1>
            <p className="mt-8 max-w-lg text-lg leading-relaxed text-muted-foreground">
              Zero Burning menghubungkan petani, petugas, dan pengelola program melalui bukti
              foto berbasis GPS — supaya praktik baik benar-benar dihargai.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                to={primaryHref}
                className="rounded-full bg-primary px-7 py-4 font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-transform hover:-translate-y-0.5"
              >
                {primaryLabel}
              </Link>
              <a
                href="#cara-kerja"
                className="rounded-full border border-foreground/20 px-7 py-4 font-semibold transition-colors hover:bg-secondary"
              >
                Lihat cara kerja →
              </a>
            </div>
            {!isAuthenticated && (
              <p className="mt-4 text-sm text-muted-foreground">
                Sudah punya akun?{' '}
                <Link to="/login" className="font-semibold text-primary hover:underline">
                  Masuk ke sistem
                </Link>
              </p>
            )}
            <dl className="mt-14 grid max-w-lg grid-cols-3 gap-6 border-t border-border pt-6">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <dt className="font-display text-3xl">{stat.value}</dt>
                  <dd className="text-sm text-muted-foreground">{stat.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative lg:col-span-6">
            <img
              src="/images/hero-rice-field.jpg"
              alt="Petani menanam padi di sawah saat pagi"
              width="1280"
              height="1536"
              className="h-[420px] w-full rounded-[2rem] object-cover sm:h-[520px] lg:h-[640px]"
            />
            <div className="absolute -bottom-6 left-6 right-6 max-w-xs rounded-2xl bg-card p-5 shadow-xl">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Foto terverifikasi
              </p>
              <p className="mt-1 font-display text-lg">Lahan 0,8 ha · Indramayu</p>
              <p className="mt-2 flex items-center gap-2 text-sm text-primary">
                <span className="h-2 w-2 rounded-full bg-primary" /> 12 m dari titik lahan
              </p>
            </div>
          </div>
        </section>

        <section id="tentang" className="scroll-mt-24 bg-forest text-forest-foreground">
          <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 md:py-24 lg:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-ember">Mengapa Zero Burning</p>
              <h2 className="mt-4 text-4xl md:text-5xl">Membakar lahan bukan satu-satunya cara.</h2>
            </div>
            <div className="space-y-6 text-lg leading-relaxed text-forest-foreground/80">
              <p>
                Membakar memang cepat dan murah. Tapi asapnya merusak kesehatan, tanahnya
                kehilangan unsur hara, dan api mudah merambat ke lahan tetangga.
              </p>
              <p>
                Kami ingin petani yang memilih cara lain mendapatkan imbalan yang nyata — dengan
                bukti yang bisa dipercaya semua pihak.
              </p>
            </div>
          </div>
        </section>

        <section id="cara-kerja" className="mx-auto max-w-7xl scroll-mt-24 px-6 py-20 md:py-24">
          <p className="text-xs uppercase tracking-[0.2em] text-ember">Cara kerja</p>
          <h2 className="mt-4 max-w-2xl text-4xl md:text-5xl">
            Lima langkah dari lahan ke insentif.
          </h2>
          <ol className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-border bg-border md:grid-cols-5">
            {steps.map(([title, description], index) => (
              <li key={title} className="bg-card p-7 transition-colors hover:bg-secondary">
                <span className="font-display text-5xl text-ember/80">0{index + 1}</span>
                <h3 className="mt-6 text-xl">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="manfaat" className="scroll-mt-24 bg-secondary">
          <div className="mx-auto max-w-7xl px-6 py-20 md:py-24">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <h2 className="max-w-xl text-4xl md:text-5xl">
                Bukti yang bisa diperiksa, bukan sekadar janji.
              </h2>
              <p className="max-w-sm text-muted-foreground">
                Setiap foto melewati pemeriksaan yang sama sebelum insentif dicairkan.
              </p>
            </div>
            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {pillars.map(([value, description]) => (
                <div key={value} className="rounded-3xl bg-card p-8">
                  <p className="font-display text-4xl text-primary">{value}</p>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-20 md:py-24">
          <p className="text-xs uppercase tracking-[0.2em] text-ember">Suara dari lapangan</p>
          <h2 className="sr-only">Suara dari lapangan</h2>
          <div className="mt-10 grid gap-10 lg:grid-cols-3">
            {testimonials.map(([quote, name, role]) => (
              <figure key={name} className="border-l-2 border-ember pl-6">
                <blockquote className="font-display text-2xl leading-snug">“{quote}”</blockquote>
                <figcaption className="mt-6 text-sm">
                  <span className="font-semibold">{name}</span>
                  <span className="text-muted-foreground"> · {role}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section id="katalog" className="mx-auto max-w-7xl scroll-mt-24 px-6 pb-20 md:pb-24">
          <div className="rounded-[2rem] border border-border p-8 md:p-14">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <h2 className="text-4xl md:text-5xl">Bantuan untuk pertanian tanpa membakar.</h2>
              <Link
                to={primaryHref}
                className="rounded-full bg-secondary px-5 py-2.5 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-accent"
              >
                {isAuthenticated ? 'Buka dashboard' : 'Daftar untuk mengakses'} →
              </Link>
            </div>
            <div className="mt-12 divide-y divide-border">
              {catalog.map(([title, description], index) => (
                <div key={title} className="flex flex-wrap items-baseline justify-between gap-4 py-6">
                  <div className="flex items-baseline gap-6">
                    <span className="text-sm text-muted-foreground">0{index + 1}</span>
                    <h3 className="text-2xl md:text-3xl">{title}</h3>
                  </div>
                  <p className="text-muted-foreground">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="mx-auto grid max-w-7xl scroll-mt-24 gap-12 px-6 pb-20 md:pb-24 lg:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-ember">FAQ</p>
            <h2 className="mt-4 text-4xl md:text-5xl">Pertanyaan yang sering diajukan.</h2>
          </div>
          <div className="lg:col-span-2">
            {faqs.map((faq, index) => {
              const open = openFaq === index;
              return (
                <div key={faq.q} className="border-b border-border py-6">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? -1 : index)}
                    className="flex w-full items-center justify-between gap-4 text-left text-lg font-semibold"
                    aria-expanded={open}
                    aria-controls={`faq-panel-${index}`}
                    id={`faq-trigger-${index}`}
                  >
                    <span>{faq.q}</span>
                    <span
                      aria-hidden="true"
                      className={`text-2xl text-ember transition-transform ${open ? 'rotate-45' : ''}`}
                    >
                      +
                    </span>
                  </button>
                  {open && (
                    <p
                      id={`faq-panel-${index}`}
                      role="region"
                      aria-labelledby={`faq-trigger-${index}`}
                      className="mt-3 max-w-2xl text-muted-foreground"
                    >
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-16">
          <div className="rounded-[2rem] bg-ember px-8 py-16 text-center text-ember-foreground md:py-24">
            <h2 className="mx-auto max-w-3xl text-4xl md:text-6xl">
              Siap mengolah lahan tanpa membakar?
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-ember-foreground/90">
              {isAuthenticated
                ? 'Pantau lahan, unggah bukti, dan ajukan insentif dalam satu sistem.'
                : 'Daftar sebagai petani dan mulai kumpulkan bukti praktik tanpa membakar.'}
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link
                to={primaryHref}
                className="inline-block rounded-full bg-forest px-8 py-4 font-semibold text-forest-foreground transition-transform hover:-translate-y-0.5"
              >
                {primaryLabel}
              </Link>
              <a
                href="#cara-kerja"
                className="inline-block rounded-full border border-ember-foreground/30 px-8 py-4 font-semibold text-ember-foreground transition-colors hover:bg-ember-foreground/10"
              >
                Lihat cara kerja
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-forest text-forest-foreground">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-forest-foreground/10 font-display text-lg">
                Z
              </span>
              <div>
                <p className="font-display text-xl leading-none">Zero Burning</p>
                <p className="mt-1 text-xs text-forest-foreground/60">Lahan bebas bakar</p>
              </div>
            </div>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-forest-foreground/75">
              Platform insentif bagi petani yang mengolah lahan tanpa membakar, dengan bukti foto
              berbasis GPS, sidik jari SHA-256, dan verifikasi petugas.
            </p>
            <p className="mt-6 text-xs text-forest-foreground/60">Zero Burning © 2026 · Indonesia</p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-forest-foreground/60">Produk</p>
            <ul className="mt-5 space-y-3 text-sm">
              <li>
                <a href="#tentang" className="text-forest-foreground/85 transition-colors hover:text-ember">
                  Mengapa Zero Burning
                </a>
              </li>
              <li>
                <a href="#cara-kerja" className="text-forest-foreground/85 transition-colors hover:text-ember">
                  Cara Kerja
                </a>
              </li>
              <li>
                <a href="#katalog" className="text-forest-foreground/85 transition-colors hover:text-ember">
                  Katalog Insentif
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-forest-foreground/60">Bantuan</p>
            <ul className="mt-5 space-y-3 text-sm">
              <li>
                <a href="#faq" className="text-forest-foreground/85 transition-colors hover:text-ember">
                  Pertanyaan Umum
                </a>
              </li>
              <li>
                <a href="#cara-kerja" className="text-forest-foreground/85 transition-colors hover:text-ember">
                  Panduan Verifikasi
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-forest-foreground/60">Akses</p>
            <ul className="mt-5 space-y-3 text-sm">
              <li>
                <Link to="/login" className="text-forest-foreground/85 transition-colors hover:text-ember">
                  Masuk ke Sistem
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-forest-foreground/85 transition-colors hover:text-ember">
                  Daftar sebagai Petani
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-forest-foreground/85 transition-colors hover:text-ember">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-forest-foreground/15">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-6 text-xs text-forest-foreground/60">
            <span>© 2026 Zero Burning. Hak cipta dilindungi.</span>
            <span>Petani mendaftar mandiri. Akun petugas dan admin dibuat oleh administrator.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
