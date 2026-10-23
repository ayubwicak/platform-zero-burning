import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock,
  Gift,
  Hash,
  Leaf,
  LogIn,
  MapPin,
  UserPlus,
  Menu,
  ShieldCheck,
  Sprout,
  Users,
  Wheat,
  Wrench,
  X,
  Star,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navLinks = [
  { label: 'Tentang', href: '#tentang' },
  { label: 'Cara Kerja', href: '#cara-kerja' },
  { label: 'Manfaat', href: '#manfaat' },
  { label: 'Katalog', href: '#katalog' },
  { label: 'FAQ', href: '#faq' },
];

const trustItems = ['Validasi GPS 50 meter', 'Hash SHA-256', 'Verifikasi dua lapis'];

const stats = [
  { value: '50 m', label: 'Radius validasi foto' },
  { value: '2 lapis', label: 'Verifikasi komunitas & petugas' },
  { value: 'SHA-256', label: 'Integritas berkas foto' },
  { value: '5 langkah', label: 'Dari lahan ke insentif' },
];

const problems = [
  {
    icon: Leaf,
    title: 'Kerusakan ekosistem',
    desc: 'Pembakaran menghilangkan unsur hara dan memicu erosi lahan gambut.',
    tone: 'bg-amber-50 text-amber-700',
  },
  {
    icon: Clock,
    title: 'Kabut asap berkepanjangan',
    desc: 'Asap lintas wilayah mengganggu kesehatan dan aktivitas masyarakat.',
    tone: 'bg-sky-50 text-sky-700',
  },
  {
    icon: Sprout,
    title: 'Alternatif belum terjangkau',
    desc: 'Petani membutuhkan dukungan nyata agar tidak kembali membakar lahan.',
    tone: 'bg-green-50 text-green-700',
  },
];

const steps = [
  {
    icon: ClipboardList,
    title: 'Daftar akun',
    desc: 'Petani mendaftar mandiri; akun petugas dan admin dibuat administrator.',
    tone: 'bg-green-50 text-green-700',
  },
  {
    icon: MapPin,
    title: 'Daftarkan lahan',
    desc: 'Simpan nama, luas, jenis tanaman, dan titik koordinat lahan.',
    tone: 'bg-amber-50 text-amber-700',
  },
  {
    icon: Camera,
    title: 'Unggah bukti foto',
    desc: 'Foto progres diambil langsung di lahan, maksimal 50 meter dari titik.',
    tone: 'bg-sky-50 text-sky-700',
  },
  {
    icon: Users,
    title: 'Verifikasi berlapis',
    desc: 'Sesama petani dan petugas lapangan memeriksa bukti foto.',
    tone: 'bg-green-50 text-green-700',
  },
  {
    icon: Gift,
    title: 'Klaim insentif',
    desc: 'Lahan terverifikasi dapat mengajukan benih, pupuk, atau alat.',
    tone: 'bg-amber-50 text-amber-700',
  },
];

const features = [
  {
    icon: MapPin,
    title: 'Validasi lokasi',
    desc: 'Server menolak foto yang diambil di luar radius 50 meter dari lahan.',
    tone: 'text-sky-700',
    surface: 'bg-sky-50/60',
  },
  {
    icon: Hash,
    title: 'Bukti tidak mudah diubah',
    desc: 'Setiap berkas diberi hash SHA-256 saat diunggah untuk menjaga integritas.',
    tone: 'text-amber-700',
    surface: 'bg-amber-50/60',
  },
  {
    icon: Users,
    title: 'Verifikasi dua lapis',
    desc: 'Suara komunitas dan verifikasi resmi petugas saling melengkapi.',
    tone: 'text-green-700',
    surface: 'bg-green-50/60',
  },
  {
    icon: Gift,
    title: 'Insentif transparan',
    desc: 'Katalog bantuan dan riwayat distribusi tercatat dalam satu sistem.',
    tone: 'text-amber-700',
    surface: 'bg-amber-50/60',
  },
];

const benefits = [
  {
    icon: Sprout,
    title: 'Petani',
    points: ['Bukti praktik zero burning', 'Akses bantuan usaha tani', 'Riwayat lahan dan verifikasi'],
    tone: 'text-green-700',
    surface: 'bg-green-50/70',
  },
  {
    icon: ShieldCheck,
    title: 'Petugas Lapangan',
    points: ['Antrean verifikasi terarah', 'Data lokasi dan waktu foto', 'Pencatatan distribusi insentif'],
    tone: 'text-sky-700',
    surface: 'bg-sky-50/70',
  },
  {
    icon: Users,
    title: 'Pengelola Program',
    points: ['Pemantauan lahan terverifikasi', 'Data insentif tersalurkan', 'Dasar evaluasi program'],
    tone: 'text-amber-700',
    surface: 'bg-amber-50/70',
  },
];

