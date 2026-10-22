import { Link } from 'react-router-dom';
import {
  Leaf,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  TrendingUp,
  Camera,
  Package,
  ShieldCheck,
  ArrowUpRight,
  Clock,
  Sprout,
  Users,
  UserCog,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const stats = [
  {
    title: 'Total Lahan',
    value: '124',
    trend: '+8 lahan baru',
    icon: Leaf,
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    bar: 'from-green-400 to-emerald-500',
    progress: 78,
    trendClass: 'badge-success',
    trendIcon: TrendingUp,
  },
  {
    title: 'Terverifikasi',
    value: '89',
    trend: '+12% minggu ini',
    icon: CheckCircle2,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    bar: 'from-blue-400 to-sky-500',
    progress: 72,
    trendClass: 'badge-success',
    trendIcon: TrendingUp,
  },
  {
    title: 'Menunggu Verifikasi',
    value: '23',
    trend: 'Butuh tindakan',
    icon: AlertCircle,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    bar: 'from-amber-400 to-orange-500',
    progress: 19,
    trendClass: 'badge-warning',
    trendIcon: Clock,
  },
  {
    title: 'Insentif Tersalurkan',
    value: 'Rp 45 jt',
    trend: '+Rp 5 jt bulan ini',
    icon: CreditCard,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    bar: 'from-purple-400 to-fuchsia-500',
    progress: 64,
    trendClass: 'badge-success',
    trendIcon: TrendingUp,
  },
];

const activities = [
  {
    farmer: 'Budi Santoso',
    action: 'mengunggah foto progres',
    target: 'Lahan Gambut A',
    time: '10:15',
    icon: Camera,
    color: 'bg-green-100 text-green-600',
    badge: 'Terverifikasi',
    badgeClass: 'badge-success',
  },
  {
    farmer: 'Siti Rahayu',
    action: 'mengajukan klaim insentif',
    target: 'Pupuk Organik',
    time: '09:30',
    icon: CreditCard,
    color: 'bg-amber-100 text-amber-600',
    badge: 'Diproses',
    badgeClass: 'badge-warning',
  },
  {
    farmer: 'Ahmad Fauzi',
    action: 'mendaftarkan lahan baru',
    target: 'Lahan Perkebunan C',
    time: '08:45',
    icon: Sprout,
    color: 'bg-blue-100 text-blue-600',
    badge: 'Terverifikasi',
    badgeClass: 'badge-success',
  },
  {
    farmer: 'Dewi Lestari',
    action: 'menunggu verifikasi komunitas',
    target: 'Lahan Sawah B',
    time: '08:10',
    icon: ShieldCheck,
    color: 'bg-purple-100 text-purple-600',
    badge: 'Menunggu',
    badgeClass: 'badge-warning',
  },
];

const quickActionsByRole = {
  petani: [
    { label: 'Unggah Foto', desc: 'Kirim bukti progres', icon: Camera, to: '/upload', color: 'bg-green-600' },
    { label: 'Klaim Insentif', desc: 'Ajukan bantuan', icon: CreditCard, to: '/klaim', color: 'bg-amber-500' },
    { label: 'Lahan Saya', desc: 'Kelola data lahan', icon: Sprout, to: '/fields', color: 'bg-sky-600' },
    { label: 'Katalog', desc: 'Lihat stok insentif', icon: Package, to: '/katalog', color: 'bg-purple-600' },
  ],
  petugas: [
    { label: 'Verifikasi', desc: 'Tinjau foto petani', icon: ShieldCheck, to: '/verifikasi', color: 'bg-blue-600' },
    { label: 'Katalog', desc: 'Lihat stok insentif', icon: Package, to: '/katalog', color: 'bg-purple-600' },
  ],
  admin: [
    { label: 'Verifikasi', desc: 'Tinjau foto petani', icon: ShieldCheck, to: '/verifikasi', color: 'bg-blue-600' },
    { label: 'Kelola Pengguna', desc: 'Atur akun & hak akses', icon: UserCog, to: '/pengguna', color: 'bg-emerald-600' },
    { label: 'Katalog', desc: 'Lihat stok insentif', icon: Package, to: '/katalog', color: 'bg-purple-600' },
  ],
};

const bannerActionByRole = {
  petani: { label: 'Unggah Foto', icon: Camera, to: '/upload' },
  petugas: { label: 'Tinjau Verifikasi', icon: ShieldCheck, to: '/verifikasi' },
  admin: { label: 'Tinjau Verifikasi', icon: ShieldCheck, to: '/verifikasi' },
};

const bannerCopyByRole = {
  petani: 'Pantau lahan Anda, unggah bukti progres, dan ajukan insentif zero burning dalam satu tempat.',
  petugas: 'Tinjau bukti foto, verifikasi lahan, dan catat distribusi insentif dalam satu tempat.',
  admin: 'Pantau program, kelola pengguna, dan pastikan insentif tersalurkan tepat sasaran.',
};

export default function Dashboard() {
  const { user } = useAuth();
  const quickActions = quickActionsByRole[user?.role] || [];
  const bannerAction = bannerActionByRole[user?.role] || bannerActionByRole.petani;
  const bannerCopy = bannerCopyByRole[user?.role] || bannerCopyByRole.petani;
  const summaryLabel = user?.role === 'petani' ? 'Ringkasan Program' : 'Ringkasan Hari Ini';
  const BannerActionIcon = bannerAction.icon;
  const canViewActivity = user?.role === 'admin' || user?.role === 'petugas';

  return (
    <div className="space-y-7">
      {/* Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 p-6 lg:p-10 text-white animate-fade-up">
        <div className="absolute -top-24 -right-16 w-72 h-72 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-24 -left-10 w-64 h-64 rounded-full bg-emerald-300/20 blur-2xl" />
        <div className="absolute inset-0 bg-dots opacity-40" />

        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
              {summaryLabel}
            </span>
            <h2 className="mt-4 text-2xl lg:text-4xl font-extrabold leading-tight tracking-tight">
              Selamat datang kembali,
              <br className="hidden sm:block" /> {user?.nama || 'Pengguna'}
            </h2>
            <p className="mt-3 text-sm lg:text-base text-green-50">
              {bannerCopy}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to={bannerAction.to} className="inline-flex items-center gap-2 bg-white text-green-700 px-5 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-green-900/20 hover:bg-green-50 transition-colors">
                <BannerActionIcon className="w-4 h-4" /> {bannerAction.label}
              </Link>
              <Link to="/katalog" className="btn-ghost-light">
                Lihat Katalog <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:gap-4 w-full max-w-sm">
            <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-4">
              <ShieldCheck className="w-6 h-6 text-emerald-300" />
              <p className="mt-3 text-2xl font-extrabold">89</p>
              <p className="text-xs text-green-100/80">Lahan terverifikasi</p>
            </div>
            <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-4">
              <Users className="w-6 h-6 text-emerald-300" />
              <p className="mt-3 text-2xl font-extrabold">146</p>
              <p className="text-xs text-green-100/80">Petani aktif</p>
            </div>
            <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-4">
              <Clock className="w-6 h-6 text-emerald-300" />
              <p className="mt-3 text-2xl font-extrabold">23</p>
              <p className="text-xs text-green-100/80">Menunggu verifikasi</p>
            </div>
            <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-4">
              <CreditCard className="w-6 h-6 text-emerald-300" />
              <p className="mt-3 text-2xl font-extrabold">Rp 45 jt</p>
              <p className="text-xs text-green-100/80">Insentif tersalurkan</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stat cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5">
        {stats.map((stat, i) => (
          <div
            key={stat.title}
            className={`card card-hover p-5 animate-fade-up delay-${(i + 1) * 100}`}
          >
            <div className="flex items-start justify-between">
              <div className={`icon-tile w-11 h-11 ${stat.iconBg}`}>
                <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
              </div>
              <span className={`badge ${stat.trendClass}`}>
                <stat.trendIcon className="w-3 h-3" />
                {stat.trend}
              </span>
            </div>
            <p className="mt-4 text-2xl lg:text-3xl font-extrabold tracking-tight text-gray-900">
              {stat.value}
            </p>
            <p className="text-sm text-gray-500 mt-0.5">{stat.title}</p>
            <div className="mt-4 h-1.5 rounded-full bg-gray-100 overflow-hidden" aria-hidden="true">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${stat.bar} transition-all duration-700`}
                style={{ width: `${stat.progress}%` }}
              />
            </div>
          </div>
        ))}
      </section>

      {/* Aktivitas + aksi cepat */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {canViewActivity && (
          <div className="card p-5 lg:p-6 xl:col-span-2 animate-fade-up">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base lg:text-lg font-bold text-gray-900">Aktivitas Terkini</h3>
                <p className="text-xs text-gray-500 mt-0.5">Pembaruan terbaru dari lapangan</p>
              </div>
              <Link to="/verifikasi" className="text-sm font-semibold text-green-700 hover:text-green-800 inline-flex items-center gap-1">
                Lihat semua <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="relative">
              <span aria-hidden="true" className="absolute left-[21px] top-3 bottom-3 w-px bg-gray-100" />
              <ol className="relative space-y-1">
                {activities.map((a) => (
                  <li key={a.farmer} className="relative flex items-start gap-4 rounded-xl p-2.5 hover:bg-gray-50 transition-colors">
                    <div className={`icon-tile w-10 h-10 shrink-0 ring-4 ring-white ${a.color}`}>
                      <a.icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold text-gray-900">{a.farmer}</span>{' '}
                        {a.action}{' '}
                        <span className="font-medium text-green-700">{a.target}</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">Hari ini, {a.time} WIB</p>
                    </div>
                    <span className={`badge ${a.badgeClass} shrink-0`}>{a.badge}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}

        <div className={`card p-5 lg:p-6 animate-fade-up delay-100 ${canViewActivity ? '' : 'xl:col-span-3'}`}>
          <h3 className="text-base lg:text-lg font-bold text-gray-900">Aksi Cepat</h3>
          <p className="text-xs text-gray-500 mt-0.5 mb-4">Pintasan tugas sehari-hari</p>

          <div className={`grid grid-cols-2 gap-3 ${canViewActivity ? '' : 'xl:grid-cols-4'}`}>
            {quickActions.map((qa) => (
              <Link
                key={qa.label}
                to={qa.to}
                className="group rounded-2xl border border-gray-100 bg-gray-50/60 p-4 hover:border-green-200 hover:bg-green-50/60 transition-all duration-200"
              >
                <div className={`icon-tile w-9 h-9 ${qa.color} text-white mb-3 group-hover:scale-105 transition-transform`}>
                  <qa.icon className="w-4 h-4" />
                </div>
                <p className="text-sm font-semibold text-gray-900">{qa.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{qa.desc}</p>
              </Link>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-dashed border-green-200 bg-green-50/50 p-4">
            <div className="flex items-center gap-2 text-green-800 font-semibold text-sm">
              <Leaf className="w-4 h-4" /> Target bulan ini
            </div>
            <p className="text-xs text-green-800 mt-1">100 lahan terverifikasi zero burning</p>
            <div className="mt-3 h-1.5 rounded-full bg-green-100 overflow-hidden" aria-hidden="true">
              <div className="h-full w-[89%] rounded-full bg-gradient-to-r from-green-600 to-emerald-500" />
            </div>
            <p className="text-[11px] font-semibold text-green-800 mt-1.5">89 / 100 lahan</p>
          </div>
        </div>
      </section>
    </div>
  );
}