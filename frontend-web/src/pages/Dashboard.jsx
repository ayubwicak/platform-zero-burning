import { useCallback, useEffect, useState } from 'react';
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
  RefreshCw,
  PackageCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

const quickActionsByRole = {
  petani: [
    { label: 'Unggah Foto', desc: 'Kirim bukti progres', icon: Camera, to: '/upload', color: 'bg-green-600' },
    { label: 'Verifikasi Warga', desc: 'Bantu nilai foto petani lain', icon: ShieldCheck, to: '/verifikasi-komunitas', color: 'bg-teal-600' },
    { label: 'Klaim Insentif', desc: 'Ajukan bantuan', icon: CreditCard, to: '/klaim', color: 'bg-amber-500' },
    { label: 'Lahan Saya', desc: 'Kelola data lahan', icon: Sprout, to: '/fields', color: 'bg-sky-600' },
    { label: 'Katalog', desc: 'Lihat stok insentif', icon: Package, to: '/katalog', color: 'bg-purple-600' },
  ],
  petugas: [
    { label: 'Verifikasi', desc: 'Tinjau foto petani', icon: ShieldCheck, to: '/verifikasi', color: 'bg-blue-600' },
    { label: 'Distribusi', desc: 'Catat penyaluran bantuan', icon: PackageCheck, to: '/distribusi', color: 'bg-green-600' },
    { label: 'Katalog', desc: 'Lihat stok insentif', icon: Package, to: '/katalog', color: 'bg-purple-600' },
  ],
  admin: [
    { label: 'Verifikasi', desc: 'Tinjau foto petani', icon: ShieldCheck, to: '/verifikasi', color: 'bg-blue-600' },
    { label: 'Distribusi', desc: 'Catat penyaluran bantuan', icon: PackageCheck, to: '/distribusi', color: 'bg-green-600' },
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

const activityMeta = {
  photo: { action: 'mengunggah foto progres', icon: Camera, color: 'bg-green-100 text-green-600' },
  claim: { action: 'mengajukan klaim insentif', icon: CreditCard, color: 'bg-amber-100 text-amber-600' },
  field: { action: 'mendaftarkan lahan baru', icon: Sprout, color: 'bg-blue-100 text-blue-600' },
  distribution: { action: 'mencatat distribusi insentif', icon: PackageCheck, color: 'bg-purple-100 text-purple-600' },
};

const statusBadge = {
  terverifikasi: ['Terverifikasi', 'badge-success'],
  menunggu_verifikasi: ['Menunggu', 'badge-warning'],
  ditolak: ['Ditolak', 'badge-danger'],
  diajukan: ['Diproses', 'badge-warning'],
  disetujui: ['Disetujui', 'badge-success'],
  terdaftar: ['Terdaftar', 'badge-info'],
  disalurkan: ['Disalurkan', 'badge-success'],
};

const numberFormatter = new Intl.NumberFormat('id-ID');

function formatNumber(value) {
  return numberFormatter.format(Number(value) || 0);
}

function percentage(part, total) {
  if (!total) return 0;
  return Math.min(100, Math.round((Number(part) / Number(total)) * 100));
}

function formatActivityTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Waktu tidak tersedia';

  const now = new Date();
  const sameDay =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();
  const time = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  if (sameDay) return `Hari ini, ${time} WIB`;
  return `${date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}, ${time} WIB`;
}

function buildStats(scope, metrics) {
  const fieldsTotal = Number(metrics.fields_total) || 0;
  const fieldsVerified = Number(metrics.fields_verified) || 0;
  const fieldsNew = Number(metrics.fields_new_7d) || 0;
  const photosTotal = Number(metrics.photos_total) || 0;
  const photosPending = Number(metrics.photos_pending) || 0;
  const claimsTotal = Number(metrics.claims_total) || 0;
  const claimsPending = Number(metrics.claims_pending) || 0;
  const claimsApproved = Number(metrics.claims_approved) || 0;
  const distributionsTotal = Number(metrics.distributions_total) || 0;
  const distributionsNew = Number(metrics.distributions_new_7d) || 0;
  const verificationRate = Number(metrics.verification_rate) || 0;

  if (scope === 'personal') {
    return [
      {
        title: 'Lahan Saya',
        value: formatNumber(fieldsTotal),
        trend: fieldsNew > 0 ? `+${formatNumber(fieldsNew)} lahan baru` : 'Total lahan aktif',
        icon: Leaf,
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600',
        bar: 'from-green-400 to-emerald-500',
        progress: fieldsTotal > 0 ? 100 : 0,
        trendClass: fieldsNew > 0 ? 'badge-success' : 'badge-info',
        trendIcon: fieldsNew > 0 ? TrendingUp : Clock,
      },
      {
        title: 'Lahan Terverifikasi',
        value: formatNumber(fieldsVerified),
        trend: `${verificationRate}% dari total lahan`,
        icon: CheckCircle2,
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        bar: 'from-blue-400 to-sky-500',
        progress: verificationRate,
        trendClass: verificationRate > 0 ? 'badge-success' : 'badge-info',
        trendIcon: verificationRate > 0 ? TrendingUp : Clock,
      },
      {
        title: 'Foto Menunggu',
        value: formatNumber(photosPending),
        trend: photosPending > 0 ? 'Butuh tindakan' : 'Tidak ada antrean',
        icon: AlertCircle,
        iconBg: 'bg-amber-100',
        iconColor: 'text-amber-600',
        bar: 'from-amber-400 to-orange-500',
        progress: percentage(photosPending, photosTotal),
        trendClass: photosPending > 0 ? 'badge-warning' : 'badge-success',
        trendIcon: photosPending > 0 ? Clock : CheckCircle2,
      },
      {
        title: 'Klaim Insentif',
        value: formatNumber(claimsTotal),
        trend:
          claimsPending > 0
            ? `${formatNumber(claimsPending)} sedang diproses`
            : claimsApproved > 0
              ? `${formatNumber(claimsApproved)} disetujui`
              : 'Belum ada klaim',
        icon: CreditCard,
        iconBg: 'bg-purple-100',
        iconColor: 'text-purple-600',
        bar: 'from-purple-400 to-fuchsia-500',
        progress: percentage(claimsApproved, claimsTotal),
        trendClass: claimsPending > 0 ? 'badge-warning' : 'badge-success',
        trendIcon: claimsPending > 0 ? Clock : CheckCircle2,
      },
    ];
  }

  return [
    {
      title: 'Total Lahan',
      value: formatNumber(fieldsTotal),
      trend: fieldsNew > 0 ? `+${formatNumber(fieldsNew)} lahan baru` : 'Tidak ada lahan baru',
      icon: Leaf,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      bar: 'from-green-400 to-emerald-500',
      progress: fieldsTotal > 0 ? 100 : 0,
      trendClass: fieldsNew > 0 ? 'badge-success' : 'badge-info',
      trendIcon: fieldsNew > 0 ? TrendingUp : Clock,
    },
    {
      title: 'Terverifikasi',
      value: formatNumber(fieldsVerified),
      trend: `${verificationRate}% dari total lahan`,
      icon: CheckCircle2,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      bar: 'from-blue-400 to-sky-500',
      progress: verificationRate,
      trendClass: verificationRate > 0 ? 'badge-success' : 'badge-info',
      trendIcon: verificationRate > 0 ? TrendingUp : Clock,
    },
    {
      title: 'Menunggu Verifikasi',
      value: formatNumber(photosPending),
      trend: photosPending > 0 ? 'Butuh tindakan' : 'Tidak ada antrean',
      icon: AlertCircle,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      bar: 'from-amber-400 to-orange-500',
      progress: percentage(photosPending, photosTotal),
      trendClass: photosPending > 0 ? 'badge-warning' : 'badge-success',
      trendIcon: photosPending > 0 ? Clock : CheckCircle2,
    },
    {
      title: 'Insentif Tersalurkan',
      value: formatNumber(distributionsTotal),
      trend:
        distributionsNew > 0
          ? `+${formatNumber(distributionsNew)} minggu ini`
          : claimsPending > 0
            ? `${formatNumber(claimsPending)} klaim menunggu`
            : 'Belum ada distribusi',
      icon: CreditCard,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      bar: 'from-purple-400 to-fuchsia-500',
      progress: percentage(distributionsTotal, claimsTotal),
      trendClass: distributionsNew > 0 ? 'badge-success' : claimsPending > 0 ? 'badge-warning' : 'badge-info',
      trendIcon: distributionsNew > 0 ? TrendingUp : Clock,
    },
  ];
}

function StatSkeletons() {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5" aria-hidden="true">
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="card p-5 animate-pulse">
          <div className="flex items-start justify-between">
            <div className="h-11 w-11 rounded-xl bg-gray-100" />
            <div className="h-6 w-24 rounded-full bg-gray-100" />
          </div>
          <div className="mt-4 h-8 w-20 rounded bg-gray-100" />
          <div className="mt-2 h-4 w-28 rounded bg-gray-100" />
          <div className="mt-4 h-1.5 rounded-full bg-gray-100" />
        </div>
      ))}
    </section>
  );
}

