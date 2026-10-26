import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Leaf,
  Loader2,
  MapPin,
  Phone,
  RefreshCw,
  Ruler,
  Search,
  ShieldCheck,
  Sprout,
  User,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import api from '../lib/api';
import { formatArea, formatCoord, timeAgo } from '../lib/format';

const statusMeta = {
  terverifikasi: {
    label: 'Terverifikasi',
    badge: 'badge-success',
    bar: 'from-green-500 to-emerald-600',
    tile: 'bg-green-100',
    icon: 'text-green-600',
  },
  menunggu: {
    label: 'Menunggu',
    badge: 'badge-warning',
    bar: 'from-amber-400 to-orange-500',
    tile: 'bg-amber-100',
    icon: 'text-amber-600',
  },
  ditolak: {
    label: 'Ditolak',
    badge: 'badge-danger',
    bar: 'from-rose-400 to-red-500',
    tile: 'bg-rose-100',
    icon: 'text-rose-600',
  },
  belum: {
    label: 'Belum ada foto',
    badge: 'badge-info',
    bar: 'from-blue-400 to-sky-500',
    tile: 'bg-blue-100',
    icon: 'text-blue-600',
  },
};

const tabs = [
  { key: 'semua', label: 'Semua' },
  { key: 'terverifikasi', label: 'Terverifikasi' },
  { key: 'menunggu', label: 'Menunggu' },
  { key: 'ditolak', label: 'Ditolak' },
  { key: 'belum', label: 'Belum ada foto' },
];

function fieldStatus(field) {
  if (field.latest_photo_status === 'terverifikasi') return 'terverifikasi';
  if (field.latest_photo_status === 'menunggu_verifikasi') return 'menunggu';
  if (field.latest_photo_status === 'ditolak') return 'ditolak';
  return 'belum';
}

function photoCount(value) {
  return Number(value) || 0;
}

