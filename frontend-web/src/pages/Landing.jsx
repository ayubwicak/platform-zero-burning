import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Menu,
  X,
  Search,
  ArrowUp,
  MessageCircle,
  Mail,
  Check,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Users,
  MapPin,
  CheckCircle2,
  Gift,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { testimonials } from '../content/testimonials';
import { faqs, faqCategories } from '../content/faq';
import AnimatedCounter from '../components/AnimatedCounter';

const navLinks = [
  { label: 'Tentang', href: '#tentang' },
  { label: 'Cara Kerja', href: '#cara-kerja' },
  { label: 'Katalog', href: '#katalog' },
  { label: 'Manfaat', href: '#manfaat' },
  { label: 'FAQ', href: '#faq' },
];

const steps = [
  ['Daftar akun', 'Petani mendaftar mandiri secara gratis menggunakan NIK 16 digit dan kontak aktif.'],
  ['Daftarkan lahan', 'Simpan nama lahan, luas perkiraan, jenis tanaman, dan titik koordinat lahan.'],
  ['Unggah bukti foto', 'Foto diambil langsung di lokasi lahan, maksimal radius 50 meter dari titik koordinat.'],
  ['Verifikasi dua lapis', 'Pemeriksaan otomatis oleh sistem dan peninjauan lapangan oleh petugas verifikator.'],
  ['Klaim insentif', 'Lahan yang terverifikasi dapat ditukar dengan bantuan benih, pupuk, atau peminjaman alat.'],
];

const pillars = [
  {
    title: '50 m',
    subtitle: 'Validasi Geofencing',
    desc: 'Batas toleransi jarak foto terhadap titik koordinat lahan terdaftar.',
    detail: 'Foto wajib diambil langsung di area lahan untuk membuktikan keberadaan petani di lokasi.',
  },
  {
    title: 'SHA-256',
    subtitle: 'Sidik Jari Digital',
    desc: 'Enkripsi penanda unik setiap berkas foto yang masuk ke server.',
    detail: 'Mencegah manipulasi visual, foto hasil unduhan internet, atau klaim ganda atas satu foto.',
  },
  {
    title: '2 lapis',
    subtitle: 'Verifikasi Ganda',
    desc: 'Kombinasi validasi komputasi sistem dan peninjauan petugas lapangan.',
    detail: 'Menjamin kepatuhan standar zero burning secara adil sebelum hak insentif disalurkan.',
  },
  {
    title: 'Terbuka',
    subtitle: 'Audit Transparan',
    desc: 'Riwayat setiap pengajuan, penolakan, dan distribusi tercatat permanen.',
    detail: 'Petani dapat melihat alasan penolakan dan petugas mencatat setiap verifikasi dalam audit log.',
  },
];

