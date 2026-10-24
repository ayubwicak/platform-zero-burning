import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Eye,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import api from '../lib/api';
import { formatCoord } from '../lib/format';

const statusMeta = {
  menunggu_verifikasi: { key: 'menunggu', label: 'Menunggu', cls: 'badge-warning', icon: Clock },
  terverifikasi: { key: 'terverifikasi', label: 'Terverifikasi', cls: 'badge-success', icon: CheckCircle2 },
  ditolak: { key: 'ditolak', label: 'Ditolak', cls: 'badge-danger', icon: XCircle },
};

const tabs = [
  { key: 'semua', label: 'Semua' },
  { key: 'menunggu', label: 'Menunggu' },
  { key: 'terverifikasi', label: 'Terverifikasi' },
  { key: 'ditolak', label: 'Ditolak' },
];

function initials(name) {
  return String(name || 'Petani')
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function formatTime(value) {
  if (!value) return { time: '-', date: '-' };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { time: '-', date: '-' };
  return {
    time: date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    date: date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
  };
}

export default function Verifikasi() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('semua');
  const [query, setQuery] = useState('');
  const [actionId, setActionId] = useState(null);

  const loadPhotos = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/verifications');
      setPhotos(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal memuat data verifikasi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  const counts = useMemo(() => {
    const result = { semua: photos.length, menunggu: 0, terverifikasi: 0, ditolak: 0 };
    photos.forEach((photo) => {
      const meta = statusMeta[photo.status];
      if (meta) {
        result[meta.key] += 1;
      }
    });
    return result;
  }, [photos]);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return photos.filter((photo) => {
      const meta = statusMeta[photo.status];
      const matchesTab = tab === 'semua' || meta?.key === tab;
      const matchesQuery =
        !keyword ||
        String(photo.farmer_name || '').toLowerCase().includes(keyword) ||
        String(photo.field_name || '').toLowerCase().includes(keyword);
      return matchesTab && matchesQuery;
    });
  }, [photos, tab, query]);

  async function handleVerify(photo, status) {
    setActionId(photo.id);
    setError('');
    try {
      await api.post('/verifications/official', {
        photo_id: photo.id,
        status,
        note: null,
      });
      await loadPhotos();
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal menyimpan hasil verifikasi.');
    } finally {
      setActionId(null);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Validasi Bukti"
        title="Verifikasi Foto"
        subtitle="Tinjau foto progres lahan dan tentukan status verifikasi."
        action={
          <button onClick={loadPhotos} disabled={loading} className="btn-secondary">
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Segarkan
          </button>
        }
      >
        <div className="grid grid-cols-1 gap-3 max-w-lg sm:grid-cols-3">
          {[
            { label: 'Menunggu', value: counts.menunggu, cls: 'bg-amber-100 text-amber-600', icon: Clock },
            { label: 'Terverifikasi', value: counts.terverifikasi, cls: 'bg-green-100 text-green-600', icon: CheckCircle2 },
            { label: 'Ditolak', value: counts.ditolak, cls: 'bg-rose-100 text-rose-600', icon: XCircle },
          ].map((stat) => (
            <div key={stat.label} className="card p-3.5 flex items-center gap-3">
              <div className={`icon-tile w-9 h-9 ${stat.cls}`}>
                <stat.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-lg font-extrabold text-gray-900 leading-none">{stat.value}</p>
                <p className="text-[11px] text-gray-500 mt-1">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </PageHeader>

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

        <div className="relative w-full lg:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari petani atau lahan..."
            className="input-field pl-10"
          />
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="mt-4 card overflow-hidden animate-fade-up">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead>
              <tr>
                <th className="table-header">Foto</th>
                <th className="table-header">Petani</th>
                <th className="table-header">Lahan</th>
                <th className="table-header">Lokasi</th>
                <th className="table-header">Waktu</th>
                <th className="table-header">Status</th>
                <th className="table-header text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-gray-500">
                    <Loader2 className="mx-auto w-5 h-5 animate-spin text-green-600" />
                    <p className="mt-2">Memuat foto...</p>
                  </td>
                </tr>
              ) : (
                filtered.map((photo) => {
                  const meta = statusMeta[photo.status] || {
                    label: photo.status,
                    cls: 'badge-info',
                    icon: Clock,
                    key: 'lainnya',
                  };
                  const { time, date } = formatTime(photo.taken_at || photo.created_at);
                  const busy = actionId === photo.id;

                  return (
                    <tr key={photo.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="table-cell">
                        <a
                          href={photo.photo_url}
                          target="_blank"
                          rel="noreferrer"
                          className="block h-14 w-20 overflow-hidden rounded-xl bg-gray-100"
                        >
                          {photo.photo_url ? (
                            <img
                              src={photo.photo_url}
                              alt={`Foto ${photo.field_name}`}
                              loading="lazy"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center">
                              <Eye className="w-5 h-5 text-gray-400" />
                            </span>
                          )}
                        </a>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2.5">
                          <div className="icon-tile w-8 h-8 rounded-full bg-gray-100 text-gray-600 text-[11px] font-bold">
                            {initials(photo.farmer_name)}
                          </div>
                          <span className="font-semibold text-gray-900">
                            {photo.farmer_name || 'Petani'}
                          </span>
                        </div>
                      </td>
                      <td className="table-cell">{photo.field_name}</td>
                      <td className="table-cell">
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-gray-50 px-2 py-1 font-mono text-[11px] text-gray-600">
                          <MapPin className="w-3 h-3 text-green-600" />
                          {formatCoord(photo.latitude)}, {formatCoord(photo.longitude)}
                        </span>
                      </td>
                      <td className="table-cell">
                        <p className="text-xs font-medium text-gray-700">{time}</p>
                        <p className="text-[11px] text-gray-400">{date}</p>
                      </td>
                      <td className="table-cell">
                        <span className={`badge ${meta.cls}`}>
                          <meta.icon className="w-3 h-3" /> {meta.label}
                        </span>
                      </td>
                      <td className="table-cell text-right">
                        {meta.key === 'menunggu' ? (
                          <div className="inline-flex gap-2">
                            <button
                              onClick={() => handleVerify(photo, 'lolos')}
                              disabled={busy}
                              className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                            >
                              {busy ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-3 h-3" />
                              )}
                              Setujui
                            </button>
                            <button
                              onClick={() => handleVerify(photo, 'tidak_lolos')}
                              disabled={busy}
                              className="inline-flex items-center gap-1 rounded-lg bg-white border border-gray-200 px-3 py-1.5 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-60"
                            >
                              <XCircle className="w-3 h-3" /> Tolak
                            </button>
                          </div>
                        ) : (
                          <a
                            href={photo.photo_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-semibold text-gray-400 hover:text-gray-600"
                          >
                            Lihat foto
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <div className="icon-tile w-12 h-12 bg-gray-100 text-gray-400">
              <Search className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-gray-700">Tidak ada foto ditemukan</p>
            <p className="text-xs text-gray-500">Coba ubah filter atau kata pencarian.</p>
          </div>
        )}
      </div>
    </div>
  );
}