const catalog = [
  {
    icon: Wheat,
    name: 'Benih Padi',
    requirement: 'Lahan minimal 0,25 ha dan terverifikasi zero burning.',
    tone: 'text-green-700',
    surface: 'bg-green-50/60',
  },
  {
    icon: Leaf,
    name: 'Pupuk Organik',
    requirement: 'Lahan terverifikasi zero burning minimal satu periode.',
    tone: 'text-amber-700',
    surface: 'bg-amber-50/60',
  },
  {
    icon: Wrench,
    name: 'Alat Pengolahan Lahan',
    requirement: 'Petani kelompok tani dengan lahan terverifikasi.',
    tone: 'text-sky-700',
    surface: 'bg-sky-50/60',
  },
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

const assuranceStats = [
  {
    value: '50 m',
    label: 'Batas radius foto',
    desc: 'Foto di luar radius lahan ditolak server.',
    icon: MapPin,
    tone: 'text-sky-700',
  },
  {
    value: 'SHA-256',
    label: 'Sidik jari berkas',
    desc: 'Duplikat dan perubahan berkas dapat dideteksi.',
    icon: Hash,
    tone: 'text-amber-700',
  },
  {
    value: '2 lapis',
    label: 'Verifikasi berlapis',
    desc: 'Komunitas dan petugas memeriksa setiap bukti.',
    icon: Users,
    tone: 'text-green-700',
  },
  {
    value: 'Transaksi',
    label: 'Stok terjaga',
    desc: 'Klaim dan distribusi memperbarui stok secara konsisten.',
    icon: ShieldCheck,
    tone: 'text-green-700',
  },
];

const testimonials = [
  {
    name: 'Budi Santoso',
    role: 'Petani Padi, Karawang',
    content: 'Sebelumnya saya khawatir tidak bisa membuktikan lahan saya tidak dibakar. Dengan Zero Burning, foto saya diverifikasi cepat dan saya dapat benih berkualitas tepat waktu.',
    avatar: 'BS',
    tone: 'bg-green-50',
  },
  {
    name: 'Siti Rahayu',
    role: 'Petugas Lapangan, Subang',
    content: 'Sistem ini memudahkan kerja saya. Antrean verifikasi jelas, lokasi foto akurat, dan tidak ada konflik data. Bisa fokus ke lapangan.',
    avatar: 'SR',
    tone: 'bg-sky-50',
  },
  {
    name: 'Drs. Ahmad Wijaya',
    role: 'Kepala Dinas Pertanian',
    content: 'Dashboard pengelola memberikan gambaran real-time lahan terverifikasi. Keputusan alokasi insentif jadi berbasis data, bukan estimasi.',
    avatar: 'AW',
    tone: 'bg-amber-50',
  },
];

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-700">
        <ShieldCheck className="h-5 w-5 text-white" />
      </span>
      <span className="leading-tight">
        <span className="block text-sm font-bold text-gray-900">Zero Burning</span>
        <span className="block text-[10px] font-medium text-gray-500">Platform Insentif</span>
      </span>
    </Link>
  );
}

