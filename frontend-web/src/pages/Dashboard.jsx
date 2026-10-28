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
import StatCard from '../components/StatCard';

const quickActionsByRole = {
  petani: [
    { label: 'Unggah Foto', desc: 'Kirim bukti progres', icon: Camera, to: '/upload', color: 'bg-primary text-primary-foreground' },
    { label: 'Verifikasi Warga', desc: 'Bantu nilai foto petani lain', icon: ShieldCheck, to: '/verifikasi-komunitas', color: 'bg-forest text-forest-foreground' },
    { label: 'Klaim Insentif', desc: 'Ajukan bantuan', icon: CreditCard, to: '/klaim', color: 'bg-ember text-ember-foreground' },
    { label: 'Lahan Saya', desc: 'Kelola data lahan', icon: Sprout, to: '/fields', color: 'bg-primary text-primary-foreground' },
    { label: 'Katalog', desc: 'Lihat stok insentif', icon: Package, to: '/katalog', color: 'bg-secondary text-secondary-foreground' },
  ],
  petugas: [
    { label: 'Verifikasi', desc: 'Tinjau foto petani', icon: ShieldCheck, to: '/verifikasi', color: 'bg-forest text-forest-foreground' },
    { label: 'Distribusi', desc: 'Catat penyaluran bantuan', icon: PackageCheck, to: '/distribusi', color: 'bg-primary text-primary-foreground' },
    { label: 'Katalog', desc: 'Lihat stok insentif', icon: Package, to: '/katalog', color: 'bg-secondary text-secondary-foreground' },
  ],
  admin: [
    { label: 'Verifikasi', desc: 'Tinjau foto petani', icon: ShieldCheck, to: '/verifikasi', color: 'bg-forest text-forest-foreground' },
    { label: 'Distribusi', desc: 'Catat penyaluran bantuan', icon: PackageCheck, to: '/distribusi', color: 'bg-primary text-primary-foreground' },
    { label: 'Kelola Pengguna', desc: 'Atur akun & hak akses', icon: UserCog, to: '/pengguna', color: 'bg-ember text-ember-foreground' },
    { label: 'Katalog', desc: 'Lihat stok insentif', icon: Package, to: '/katalog', color: 'bg-secondary text-secondary-foreground' },
  ],
};

const bannerActionByRole = {
  petani: { label: 'Unggah Foto', icon: Camera, to: '/upload' },
  petugas: { label: 'Tinjau Verifikasi', icon: ShieldCheck, to: '/verifikasi' },
  admin: { label: 'Tinjau Verifikasi', icon: ShieldCheck, to: '/verifikasi' },
};

const bannerCopyByRole = {
  petani: (
    <>
      Pantau lahan Anda, unggah bukti progres, dan ajukan insentif bertani{' '}
      <span className="font-display font-semibold italic text-ember">tanpa</span> membakar dalam satu portal terpadu.
    </>
  ),
  petugas: (
    <>
      Tinjau bukti foto lapangan, verifikasi pengolahan lahan{' '}
      <span className="font-display font-semibold italic text-ember">tanpa</span> bakar, dan catat distribusi insentif.
    </>
  ),
  admin: (
    <>
      Pantau pelaksanaan program, kelola pengguna, dan pastikan insentif{' '}
      <span className="font-display font-semibold italic text-ember">tanpa</span> bakar tersalurkan transparan.
    </>
  ),
};