const catalog = [
  ['Benih padi unggul bersertifikat', '5 kg benih padi unggul per petak lahan terverifikasi bebas bakar.'],
  ['Pupuk organik & hayati berkualitas', 'Pengganti hara tanah alami dari jerami sisa panen yang tidak dibakar.'],
  ['Peminjaman alat pengolah tanah', 'Akses pinjam alat pencacah jerami dan traktor olah lahan untuk musim tanam.'],
];

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaqs, setOpenFaqs] = useState({ 'faq-1': true });
  const [faqSearch, setFaqSearch] = useState('');
  const [activeFaqCategory, setActiveFaqCategory] = useState('semua');
  const [faqFeedback, setFaqFeedback] = useState({});
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Statistik Publik Dinamis
  const [statsData, setStatsData] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/public/stats')
      .then((res) => {
        if (!res.ok) throw new Error('Gagal memuat statistik');
        return res.json();
      })
      .then((json) => {
        if (active && json.data) {
          setStatsData(json.data);
        }
      })
      .catch(() => {
        if (active) setStatsError(true);
      })
      .finally(() => {
        if (active) setStatsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Deteksi scroll untuk tombol "Kembali ke atas"
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const primaryHref = isAuthenticated ? '/dashboard' : '/register';
  const primaryLabel = isAuthenticated ? 'Buka Dashboard' : 'Daftar sebagai Petani';
  const navPrimaryLabel = isAuthenticated ? 'Dashboard' : 'Daftar';

  // Konfigurasi Lingkungan Kontak & Penyelenggara
  const rawWhatsApp = import.meta.env.VITE_CONTACT_WHATSAPP || '';
  const contactEmail = import.meta.env.VITE_CONTACT_EMAIL || '';
  const orgName = import.meta.env.VITE_ORG_NAME || '';
  const orgAddress = import.meta.env.VITE_ORG_ADDRESS || '';

  const cleanWhatsApp = rawWhatsApp.replace(/[^0-9]/g, '');
  const whatsappUrl = cleanWhatsApp
    ? `https://wa.me/${cleanWhatsApp}?text=${encodeURIComponent(
        'Halo Tim Zero Burning, saya ingin bertanya seputar program bantuan insentif pertanian tanpa membakar.'
      )}`
    : '';
  const mailtoUrl = contactEmail
    ? `mailto:${contactEmail}?subject=${encodeURIComponent('Pertanyaan Program Zero Burning')}`
    : '';

  // Filter FAQ
  const filteredFaqs = useMemo(() => {
    return faqs.filter((faq) => {
      const matchCategory =
        activeFaqCategory === 'semua' || faq.category === activeFaqCategory;
      const q = faqSearch.trim().toLowerCase();
      const matchSearch =
        !q ||
        faq.q.toLowerCase().includes(q) ||
        faq.a.toLowerCase().includes(q) ||
        faq.categoryLabel.toLowerCase().includes(q);
      return matchCategory && matchSearch;
    });
  }, [faqSearch, activeFaqCategory]);

  const toggleFaq = (faqId) => {
    setOpenFaqs((prev) => ({
      ...prev,
      [faqId]: !prev[faqId],
    }));
  };

  const handleFeedback = (faqId, type) => {
    setFaqFeedback((prev) => ({ ...prev, [faqId]: type }));
  };

  // Testimoni terverifikasi (hanya tampilkan jika ada yang verified: true)
  const verifiedTestimonials = useMemo(
    () => testimonials.filter((t) => t.verified),
    []
  );

  // Cek apakah seluruh data statistik bernilai 0
  const isStatsEmpty =
    statsData &&
    statsData.total_farmers === 0 &&
    statsData.total_fields === 0 &&
    statsData.verified_fields === 0 &&
    statsData.distributed_incentives === 0;

  // JSON-LD untuk SEO Schema.org FAQPage
  const faqJsonLd = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.a,
        },
      })),
    }),
    []
  );

  return (
    <div className="public-landing min-h-screen bg-background font-sans text-foreground">
      {/* Schema.org FAQPage */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <a href="#main-content" className="skip-link">
        Lewati ke konten utama
      </a>

      {/* Header Sticky */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5 min-h-[44px]">
            <span
              aria-hidden="true"
              className="grid h-10 w-10 place-items-center rounded-full bg-primary font-display text-lg text-primary-foreground shadow-xs"
            >
              Z
            </span>
            <span className="font-display text-xl text-foreground">
              Zero Burning
            </span>
          </Link>

          <nav className="hidden gap-8 text-sm font-medium text-muted-foreground md:flex" aria-label="Navigasi utama">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="min-h-[44px] inline-flex items-center transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3 text-sm">
            {!isAuthenticated && (
              <Link
                to="/login"
                data-testid="nav-login"
                className="hidden min-h-[44px] px-3.5 items-center font-semibold text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
              >
                Masuk
              </Link>
            )}
            <Link
              to={primaryHref}
              data-testid="nav-register"
              className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-primary px-5 py-2.5 font-semibold text-primary-foreground shadow-xs transition-transform hover:-translate-y-0.5 focus:ring-2 focus:ring-primary/20"
            >
              {navPrimaryLabel}
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 text-foreground transition-colors hover:bg-secondary md:hidden"
              aria-label={menuOpen ? 'Tutup menu' : 'Buka menu'}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
            >
              {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Menu Mobile */}
        {menuOpen && (
          <div id="mobile-menu" className="border-t border-border bg-card px-6 py-5 md:hidden animate-fade-in shadow-xl">
            <nav className="space-y-1.5" aria-label="Navigasi seluler">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex min-h-[44px] items-center rounded-xl px-4 py-2.5 text-base font-semibold text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground"
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="mt-4 border-t border-border pt-4 space-y-2">
              {!isAuthenticated && (
                <Link
                  to="/login"
                  data-testid="nav-login-mobile"
                  aria-label="Masuk ke akun"
                  onClick={() => setMenuOpen(false)}
                  className="flex min-h-[44px] w-full items-center justify-center rounded-full border border-border bg-background px-4 py-2.5 text-base font-semibold text-foreground transition-colors hover:bg-secondary"
                >
                  Masuk ke Akun
                </Link>
              )}
              <Link
                to={primaryHref}
                data-testid="nav-register-mobile"
                onClick={() => setMenuOpen(false)}
                className="flex min-h-[44px] w-full items-center justify-center rounded-full bg-primary px-4 py-2.5 text-base font-semibold text-primary-foreground shadow-xs"
              >
                {primaryLabel}
              </Link>
            </div>
          </div>
        )}
      </header>

      <main id="main-content">
        {/* HERO SECTION */}
        <section className="mx-auto grid max-w-7xl gap-12 px-4 pb-16 pt-10 sm:px-6 lg:grid-cols-12 lg:pt-16">
          <div className="animate-rise lg:col-span-6 lg:pt-8">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-ember-contrast">
              <span className="h-2 w-2 rounded-full bg-ember" /> Program Insentif Pertanian Berkelanjutan
            </p>
            <h1 className="text-4xl leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
              Olah lahan <em className="text-ember not-italic font-bold">tanpa</em> membakar.
              <br />
              <span className="text-primary font-bold">Panen insentifnya.</span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
              Zero Burning menghubungkan petani, petugas lapangan, dan penyalur bantuan melalui bukti
              foto lapangan berbasis GPS — memastikan kerja keras menjaga kelestarian tanah dihargai nyata.
            </p>
            {/* Manfaat Konkret Hero Sesuai Katalog */}
            <p className="mt-3.5 max-w-lg text-sm sm:text-base font-medium text-foreground/90">
              Lahan terverifikasi berhak atas benih padi unggul bersertifikat, pupuk organik hayati, dan pinjaman alat pengolah tanah.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to={primaryHref}
                className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-primary px-7 py-3.5 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-transform hover:-translate-y-0.5 focus:ring-2 focus:ring-primary/20"
              >
                {primaryLabel}
              </Link>
              <a
                href="#cara-kerja"
                className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-foreground/25 bg-card px-6 py-3.5 text-base font-semibold text-foreground transition-colors hover:bg-secondary"
              >
                Lihat Cara Kerja →
              </a>
            </div>

            {!isAuthenticated && (
              <p className="mt-4 text-sm text-muted-foreground">
                Sudah terdaftar?{' '}
                <Link to="/login" className="font-semibold text-primary hover:underline">
                  Masuk ke sistem
                </Link>
              </p>
            )}

            {/* Indikator Pilar Cepat Hero */}
            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-border pt-6 text-foreground">
              <div>
                <dt className="font-display text-2xl sm:text-3xl font-bold text-primary">50 m</dt>
                <dd className="text-xs sm:text-sm font-medium text-muted-foreground">Radius GPS foto</dd>
              </div>
              <div>
                <dt className="font-display text-2xl sm:text-3xl font-bold text-primary">2 lapis</dt>
                <dd className="text-xs sm:text-sm font-medium text-muted-foreground">Sistem & Petugas</dd>
              </div>
              <div>
                <dt className="font-display text-2xl sm:text-3xl font-bold text-primary">Gratis</dt>
                <dd className="text-xs sm:text-sm font-medium text-muted-foreground">Tanpa pungutan</dd>
              </div>
            </dl>
          </div>

          {/* Gambar Hero Responsif dengan WebP & Indikator Ilustrasi */}
          <div className="relative lg:col-span-6">
            <div className="overflow-hidden rounded-[2rem] border border-border shadow-xl">
              <picture>
                <source
                  media="(max-width: 640px)"
                  srcSet="/images/hero-rice-field-mobile.webp"
                  type="image/webp"
                />
                <source srcSet="/images/hero-rice-field.webp" type="image/webp" />
                <img
                  src="/images/hero-rice-field.jpg"
                  alt="Petani menanam padi di sawah hijau saat fajar tanpa pembakaran jerami"
                  width="1400"
                  height="788"
                  fetchpriority="high"
                  className="h-[380px] w-full object-cover sm:h-[480px] lg:h-[580px]"
                />
              </picture>
            </div>

            <div className="absolute -bottom-6 left-6 right-6 max-w-xs rounded-2xl border border-border/80 bg-card p-5 shadow-2xl">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Foto Terverifikasi
                </p>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  Contoh ilustrasi
                </span>
              </div>
              <p className="mt-1 font-display text-lg font-bold text-foreground">Lahan 0,8 ha · Indramayu</p>
              <p className="mt-2 flex items-center gap-2 text-xs sm:text-sm font-medium text-primary">
                <span className="h-2 w-2 rounded-full bg-primary" /> 12 m dari titik lahan (Valid)
              </p>
            </div>
          </div>
        </section>

        {/* STRIP STATISTIK DAMPAK PROGRAM (DINAMIS DARI /api/public/stats) */}
        {!statsError && (
          <section className="mx-auto max-w-7xl px-4 sm:px-6 pt-10 pb-6">
            <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-ember" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-foreground/90">
                    Dampak Nyata Program di Lapangan
                  </h2>
                </div>
                <span className="text-xs text-muted-foreground">
                  Data publik terverifikasi · Diperbarui berkala
                </span>
              </div>

              {statsLoading ? (
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 animate-pulse">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-20 rounded-2xl bg-muted/60" />
                  ))}
                </div>
              ) : isStatsEmpty ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <p className="text-base sm:text-lg font-medium text-foreground">
                    Program baru dimulai. Jadilah petani pertama yang mendaftar dan membuktikan praktik lahan tanpa membakar.
                  </p>
                  <Link
                    to={primaryHref}
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                  >
                    Mulai Daftarkan Lahan
                  </Link>
                </div>
              ) : statsData ? (
                <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <Users className="h-4 w-4 text-primary" /> Petani Terdaftar
                    </div>
                    <p className="font-display text-3xl sm:text-4xl font-bold text-foreground">
                      <AnimatedCounter value={statsData.total_farmers} />
                    </p>
                    <p className="text-xs text-muted-foreground">Petani aktif terverifikasi</p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <MapPin className="h-4 w-4 text-primary" /> Lahan Terdaftar
                    </div>
                    <p className="font-display text-3xl sm:text-4xl font-bold text-foreground">
                      <AnimatedCounter value={statsData.total_fields} />
                    </p>
                    <p className="text-xs text-muted-foreground">Petak lahan dalam sistem</p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-primary" /> Lahan Terverifikasi
                    </div>
                    <p className="font-display text-3xl sm:text-4xl font-bold text-foreground">
                      <AnimatedCounter value={statsData.verified_fields} />
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {statsData.verified_area_ha > 0
                        ? `Total luas: ${new Intl.NumberFormat('id-ID').format(statsData.verified_area_ha)} ha`
                        : 'Lahan bebas bakar'}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <Gift className="h-4 w-4 text-ember" /> Insentif Tersalurkan
                    </div>
                    <p className="font-display text-3xl sm:text-4xl font-bold text-ember-contrast">
                      <AnimatedCounter value={statsData.distributed_incentives} />
                    </p>
                    <p className="text-xs text-muted-foreground">Paket bantuan didistribusikan</p>
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        )}

        {/* TENTANG: MENGAPA ZERO BURNING */}
        <section id="tentang" className="scroll-mt-24 bg-forest text-forest-foreground">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:py-20 lg:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-ember-light">
                Mengapa Zero Burning
              </p>
              <h2 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-display leading-tight">
                Membakar lahan bukan satu-satunya cara.
              </h2>
            </div>
            <div className="space-y-5 text-base sm:text-lg leading-relaxed text-forest-foreground/85">
              <p>
                Membakar jerami memang tampak cepat dan murah saat masa persiapan tanam. Namun asapnya merusak
                saluran pernapasan warga sekitar, membakar mikroorganisme penyubur tanah, dan risiko api merambat
                dapat merugikan lahan tetangga.
              </p>
              <p>
                Zero Burning hadir agar petani yang memilih mengolah jerami menjadi kompos atau mulsa mendapatkan
                imbalan yang nyata — dengan bukti visual yang dapat dipertanggungjawabkan kepada semua pihak.
              </p>
            </div>
          </div>
        </section>

        {/* CARA KERJA: LIMA LANGKAH */}
        <section id="cara-kerja" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-16 sm:px-6 md:py-20">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-ember-contrast">
            Cara Kerja
          </p>
          <h2 className="mt-3 max-w-2xl text-3xl sm:text-4xl md:text-5xl font-display leading-tight">
            Lima langkah dari lahan ke insentif.
          </h2>
          <ol className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-border bg-border sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {steps.map(([title, description], index) => (
              <li key={title} className="bg-card p-6 sm:p-7 transition-colors hover:bg-secondary/70">
                <span className="font-display text-4xl sm:text-5xl font-bold text-ember-contrast">
                  0{index + 1}
                </span>
                <h3 className="mt-4 text-lg sm:text-xl font-bold text-foreground">{title}</h3>
                <p className="mt-2 text-sm sm:text-base leading-relaxed text-muted-foreground">{description}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* KATALOG INSENTIF (DIPINDAH LEBIH NAIK SETELAH CARA KERJA) */}
        <section id="katalog" className="mx-auto max-w-7xl scroll-mt-24 px-4 pb-16 sm:px-6 md:pb-20">
          <div className="rounded-[2rem] border border-border bg-card p-6 sm:p-10 md:p-12 shadow-xs">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-ember-contrast">
                  Katalog Bantuan
                </p>
                <h2 className="mt-2 text-3xl sm:text-4xl md:text-5xl font-display">
                  Bantuan untuk pertanian tanpa membakar.
                </h2>
              </div>
              <Link
                to={primaryHref}
                className="inline-flex min-h-[44px] items-center rounded-full bg-secondary px-6 py-2.5 text-sm sm:text-base font-semibold text-secondary-foreground transition-colors hover:bg-accent focus:ring-2 focus:ring-primary/20"
              >
                {isAuthenticated ? 'Buka Dashboard' : 'Daftar untuk Mengakses'} →
              </Link>
            </div>
            <div className="mt-10 divide-y divide-border">
              {catalog.map(([title, description], index) => (
                <div key={title} className="flex flex-wrap items-baseline justify-between gap-4 py-5 sm:py-6">
                  <div className="flex items-baseline gap-4 sm:gap-6">
                    <span className="text-sm font-bold text-ember-contrast">0{index + 1}</span>
                    <h3 className="text-xl sm:text-2xl font-bold text-foreground">{title}</h3>
                  </div>
                  <p className="text-sm sm:text-base text-muted-foreground max-w-md">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* MANFAAT & PENJELASAN ISTILAH TEKNIS */}
        <section id="manfaat" className="scroll-mt-24 bg-secondary/80">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-20">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-ember-contrast">
                  Keandalan Sistem
                </p>
                <h2 className="mt-2 max-w-xl text-3xl sm:text-4xl md:text-5xl font-display">
                  Bukti yang bisa diperiksa, bukan sekadar janji.
                </h2>
              </div>
              <p className="max-w-md text-sm sm:text-base text-muted-foreground">
                Setiap foto melewati pemeriksaan geolokasi dan sidik jari berkas sebelum disetujui petugas.
              </p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {pillars.map((pillar) => (
                <div key={pillar.title} className="rounded-3xl border border-border/80 bg-card p-6 sm:p-7 shadow-xs">
                  <p className="font-display text-3xl sm:text-4xl font-bold text-primary">{pillar.title}</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-wider text-ember-contrast">
                    {pillar.subtitle}
                  </p>
                  <p className="mt-3 text-sm sm:text-base font-semibold text-foreground leading-snug">
                    {pillar.desc}
                  </p>
                  <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {pillar.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SUARA DARI LAPANGAN (HANYA DITAMPILKAN JIKA ADA TESTIMONI TERVERIFIKASI) */}
        {verifiedTestimonials.length > 0 && (
          <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-20">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-ember-contrast">
              Suara dari Lapangan
            </p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-display">Pengalaman Nyata Petani</h2>
            <div className="mt-10 grid gap-8 lg:grid-cols-3">
              {verifiedTestimonials.map((t) => (
                <figure key={t.id} className="rounded-3xl border border-border bg-card p-6 sm:p-8 border-l-4 border-l-ember shadow-xs">
                  <blockquote className="font-display text-lg sm:text-xl leading-relaxed text-foreground">
                    “{t.kutipan}”
                  </blockquote>
                  <figcaption className="mt-6 border-t border-border pt-4 text-sm">
                    <p className="font-bold text-foreground">{t.nama}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {t.peran} · {t.lokasi}
                    </p>
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        )}

        {/* FAQ LENGKAP DENGAN PENCARIAN & ACCORDION ACCESSIBLE */}
        <section id="faq" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-16 sm:px-6 md:py-20">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4 space-y-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-ember-contrast">
                Pusat Bantuan & FAQ
              </p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-display leading-tight">
                Pertanyaan yang sering diajukan.
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Pelajari ketentuan pendaftaran, tata cara unggah foto valid, panduan klaim insentif, dan keamanan data Anda.
              </p>

              {/* Filter Kategori FAQ */}
              <div className="mt-6 flex flex-wrap gap-2 pt-2">
                {faqCategories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveFaqCategory(cat.id)}
                    className={`rounded-full px-3.5 py-1.5 text-xs sm:text-sm font-semibold transition-colors min-h-[38px] ${
                      activeFaqCategory === cat.id
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'border border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-8">
              {/* Kolom Pencarian FAQ */}
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="search"
                  value={faqSearch}
                  onChange={(e) => setFaqSearch(e.target.value)}
                  placeholder="Cari pertanyaan (mis. GPS, NIK, insentif, lupa password)..."
                  className="w-full min-h-[48px] rounded-2xl border border-border bg-card pl-11 pr-4 text-sm sm:text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  aria-label="Cari pertanyaan yang sering diajukan"
                />
              </div>

              {filteredFaqs.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-8 text-center bg-card">
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Tidak ada pertanyaan yang sesuai dengan kata kunci "{faqSearch}".
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setFaqSearch('');
                      setActiveFaqCategory('semua');
                    }}
                    className="mt-3 text-sm font-semibold text-primary hover:underline"
                  >
                    Tampilkan semua pertanyaan
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-border rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
                  {filteredFaqs.map((faq) => {
                    const isOpen = Boolean(openFaqs[faq.id]);
                    const feedback = faqFeedback[faq.id];

                    return (
                      <div key={faq.id} className="p-5 sm:p-6 transition-colors">
                        <button
                          type="button"
                          onClick={() => toggleFaq(faq.id)}
                          className="flex w-full items-start justify-between gap-4 text-left min-h-[44px]"
                          aria-expanded={isOpen}
                          aria-controls={`faq-answer-${faq.id}`}
                          id={`faq-btn-${faq.id}`}
                        >
                          <span className="text-base sm:text-lg font-bold text-foreground">
                            {faq.q}
                          </span>
                          <span
                            aria-hidden="true"
                            className={`grid h-8 w-8 shrink-0 place-items-center rounded-full bg-secondary text-foreground transition-transform duration-200 ${
                              isOpen ? 'rotate-180 bg-primary/10 text-primary' : ''
                            }`}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </span>
                        </button>

                        {isOpen && (
                          <div
                            id={`faq-answer-${faq.id}`}
                            role="region"
                            aria-labelledby={`faq-btn-${faq.id}`}
                            className="mt-4 pt-2 border-t border-border/50 text-sm sm:text-base leading-relaxed text-muted-foreground space-y-4 animate-fade-in"
                          >
                            <p>{faq.a}</p>

                            {/* Tombol Feedback Tanpa Menyimpan Data Pribadi */}
                            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-muted-foreground border-t border-border/40">
                              <span>Apakah jawaban ini membantu?</span>
                              {feedback ? (
                                <span className="inline-flex items-center gap-1 font-semibold text-primary">
                                  <Check className="h-3.5 w-3.5" /> Terima kasih atas tanggapan Anda.
                                </span>
                              ) : (
                                <div className="inline-flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleFeedback(faq.id, 'yes')}
                                    className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 hover:bg-secondary hover:text-foreground transition-colors min-h-[32px]"
                                    aria-label="Ya, jawaban ini membantu"
                                  >
                                    <ThumbsUp className="h-3 w-3" /> Ya
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleFeedback(faq.id, 'no')}
                                    className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 hover:bg-secondary hover:text-foreground transition-colors min-h-[32px]"
                                    aria-label="Tidak, jawaban ini belum membantu"
                                  >
                                    <ThumbsDown className="h-3 w-3" /> Tidak
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* KARTU JALUR BANTUAN KONTAK (WHATSAPP & EMAIL DARI ENV) */}
              {(whatsappUrl || mailtoUrl) && (
                <div className="mt-8 rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-foreground">
                        Belum menemukan jawaban yang Anda butuhkan?
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Hubungi tim pendamping lapangan kami untuk panduan langsung pendaftaran dan verifikasi lahan.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      {whatsappUrl && (
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition-transform hover:-translate-y-0.5 hover:bg-emerald-800"
                        >
                          <MessageCircle className="h-4 w-4" />
                          Chat WhatsApp
                        </a>
                      )}
                      {mailtoUrl && (
                        <a
                          href={mailtoUrl}
                          className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-border bg-secondary px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
                        >
                          <Mail className="h-4 w-4" />
                          Kirim Email
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
          <div className="rounded-[2rem] bg-forest border border-forest-foreground/15 px-6 py-14 text-center text-forest-foreground sm:px-10 md:py-20 shadow-xl">
            <h2 className="mx-auto max-w-3xl text-3xl sm:text-5xl md:text-6xl font-display leading-tight">
              Siap mengolah lahan tanpa membakar?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base sm:text-lg text-forest-foreground/85">
              {isAuthenticated
                ? 'Pantau lahan, unggah foto bukti GPS, dan ajukan insentif melalui dashboard Anda.'
                : 'Daftar sebagai petani hari ini dan dapatkan insentif benih serta pupuk untuk panen berikutnya.'}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                to={primaryHref}
                className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-ember-contrast px-8 py-3.5 text-base font-bold text-white transition-transform hover:-translate-y-0.5 shadow-md"
              >
                {primaryLabel}
              </Link>
              <a
                href="#cara-kerja"
                className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-forest-foreground/30 px-7 py-3.5 text-base font-semibold text-forest-foreground transition-colors hover:bg-forest-foreground/10"
              >
                Lihat Cara Kerja
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER LENGKAP DENGAN IDENTITAS PENYELENGGARA & HALAMAN LEGAL */}
      <footer className="bg-forest text-forest-foreground">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-forest-foreground/15 font-display text-xl">
                Z
              </span>
              <div>
                <p className="font-display text-2xl leading-none">Zero Burning</p>
                <p className="mt-1 text-xs text-forest-foreground/70">Inisiatif Lahan Bebas Bakar</p>
              </div>
            </div>

            <p className="max-w-sm text-sm sm:text-base leading-relaxed text-forest-foreground/80">
              Platform insentif dan verifikasi foto berbasis GPS bagi petani yang mengolah lahan tanpa membakar,
              didukung pemeriksaan sidik jari berkas SHA-256 dan peninjauan petugas lapangan.
            </p>

            {/* Identitas Penyelenggara */}
            {(orgName || orgAddress) && (
              <div className="border-t border-forest-foreground/15 pt-3 text-xs sm:text-sm text-forest-foreground/75 space-y-1">
                {orgName && <p className="font-semibold text-forest-foreground">{orgName}</p>}
                {orgAddress && <p>{orgAddress}</p>}
              </div>
            )}

            {/* Kontak Resmi */}
            {(whatsappUrl || contactEmail) && (
              <div className="pt-1 text-xs sm:text-sm text-forest-foreground/75 space-y-1">
                {whatsappUrl && (
                  <p>
                    WhatsApp Bantuan:{' '}
                    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-ember">
                      +{cleanWhatsApp}
                    </a>
                  </p>
                )}
                {contactEmail && (
                  <p>
                    Email Dukungan:{' '}
                    <a href={`mailto:${contactEmail}`} className="underline hover:text-ember">
                      {contactEmail}
                    </a>
                  </p>
                )}
              </div>
            )}
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-forest-foreground/60">
              Program & Produk
            </p>
            <ul className="mt-4 space-y-3 text-sm sm:text-base">
              <li>
                <a href="#tentang" className="text-forest-foreground/85 transition-colors hover:text-ember">
                  Mengapa Zero Burning
                </a>
              </li>
              <li>
                <a href="#cara-kerja" className="text-forest-foreground/85 transition-colors hover:text-ember">
                  Cara Kerja & Verifikasi
                </a>
              </li>
              <li>
                <a href="#katalog" className="text-forest-foreground/85 transition-colors hover:text-ember">
                  Katalog Insentif
                </a>
              </li>
              <li>
                <a href="#manfaat" className="text-forest-foreground/85 transition-colors hover:text-ember">
                  Keandalan Sistem
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-forest-foreground/60">
              Bantuan & Panduan
            </p>
            <ul className="mt-4 space-y-3 text-sm sm:text-base">
              <li>
                <a href="#faq" className="text-forest-foreground/85 transition-colors hover:text-ember">
                  Pertanyaan Umum (FAQ)
                </a>
              </li>
              <li>
                <Link to="/kebijakan-privasi" className="text-forest-foreground/85 transition-colors hover:text-ember">
                  Kebijakan Privasi
                </Link>
              </li>
              <li>
                <Link to="/syarat-penggunaan" className="text-forest-foreground/85 transition-colors hover:text-ember">
                  Syarat & Ketentuan
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-forest-foreground/60">
              Akses Sistem
            </p>
            <ul className="mt-4 space-y-3 text-sm sm:text-base">
              {isAuthenticated ? (
                <li>
                  <Link to="/dashboard" className="text-forest-foreground/85 transition-colors hover:text-ember font-semibold">
                    Buka Dashboard
                  </Link>
                </li>
              ) : (
                <>
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
                </>
              )}
            </ul>
          </div>
        </div>

        <div className="border-t border-forest-foreground/15">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-6 sm:px-6 text-xs text-forest-foreground/65">
            <span>© 2026 Zero Burning. Seluruh hak cipta dilindungi.</span>
            <div className="flex items-center gap-4">
              <Link to="/kebijakan-privasi" className="hover:underline">
                Kebijakan Privasi
              </Link>
              <span>·</span>
              <Link to="/syarat-penggunaan" className="hover:underline">
                Syarat Penggunaan
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* TOMBOL KEMBALI KE ATAS */}
      {showScrollTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-40 grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-2xl transition-transform hover:-translate-y-1 focus:ring-2 focus:ring-primary/40 animate-fade-in min-h-[44px] min-w-[44px]"
          aria-label="Kembali ke atas halaman"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