function ActivitySkeletons() {
  return (
    <div className="space-y-3" aria-hidden="true">
      {[1, 2, 3].map((item) => (
        <div key={item} className="flex animate-pulse items-center gap-4 rounded-xl p-2.5">
          <div className="h-10 w-10 shrink-0 rounded-xl bg-gray-100" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-2/3 rounded bg-gray-100" />
            <div className="h-3 w-1/3 rounded bg-gray-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const quickActions = quickActionsByRole[user?.role] || [];
  const bannerAction = bannerActionByRole[user?.role] || bannerActionByRole.petani;
  const bannerCopy = bannerCopyByRole[user?.role] || bannerCopyByRole.petani;
  const BannerActionIcon = bannerAction.icon;
  const canViewActivity = user?.role === 'admin' || user?.role === 'petugas';
  const scope = data?.scope || (user?.role === 'petani' ? 'personal' : 'program');
  const metrics = data?.metrics || {};
  const summaryLabel = scope === 'personal' ? 'Ringkasan Lahan Anda' : 'Ringkasan Program';
  const isLoading = loading && !data;
  const showActivity = canViewActivity && Boolean(data);
  const stats = data ? buildStats(scope, metrics) : [];

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/dashboard');
      setData(response.data.data || null);
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal memuat ringkasan dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const bannerKpis =
    scope === 'personal'
      ? [
          { label: 'Lahan terverifikasi', value: metrics.fields_verified, icon: ShieldCheck },
          { label: 'Total lahan aktif', value: metrics.fields_total, icon: Leaf },
          { label: 'Foto menunggu', value: metrics.photos_pending, icon: Clock },
          { label: 'Klaim diproses', value: metrics.claims_pending, icon: CreditCard },
        ]
      : [
          { label: 'Lahan terverifikasi', value: metrics.fields_verified, icon: ShieldCheck },
          { label: 'Petani aktif', value: metrics.farmers_total, icon: Users },
          { label: 'Menunggu verifikasi', value: metrics.photos_pending, icon: Clock },
          { label: 'Insentif tersalurkan', value: metrics.distributions_total, icon: CreditCard },
        ];

  const verificationRate = Number(metrics.verification_rate) || 0;
  const quickActionGridClass = showActivity
    ? ''
    : quickActions.length >= 5
      ? 'xl:grid-cols-5'
      : quickActions.length >= 4
        ? 'xl:grid-cols-4'
        : 'xl:grid-cols-3';
  const activityViews = (data?.activities || []).map((event) => {
    const meta = activityMeta[event.type] || activityMeta.field;
    const badge = statusBadge[event.status] || [event.status || 'Aktivitas', 'badge-info'];
    return { ...event, ...meta, badgeLabel: badge[0], badgeClass: badge[1] };
  });

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
            {bannerKpis.map((kpi) => (
              <div key={kpi.label} className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-4">
                <kpi.icon className="w-6 h-6 text-emerald-300" />
                <p className="mt-3 text-2xl font-extrabold">
                  {!data ? '—' : formatNumber(kpi.value)}
                </p>
                <p className="text-xs text-green-100/80">{kpi.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {isLoading && (
        <p className="sr-only" role="status">
          Memuat ringkasan dashboard…
        </p>
      )}

      {error && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button type="button" onClick={loadDashboard} className="btn-secondary shrink-0">
            <RefreshCw className="h-4 w-4" /> Coba lagi
          </button>
        </div>
      )}

      {/* Stat cards */}
      {isLoading ? (
        <StatSkeletons />
      ) : data ? (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 3xl:grid-cols-4 gap-4 lg:gap-5">
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
      ) : null}

      {/* Aktivitas + aksi cepat */}
      <section className="grid grid-cols-1 xl:grid-cols-3 3xl:grid-cols-4 gap-5">
        {showActivity && (
          <div className="card p-5 lg:p-6 xl:col-span-2 3xl:col-span-3 animate-fade-up">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base lg:text-lg font-bold text-gray-900">Aktivitas Terkini</h3>
                <p className="text-xs text-gray-500 mt-0.5">Pembaruan terbaru dari lapangan</p>
              </div>
              <Link to="/verifikasi" className="text-sm font-semibold text-green-700 hover:text-green-800 inline-flex items-center gap-1">
                Lihat semua <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>

            {isLoading ? (
              <ActivitySkeletons />
            ) : activityViews.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 px-4 py-10 text-center">
                <Clock className="mx-auto h-6 w-6 text-gray-400" />
                <p className="mt-2 text-sm font-semibold text-gray-700">Belum ada aktivitas terbaru</p>
                <p className="mt-1 text-xs text-gray-500">
                  Aktivitas unggah foto, klaim, dan distribusi akan muncul di sini.
                </p>
              </div>
            ) : (
              <div className="relative">
                <span aria-hidden="true" className="absolute left-[21px] top-3 bottom-3 w-px bg-gray-100" />
                <ol className="relative space-y-1">
                  {activityViews.map((activity) => (
                    <li key={`${activity.type}-${activity.id}`} className="relative flex items-start gap-4 rounded-xl p-2.5 hover:bg-gray-50 transition-colors">
                      <div className={`icon-tile w-10 h-10 shrink-0 ring-4 ring-white ${activity.color}`}>
                        <activity.icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-gray-700">
                          <span className="font-semibold text-gray-900">{activity.actor || 'Pengguna'}</span>{' '}
                          {activity.action}{' '}
                          <span className="font-medium text-green-700">{activity.target}</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">{formatActivityTime(activity.occurred_at)}</p>
                      </div>
                      <span className={`badge ${activity.badgeClass} shrink-0`}>{activity.badgeLabel}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}

        <div className={`card p-5 lg:p-6 animate-fade-up delay-100 ${showActivity ? '' : 'xl:col-span-3'}`}>
          <h3 className="text-base lg:text-lg font-bold text-gray-900">Aksi Cepat</h3>
          <p className="text-xs text-gray-500 mt-0.5 mb-4">Pintasan tugas sehari-hari</p>

          <div className={`grid grid-cols-2 gap-3 ${quickActionGridClass}`}>
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
              <Leaf className="w-4 h-4" />
              {scope === 'personal' ? 'Kesiapan klaim' : 'Tingkat verifikasi lahan'}
            </div>
            <p className="text-xs text-green-800 mt-1">
              {!data
                ? 'Ringkasan belum tersedia.'
                : scope === 'personal'
                  ? Number(metrics.fields_verified) > 0
                    ? 'Lahan Anda sudah memenuhi syarat pengajuan klaim.'
                    : Number(metrics.fields_total) > 0
                      ? 'Unggah foto progres dan tunggu verifikasi petugas.'
                      : 'Daftarkan lahan pertama untuk memulai alur insentif.'
                  : `${formatNumber(metrics.fields_verified)} dari ${formatNumber(metrics.fields_total)} lahan aktif terverifikasi.`}
            </p>
            <div className="mt-3 h-1.5 rounded-full bg-green-100 overflow-hidden" aria-hidden="true">
              <div
                className="h-full rounded-full bg-gradient-to-r from-green-600 to-emerald-500 transition-all duration-700"
                style={{ width: `${verificationRate}%` }}
              />
            </div>
            <p className="text-[11px] font-semibold text-green-800 mt-1.5">
              {!data
                ? 'Menunggu data'
                : `${verificationRate}% ${scope === 'personal' ? 'lahan terverifikasi' : 'tingkat verifikasi'}`}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