const activityMeta = {
  photo: { action: 'mengunggah foto progres', icon: Camera, color: 'bg-primary/10 text-primary' },
  claim: { action: 'mengajukan klaim insentif', icon: CreditCard, color: 'bg-ember/10 text-ember' },
  field: { action: 'mendaftarkan lahan baru', icon: Sprout, color: 'bg-primary/10 text-primary' },
  distribution: { action: 'mencatat distribusi insentif', icon: PackageCheck, color: 'bg-secondary text-secondary-foreground' },
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
        iconBg: 'bg-primary/10',
        iconColor: 'text-primary',
        bar: 'bg-primary',
        progress: fieldsTotal > 0 ? 100 : 0,
        trendClass: fieldsNew > 0 ? 'badge-success' : 'badge-info',
        trendIcon: fieldsNew > 0 ? TrendingUp : Clock,
      },
      {
        title: 'Lahan Terverifikasi',
        value: formatNumber(fieldsVerified),
        trend: `${verificationRate}% dari total lahan`,
        icon: CheckCircle2,
        iconBg: 'bg-primary/10',
        iconColor: 'text-primary',
        bar: 'bg-primary',
        progress: verificationRate,
        trendClass: verificationRate > 0 ? 'badge-success' : 'badge-info',
        trendIcon: verificationRate > 0 ? TrendingUp : Clock,
      },
      {
        title: 'Foto Menunggu',
        value: formatNumber(photosPending),
        trend: photosPending > 0 ? 'Butuh tindakan' : 'Tidak ada antrean',
        icon: AlertCircle,
        iconBg: 'bg-ember/10',
        iconColor: 'text-ember',
        bar: 'bg-ember',
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
        iconBg: 'bg-secondary',
        iconColor: 'text-secondary-foreground',
        bar: 'bg-primary',
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
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      bar: 'bg-primary',
      progress: fieldsTotal > 0 ? 100 : 0,
      trendClass: fieldsNew > 0 ? 'badge-success' : 'badge-info',
      trendIcon: fieldsNew > 0 ? TrendingUp : Clock,
    },
    {
      title: 'Terverifikasi',
      value: formatNumber(fieldsVerified),
      trend: `${verificationRate}% dari total lahan`,
      icon: CheckCircle2,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      bar: 'bg-primary',
      progress: verificationRate,
      trendClass: verificationRate > 0 ? 'badge-success' : 'badge-info',
      trendIcon: verificationRate > 0 ? TrendingUp : Clock,
    },
    {
      title: 'Menunggu Verifikasi',
      value: formatNumber(photosPending),
      trend: photosPending > 0 ? 'Butuh tindakan' : 'Tidak ada antrean',
      icon: AlertCircle,
      iconBg: 'bg-ember/10',
      iconColor: 'text-ember',
      bar: 'bg-ember',
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
      iconBg: 'bg-secondary',
      iconColor: 'text-secondary-foreground',
      bar: 'bg-primary',
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
            <div className="h-11 w-11 rounded-xl bg-muted" />
            <div className="h-6 w-24 rounded-full bg-muted" />
          </div>
          <div className="mt-4 h-8 w-20 rounded bg-muted" />
          <div className="mt-2 h-4 w-28 rounded bg-muted" />
          <div className="mt-4 h-1.5 rounded-full bg-muted" />
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
          <div className="h-10 w-10 shrink-0 rounded-xl bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-2/3 rounded bg-muted" />
            <div className="h-3 w-1/3 rounded bg-muted" />
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
      {/* Banner Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-forest via-forest to-primary p-6 lg:p-10 text-forest-foreground animate-fade-up border border-forest/30 shadow-lg shadow-forest/15">
        <div className="absolute -top-24 -right-16 w-72 h-72 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute -bottom-24 -left-10 w-64 h-64 rounded-full bg-ember/15 blur-2xl" />
        <div className="absolute inset-0 bg-dots opacity-20" />

        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-[10px] font-bold uppercase tracking-widest text-forest-foreground/90 backdrop-blur-sm border border-white/15">
              <span className="w-1.5 h-1.5 rounded-full bg-ember animate-pulse" />
              {summaryLabel}
            </span>
            <h2 className="mt-4 font-display text-2xl lg:text-4xl font-bold leading-tight tracking-tight text-forest-foreground">
              Selamat datang kembali,
              <br className="hidden sm:block" /> {user?.nama || 'Pengguna'}
            </h2>
            <p className="mt-3 text-sm lg:text-base text-forest-foreground/85 leading-relaxed">
              {bannerCopy}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to={bannerAction.to}
                className="inline-flex items-center gap-2 rounded-full bg-primary-foreground text-primary px-5 py-2.5 font-semibold text-sm shadow-md hover:bg-white transition-all duration-200"
              >
                <BannerActionIcon className="w-4 h-4" /> {bannerAction.label}
              </Link>
              <Link to="/katalog" className="btn-ghost-light">
                Lihat Katalog <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:gap-4 w-full max-w-sm">
            {bannerKpis.map((kpi) => (
              <div key={kpi.label} className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-4">
                <kpi.icon className="w-5 h-5 text-ember" />
                <p className="mt-3 font-display text-2xl font-bold text-forest-foreground">
                  {!data ? '—' : formatNumber(kpi.value)}
                </p>
                <p className="text-xs text-forest-foreground/80 font-medium">{kpi.label}</p>
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
          className="flex flex-col gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between"
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
            <StatCard
              key={stat.title}
              title={stat.title}
              value={stat.value}
              trend={stat.trend}
              trendClass={stat.trendClass}
              trendIcon={stat.trendIcon}
              icon={stat.icon}
              iconBg={stat.iconBg}
              iconColor={stat.iconColor}
              bar={stat.bar}
              progress={stat.progress}
              delay={`delay-${(i + 1) * 100}`}
            />
          ))}
        </section>
      ) : null}

      {/* Aktivitas + aksi cepat */}
      <section className="grid grid-cols-1 xl:grid-cols-3 3xl:grid-cols-4 gap-5">
        {showActivity && (
          <div className="card p-5 lg:p-6 xl:col-span-2 3xl:col-span-3 animate-fade-up">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-display text-base lg:text-lg font-bold text-foreground">Aktivitas Terkini</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Pembaruan terbaru dari lapangan</p>
              </div>
              <Link to="/verifikasi" className="text-sm font-semibold text-primary hover:text-primary/80 inline-flex items-center gap-1 transition-colors">
                Lihat semua <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>

            {isLoading ? (
              <ActivitySkeletons />
            ) : activityViews.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-10 text-center">
                <Clock className="mx-auto h-6 w-6 text-muted-foreground/60" />
                <p className="mt-2 text-sm font-semibold text-foreground">Belum ada aktivitas terbaru</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Aktivitas unggah foto, klaim, dan distribusi akan muncul di sini.
                </p>
              </div>
            ) : (
              <div className="relative">
                <span aria-hidden="true" className="absolute left-5 top-3 bottom-3 w-px bg-border/70" />
                <ol className="relative space-y-1">
                  {activityViews.map((activity) => (
                    <li key={`${activity.type}-${activity.id}`} className="relative flex items-start gap-4 rounded-xl p-2.5 hover:bg-muted/40 transition-colors">
                      <div className={`icon-tile w-10 h-10 shrink-0 ring-4 ring-card ${activity.color}`}>
                        <activity.icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-foreground">
                          <span className="font-semibold text-foreground">{activity.actor || 'Pengguna'}</span>{' '}
                          {activity.action}{' '}
                          <span className="font-medium text-primary">{activity.target}</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{formatActivityTime(activity.occurred_at)}</p>
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
          <h3 className="font-display text-base lg:text-lg font-bold text-foreground">Aksi Cepat</h3>
          <p className="text-xs text-muted-foreground mt-0.5 mb-4">Pintasan tugas sehari-hari</p>

          <div className={`grid grid-cols-2 gap-3 ${quickActionGridClass}`}>
            {quickActions.map((qa) => (
              <Link
                key={qa.label}
                to={qa.to}
                className="group rounded-2xl border border-border/80 bg-card p-4 hover:border-primary/40 hover:bg-secondary/40 transition-all duration-200"
              >
                <div className={`icon-tile w-9 h-9 ${qa.color} mb-3 group-hover:scale-105 transition-transform`}>
                  <qa.icon className="w-4 h-4" />
                </div>
                <p className="text-sm font-semibold text-foreground">{qa.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{qa.desc}</p>
              </Link>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-border/80 bg-secondary/40 p-4">
            <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
              <Leaf className="w-4 h-4 text-primary" />
              {scope === 'personal' ? 'Kesiapan klaim' : 'Tingkat verifikasi lahan'}
            </div>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {!data
                ? 'Ringkasan belum tersedia.'
                : scope === 'personal'
                  ? Number(metrics.fields_verified) > 0
                    ? 'Lahan Anda sudah memenuhi syarat pengajuan klaim insentif tanpa bakar.'
                    : Number(metrics.fields_total) > 0
                      ? 'Unggah foto progres dan tunggu verifikasi petugas.'
                      : 'Daftarkan lahan pertama untuk memulai alur insentif.'
                  : `${formatNumber(metrics.fields_verified)} dari ${formatNumber(metrics.fields_total)} lahan aktif terverifikasi.`}
            </p>
            <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden" aria-hidden="true">
              <div
                className="h-full rounded-full bg-primary transition-all duration-700"
                style={{ width: `${verificationRate}%` }}
              />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary mt-1.5">
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