export default function DataLahan() {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('semua');
  const [query, setQuery] = useState('');

  const loadFields = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/fields');
      setFields(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal memuat data lahan.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFields();
  }, [loadFields]);

  const counts = useMemo(() => {
    const result = {
      semua: fields.length,
      terverifikasi: 0,
      menunggu: 0,
      ditolak: 0,
      belum: 0,
    };
    fields.forEach((field) => {
      result[fieldStatus(field)] += 1;
    });
    return result;
  }, [fields]);

  const stats = useMemo(() => {
    const totalArea = fields.reduce((sum, field) => sum + (Number(field.area) || 0), 0);
    const verifiedFields = fields.filter(
      (field) => field.latest_photo_status === 'terverifikasi'
    ).length;
    const pendingPhotos = fields.reduce(
      (sum, field) => sum + photoCount(field.pending_photo_count),
      0
    );

    return [
      {
        label: 'Lahan Aktif',
        value: fields.length,
        icon: Leaf,
        color: 'text-green-600',
        bg: 'bg-green-100',
      },
      {
        label: 'Luas Total',
        value: formatArea(totalArea),
        icon: Ruler,
        color: 'text-blue-600',
        bg: 'bg-blue-100',
      },
      {
        label: 'Lahan Terverifikasi',
        value: verifiedFields,
        icon: CheckCircle2,
        color: 'text-emerald-600',
        bg: 'bg-emerald-100',
      },
      {
        label: 'Foto Menunggu',
        value: pendingPhotos,
        icon: Clock,
        color: 'text-amber-600',
        bg: 'bg-amber-100',
      },
    ];
  }, [fields]);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return fields.filter((field) => {
      const matchTab = tab === 'semua' || fieldStatus(field) === tab;
      const matchQuery =
        !keyword ||
        String(field.name || '').toLowerCase().includes(keyword) ||
        String(field.owner_name || '').toLowerCase().includes(keyword) ||
        String(field.owner_phone || '').includes(keyword) ||
        String(field.crop_type || '').toLowerCase().includes(keyword);
      return matchTab && matchQuery;
    });
  }, [fields, tab, query]);

  return (
    <div>
      <PageHeader
        eyebrow="Pemantauan Lahan"
        title="Data Lahan Petani"
        subtitle="Pantau seluruh lahan aktif, data pemilik, dan progres verifikasi foto petani."
        action={
          <button
            onClick={loadFields}
            className="btn-secondary"
            disabled={loading}
            aria-label="Segarkan data lahan"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Segarkan</span>
          </button>
        }
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 3xl:grid-cols-4 gap-3 sm:gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="card p-3.5 flex items-center gap-3">
              <div className={`icon-tile w-9 h-9 shrink-0 ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-lg font-extrabold text-gray-900 leading-none truncate">
                  {stat.value}
                </p>
                <p className="text-[11px] text-gray-500 mt-1">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </PageHeader>

      <div className="mt-5 flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs leading-relaxed text-blue-800">
        <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          Mode pantau hanya baca. Perubahan data lahan dilakukan oleh pemilik lahan melalui menu
          Lahan Saya.
        </span>
      </div>

      <div className="mt-6 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {tabs.map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={`chip ${tab === item.key ? 'chip-active' : ''}`}
            >
              {item.label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  tab === item.key ? 'bg-white/20' : 'bg-gray-100'
                }`}
              >
                {counts[item.key]}
              </span>
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari lahan, pemilik, atau tanaman..."
            className="input-field pl-10"
            aria-label="Cari lahan"
          />
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-4 flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={loadFields} className="btn-secondary">
            Coba lagi
          </button>
        </div>
      )}

      {loading ? (
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4 4xl:grid-cols-5 gap-5" aria-hidden="true">
          {[1, 2, 3].map((item) => (
            <div key={item} className="card overflow-hidden animate-pulse">
              <div className="h-1.5 bg-gray-100" />
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-xl bg-gray-100" />
                  <div className="h-6 w-24 rounded-full bg-gray-100" />
                </div>
                <div className="mt-4 h-5 w-2/3 rounded bg-gray-100" />
                <div className="mt-2 h-4 w-1/2 rounded bg-gray-100" />
                <div className="mt-4 h-10 rounded-xl bg-gray-100" />
                <div className="mt-3 h-16 rounded-xl bg-gray-100" />
                <div className="mt-4 h-4 w-1/2 rounded bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      ) : fields.length === 0 ? (
        error ? null : (
          <div className="mt-5 card flex flex-col items-center justify-center p-12 text-center">
            <div className="icon-tile w-14 h-14 bg-green-100 text-green-600">
              <Sprout className="w-7 h-7" />
            </div>
            <h2 className="mt-4 text-base font-bold text-gray-900">Belum ada lahan aktif</h2>
            <p className="mt-1 max-w-md text-sm text-gray-500">
              Lahan yang didaftarkan petani akan muncul di sini untuk dipantau petugas dan admin.
            </p>
          </div>
        )
      ) : filtered.length === 0 ? (
        <div className="mt-5 card flex flex-col items-center justify-center p-12 text-center">
          <div className="icon-tile w-14 h-14 bg-gray-100 text-gray-500">
            <Search className="w-7 h-7" />
          </div>
          <h2 className="mt-4 text-base font-bold text-gray-900">Lahan tidak ditemukan</h2>
          <p className="mt-1 max-w-md text-sm text-gray-500">
            Tidak ada lahan yang cocok dengan filter atau kata kunci saat ini.
          </p>
          <button
            onClick={() => {
              setTab('semua');
              setQuery('');
            }}
            className="btn-secondary mt-4"
          >
            Reset filter
          </button>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4 4xl:grid-cols-5 gap-5">
          {filtered.map((field) => {
            const statusKey = fieldStatus(field);
            const meta = statusMeta[statusKey];
            const verified = photoCount(field.verified_photo_count);
            const pending = photoCount(field.pending_photo_count);
            const rejected = photoCount(field.rejected_photo_count);

            return (
              <article key={field.id} className="card overflow-hidden card-hover animate-fade-up">
                <div className={`h-1.5 bg-gradient-to-r ${meta.bar}`} />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className={`icon-tile w-11 h-11 ${meta.tile}`}>
                      <Sprout className={`w-5 h-5 ${meta.icon}`} />
                    </div>
                    <span className={`badge ${meta.badge}`}>{meta.label}</span>
                  </div>

                  <h2 className="mt-4 text-lg font-bold text-gray-900">{field.name}</h2>
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-600">
                    <User className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                    <span className="truncate font-semibold text-gray-800">
                      {field.owner_name || 'Petani'}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                    <span className="inline-flex items-center gap-1 rounded-md bg-gray-50 px-2 py-1 font-medium">
                      <Leaf className="w-3 h-3 text-green-600" />
                      {field.crop_type || 'Tanaman belum diisi'}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-gray-50 px-2 py-1 font-medium">
                      <Ruler className="w-3 h-3 text-blue-600" />
                      {formatArea(field.area)}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-600">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-green-600" />
                    <span className="truncate font-mono">
                      {formatCoord(field.latitude)}, {formatCoord(field.longitude)}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-green-50 px-2 py-2">
                      <p className="text-sm font-extrabold text-green-700">{verified}</p>
                      <p className="mt-0.5 text-[10px] font-semibold text-green-800">Terverifikasi</p>
                    </div>
                    <div className="rounded-xl bg-amber-50 px-2 py-2">
                      <p className="text-sm font-extrabold text-amber-700">{pending}</p>
                      <p className="mt-0.5 text-[10px] font-semibold text-amber-800">Menunggu</p>
                    </div>
                    <div className="rounded-xl bg-rose-50 px-2 py-2">
                      <p className="text-sm font-extrabold text-rose-700">{rejected}</p>
                      <p className="mt-0.5 text-[10px] font-semibold text-rose-800">Ditolak</p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3">
                    {field.owner_phone ? (
                      <a
                        href={`tel:${field.owner_phone}`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 hover:text-green-800"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        {field.owner_phone}
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                        <Phone className="w-3.5 h-3.5" />
                        Telepon belum diisi
                      </span>
                    )}
                    <span className="text-[11px] text-gray-500">
                      {field.last_photo_at
                        ? `Foto ${timeAgo(field.last_photo_at)}`
                        : `Didaftarkan ${timeAgo(field.created_at)}`}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-gray-500">
          <Leaf className="w-3.5 h-3.5" />
          Menampilkan {filtered.length} dari {fields.length} lahan aktif.
        </p>
      )}
    </div>
  );
}