function SectionLabel({ children }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 ring-1 ring-inset ring-green-100/80">
      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
      {children}
    </span>
  );
}

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  const primaryHref = isAuthenticated ? '/dashboard' : '/register';
  const primaryLabel = isAuthenticated ? 'Buka Dashboard' : 'Daftar sebagai Petani';
  const PrimaryIcon = isAuthenticated ? ArrowRight : UserPlus;

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <a href="#main-content" className="skip-link">
        Lewati ke konten utama
      </a>
      <header className="sticky top-0 z-50 bg-green-700">
        <div className="content-wide flex h-16 items-center justify-between px-5 sm:px-8 lg:px-10">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white">
              <ShieldCheck className="h-5 w-5 text-green-700" />
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-bold text-white">Zero Burning</span>
              <span className="block text-[10px] font-medium text-green-100">Platform Insentif</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-full px-3 py-2 text-sm font-medium text-green-100 transition-colors hover:bg-green-600 hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {!isAuthenticated && (
              <Link
                to="/login"
                className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-green-100 transition-colors hover:bg-green-600 hover:text-white sm:inline-flex"
              >
                <LogIn className="h-4 w-4" />
                Masuk
              </Link>
            )}
            <Link
              to={primaryHref}
              className="hidden items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-green-700 transition-colors hover:bg-green-50 sm:inline-flex"
            >
              <PrimaryIcon className="h-4 w-4" />
              {primaryLabel}
            </Link>
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              className="rounded-lg p-2 text-green-100 transition-colors hover:bg-green-600 md:hidden"
              aria-label={menuOpen ? 'Tutup menu' : 'Buka menu'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="bg-green-700 px-5 py-3 sm:px-8 md:hidden">
            <nav className="space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-white hover:bg-green-800"
                >
                  {link.label}
                </a>
              ))}
              {!isAuthenticated && (
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-full border border-white/40 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-800"
                >
                  <LogIn className="h-4 w-4" />
                  Masuk
                </Link>
              )}
              <Link
                to={primaryHref}
                onClick={() => setMenuOpen(false)}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-green-700 transition-colors hover:bg-green-50"
              >
                <PrimaryIcon className="h-4 w-4" />
                {primaryLabel}
              </Link>
            </nav>
          </div>
        )}
      </header>

      <main id="main-content">
        <section className="relative overflow-hidden bg-gradient-to-br from-green-50 via-white to-amber-50/60">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-32 top-24 h-72 w-72 rounded-full bg-green-200/30 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 bottom-0 h-64 w-64 rounded-full bg-amber-200/30 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-1/4 bottom-20 -translate-x-1/2 opacity-20"
          >
            <Sprout className="h-32 w-32 text-green-600" />
          </div>
          <div className="content-wide relative grid items-center gap-12 px-5 py-14 sm:px-8 lg:grid-cols-2 lg:px-10 lg:py-20">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-green-700 shadow-sm ring-1 ring-inset ring-green-100">
                <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
                Program Insentif Pertanian
              </span>

              <h1 className="mt-5 max-w-2xl text-balance text-3xl font-bold leading-tight tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
                Olah lahan tanpa membakar,
                <span className="block text-green-700">dapatkan insentif.</span>
              </h1>

              <p className="mt-5 max-w-xl text-base leading-relaxed text-gray-600">
                Zero Burning menghubungkan petani, petugas lapangan, dan pengelola program
                melalui verifikasi foto berbasis GPS untuk mendukung pertanian bebas karhutla.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  to={primaryHref}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-green-700 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-800"
                >
                  <PrimaryIcon className="h-4 w-4" />
                  {primaryLabel}
                </Link>
                <a
                  href="#cara-kerja"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Pelajari cara kerja <ArrowRight className="h-4 w-4" />
                </a>
              </div>

              {!isAuthenticated && (
                <p className="mt-4 text-sm text-gray-600">
                  Sudah punya akun?{' '}
                  <Link
                    to="/login"
                    className="font-semibold text-green-700 hover:text-green-800 hover:underline"
                  >
                    Masuk ke sistem
                  </Link>
                </p>
              )}

              <div className="mt-5 flex flex-wrap gap-3">
                {trustItems.map((item) => (
                  <span key={item} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-medium text-gray-600 shadow-sm ring-1 ring-inset ring-gray-100">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <figure className="w-full">
              <div className="relative overflow-hidden rounded-[2rem] bg-gray-100 shadow-xl shadow-green-900/10">
                <img
                  src="/images/hero-rice-field.jpg"
                  alt="Dua petani menanam padi di sawah"
                  width="1400"
                  height="788"
                  className="h-64 w-full object-cover sm:h-80 lg:h-[400px] xl:h-[480px]"
                />
                <span className="absolute left-4 top-4 hidden items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-green-800 shadow-sm backdrop-blur sm:inline-flex">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                  Praktik tanpa membakar
                </span>
              </div>
              <figcaption className="mt-4 flex items-center justify-between gap-4 px-1 text-xs text-gray-500">
                <span>Praktik tanam padi tanpa membakar lahan.</span>
                <span className="shrink-0">Foto: Unsplash</span>
              </figcaption>
            </figure>
          </div>
        </section>

        <section className="bg-white pt-4">
          <div className="content-wide px-5 py-6 sm:px-8 lg:px-10">
            <div className="rounded-[2rem] bg-gradient-to-br from-green-800 via-green-800 to-green-700 px-6 py-8 shadow-lg shadow-green-900/10 sm:px-10">
              <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
                {stats.map((stat) => (
                  <div key={stat.label}>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="mt-1 text-sm leading-relaxed text-green-100">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="tentang" className="scroll-mt-20 bg-white">
          <div className="content-wide grid gap-10 px-5 py-16 sm:px-8 lg:grid-cols-2 lg:px-10 lg:py-20">
            <div>
              <SectionLabel>Mengapa Zero Burning</SectionLabel>
              <h2 className="mt-4 max-w-xl text-balance text-3xl font-bold tracking-tight text-gray-900">
                Membakar lahan bukan satu-satunya cara.
              </h2>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-gray-600">
                Pembakaran lahan masih dianggap cara termurah membersihkan lahan, meskipun
                menimbulkan kabut asap dan kerusakan lingkungan. Sistem ini menyediakan jalur
                alternatif: praktik zero burning yang diakui, diverifikasi, dan diberi insentif.
              </p>
              <div className="mt-7 max-w-xl rounded-2xl bg-green-50 p-5">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-green-700">
                    <Leaf className="h-4 w-4" />
                  </span>
                  <p className="text-sm font-semibold text-green-900">Pendekatan kami</p>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-green-800">
                  Insentif berbasis bukti, bukan sekadar larangan.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {problems.map((item) => (
                <div
                  key={item.title}
                  className="flex gap-4 rounded-2xl bg-stone-50/80 p-5"
                >
                  <div className={`icon-tile h-10 w-10 shrink-0 ${item.tone}`}>
                    <item.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-gray-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="cara-kerja" className="scroll-mt-20 bg-stone-50">
          <div className="content-wide px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
            <div className="max-w-2xl">
              <SectionLabel>Cara Kerja</SectionLabel>
              <h2 className="mt-4 text-balance text-3xl font-bold tracking-tight text-gray-900">
                Lima langkah dari lahan ke insentif.
              </h2>
              <p className="mt-3 text-base leading-relaxed text-gray-600">
                Alur sederhana dengan verifikasi berlapis agar bantuan tepat sasaran.
              </p>
            </div>

            <div className="relative mt-12">
              <div
                aria-hidden="true"
                className="absolute left-6 top-6 h-[calc(100%-3rem)] w-px bg-gradient-to-b from-green-200 via-green-200 to-transparent sm:hidden"
              />
              <div
                aria-hidden="true"
                className="absolute left-0 right-0 top-6 hidden h-px bg-gradient-to-r from-transparent via-green-300 to-transparent lg:block"
              />
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
                {steps.map((step, index) => (
                  <div key={step.title} className="relative flex gap-4 sm:block">
                    <div
                      className={`relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-8 ring-stone-50 ${step.tone}`}
                    >
                      <step.icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 sm:mt-5">
                        Langkah 0{index + 1}
                      </p>
                      <h3 className="mt-1 text-sm font-semibold text-gray-900">{step.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-gray-600">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p className="mt-10 text-sm text-gray-600">
              Petani dapat mendaftar mandiri. Akun petugas dan admin dibuat oleh administrator.{' '}
              <Link to="/register" className="font-semibold text-green-700 hover:underline">
                Daftar sebagai petani
              </Link>{' '}
              atau{' '}
              <Link to="/login" className="font-semibold text-green-700 hover:underline">
                masuk
              </Link>
              .
            </p>
          </div>
        </section>

        <section className="bg-white">
          <div className="content-wide px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
            <div className="max-w-2xl">
              <SectionLabel>Fitur Utama</SectionLabel>
              <h2 className="mt-4 text-balance text-3xl font-bold tracking-tight text-gray-900">
                Dirancang agar bukti sulit dimanipulasi.
              </h2>
              <p className="mt-3 text-base leading-relaxed text-gray-600">
                Setiap tahap memiliki pemeriksaan yang jelas dan tercatat.
              </p>
            </div>

            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <div key={feature.title} className={`rounded-2xl p-6 transition-transform duration-300 hover:-translate-y-0.5 ${feature.surface}`}>
                  <div className={`icon-tile h-11 w-11 bg-white/80 ${feature.tone}`}>
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-sm font-semibold text-gray-900">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="content-wide px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
            <div className="max-w-2xl">
              <SectionLabel>Jaminan Sistem</SectionLabel>
              <h2 className="mt-4 text-balance text-3xl font-bold tracking-tight text-gray-900">
                Bukti yang bisa diperiksa, bukan sekadar janji.
              </h2>
              <p className="mt-3 text-base leading-relaxed text-gray-600">
                Setiap foto dan klaim melewati pemeriksaan yang sama sebelum insentif
                disalurkan. Angka capaian program tersedia di dashboard pengguna.
              </p>
            </div>

            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {assuranceStats.map((stat) => (
                <div key={stat.label} className="rounded-2xl bg-stone-50/80 p-6">
                  <div className={`icon-tile h-11 w-11 bg-white/80 ${stat.tone}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <p className="mt-5 text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="mt-1 text-sm font-semibold text-gray-800">{stat.label}</p>
                  <p className="mt-1 text-sm leading-relaxed text-gray-600">{stat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-stone-50">
          <div className="content-wide px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
            <div className="max-w-2xl">
              <SectionLabel>Testimoni</SectionLabel>
              <h2 className="mt-4 text-balance text-3xl font-bold tracking-tight text-gray-900">
                Suara dari lapangan.
              </h2>
              <p className="mt-3 text-base leading-relaxed text-gray-600">
                Apa kata petani, petugas, dan pengelola yang sudah menggunakan Zero Burning.
              </p>
            </div>

            <div className="mt-12 grid gap-5 lg:grid-cols-3">
              {testimonials.map((item) => (
                <div key={item.name} className={`rounded-2xl p-6 transition-transform duration-300 hover:-translate-y-0.5 ${item.tone}`}>
                  <div className="flex items-center gap-2 mb-4" aria-label="Rating 5 dari 5" role="img">
                    <Star aria-hidden="true" className="h-4 w-4 text-amber-500 fill-current" />
                    <Star aria-hidden="true" className="h-4 w-4 text-amber-500 fill-current" />
                    <Star aria-hidden="true" className="h-4 w-4 text-amber-500 fill-current" />
                    <Star aria-hidden="true" className="h-4 w-4 text-amber-500 fill-current" />
                    <Star aria-hidden="true" className="h-4 w-4 text-amber-500 fill-current" />
                  </div>
                  <p className="text-[15px] leading-relaxed text-gray-700 mb-5">"{item.content}"</p>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/70 text-sm font-semibold text-gray-700">
                      {item.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-500">{item.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="manfaat" className="scroll-mt-20 bg-green-50/40">
          <div className="content-wide px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
            <div className="max-w-2xl">
              <SectionLabel>Manfaat</SectionLabel>
              <h2 className="mt-4 text-balance text-3xl font-bold tracking-tight text-gray-900">
                Untuk petani, petugas, dan pengelola program.
              </h2>
            </div>

            <div className="mt-12 grid gap-5 lg:grid-cols-3">
              {benefits.map((benefit) => (
                <div key={benefit.title} className={`rounded-2xl p-6 transition-transform duration-300 hover:-translate-y-0.5 ${benefit.surface}`}>
                  <div className="flex items-center gap-3">
                    <div className={`icon-tile h-11 w-11 bg-white/80 ${benefit.tone}`}>
                      <benefit.icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900">{benefit.title}</h3>
                  </div>
                  <ul className="mt-5 space-y-2.5">
                    {benefit.points.map((point) => (
                      <li key={point} className="flex items-start gap-2 text-sm text-gray-600">
                        <CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${benefit.tone}`} />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="katalog" className="scroll-mt-20 bg-white">
          <div className="content-wide px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-xl">
                <SectionLabel>Katalog Insentif</SectionLabel>
                <h2 className="mt-4 text-balance text-3xl font-bold tracking-tight text-gray-900">
                  Bantuan untuk pertanian tanpa membakar.
                </h2>
                <p className="mt-3 text-base leading-relaxed text-gray-600">
                  Ketersediaan dan persyaratan mengikuti katalog pada sistem.
                </p>
              </div>
              <Link
                to={primaryHref}
                className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-stone-200"
              >
                {isAuthenticated ? 'Buka Dashboard' : 'Daftar untuk mengakses'}{' '}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {catalog.map((item) => (
                <div
                  key={item.name}
                  className={`flex h-full flex-col rounded-2xl p-6 transition-transform duration-300 hover:-translate-y-0.5 ${item.surface}`}
                >
                  <div className={`icon-tile h-11 w-11 bg-white/80 ${item.tone}`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-base font-semibold text-gray-900">{item.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">{item.requirement}</p>
                  <div className="mt-auto pt-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1 text-xs font-semibold text-green-700">
                      <CheckCircle2 className="h-3 w-3" /> Lahan terverifikasi
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="scroll-mt-20 bg-stone-50">
          <div className="content-wide px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
            <div className="mx-auto max-w-3xl">
              <div className="text-center">
                <SectionLabel>FAQ</SectionLabel>
                <h2 className="mt-4 text-balance text-3xl font-bold tracking-tight text-gray-900">
                  Pertanyaan yang sering diajukan.
                </h2>
              </div>

              <div className="mt-10 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-gray-100">
                {faqs.map((faq, index) => {
                  const open = openFaq === index;
                  return (
                    <div key={faq.q} className="border-b border-gray-100 last:border-b-0">
                      <button
                        type="button"
                        onClick={() => setOpenFaq(open ? -1 : index)}
                        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                        aria-expanded={open}
                        aria-controls={`faq-panel-${index}`}
                        id={`faq-trigger-${index}`}
                      >
                        <span className="text-sm font-semibold text-gray-900">{faq.q}</span>
                        <ChevronDown
                          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${
                            open ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      {open && (
                        <p
                          id={`faq-panel-${index}`}
                          role="region"
                          aria-labelledby={`faq-trigger-${index}`}
                          className="px-6 pb-5 text-base leading-relaxed text-gray-600"
                        >
                          {faq.a}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="content-wide px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-green-800 to-green-700 px-6 py-14 text-center text-white sm:px-10">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-green-400/10 blur-3xl"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-24 right-0 h-64 w-64 rounded-full bg-amber-300/10 blur-3xl"
              />
              <div className="relative">
                <h2 className="text-balance text-2xl font-bold tracking-tight sm:text-3xl">
                  Siap mengelola lahan tanpa membakar?
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-green-50">
                  {isAuthenticated
                    ? 'Masuk untuk memantau lahan, mengunggah bukti, dan mengajukan insentif dalam satu sistem.'
                    : 'Daftar sebagai petani untuk memantau lahan, mengunggah bukti, dan mengajukan insentif dalam satu sistem.'}
                </p>
                <div className="mt-7 flex flex-wrap justify-center gap-3">
                  <Link
                    to={primaryHref}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-green-700 transition-colors hover:bg-green-50"
                  >
                    <PrimaryIcon className="h-4 w-4" />
                    {primaryLabel}
                  </Link>
                  <a
                    href="#cara-kerja"
                    className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/20"
                  >
                    Lihat cara kerja
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-green-200 bg-white">
        <div className="content-wide grid gap-8 px-5 py-12 sm:grid-cols-2 sm:px-8 lg:grid-cols-5 lg:px-10">
          <div className="lg:col-span-2">
            <Brand />
            <p className="mt-4 max-w-md text-sm leading-relaxed text-gray-600">
              Platform insentif bagi petani yang mengolah lahan tanpa membakar, dengan
              verifikasi foto, lokasi GPS, dan verifikasi berlapis.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-500">
              <span>Zero Burning &copy; 2026</span>
              <span className="mx-1">|</span>
              <a href="#faq" className="hover:text-green-700">Bantuan</a>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Produk</p>
            <ul className="mt-3 space-y-2">
              <li><a href="#tentang" className="text-sm text-gray-600 hover:text-green-700">Mengapa Zero Burning</a></li>
              <li><a href="#cara-kerja" className="text-sm text-gray-600 hover:text-green-700">Cara Kerja</a></li>
              <li><a href="#manfaat" className="text-sm text-gray-600 hover:text-green-700">Manfaat</a></li>
              <li><a href="#katalog" className="text-sm text-gray-600 hover:text-green-700">Katalog Insentif</a></li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Dukungan</p>
            <ul className="mt-3 space-y-2">
              <li><a href="#faq" className="text-sm text-gray-600 hover:text-green-700">Pertanyaan Umum</a></li>
              <li><a href="#cara-kerja" className="text-sm text-gray-600 hover:text-green-700">Panduan Verifikasi</a></li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Akses</p>
            <ul className="mt-3 space-y-2">
              <li><Link to="/login" className="text-sm text-gray-600 hover:text-green-700">Masuk ke Sistem</Link></li>
              <li><Link to="/register" className="text-sm text-gray-600 hover:text-green-700">Daftar sebagai Petani</Link></li>
              <li><Link to="/dashboard" className="text-sm text-gray-600 hover:text-green-700">Dashboard</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-green-200">
          <div className="content-wide flex flex-col items-center justify-between gap-2 px-5 py-5 text-xs text-gray-500 sm:flex-row sm:px-8 lg:px-10">
            <p>&copy; 2026 Platform Insentif Zero Burning.</p>
            <p>Petani mendaftar mandiri. Akun petugas dan admin dibuat administrator.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
