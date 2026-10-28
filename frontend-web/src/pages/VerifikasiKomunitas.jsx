import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ImageOff,
  Loader2,
  MapPin,
  RefreshCw,
  ShieldCheck,
  ThumbsDown,
  ThumbsUp,
  Users,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import api from '../lib/api';
import { formatCoord, timeAgo } from '../lib/format';

const voteLabels = {
  setuju: 'Setuju',
  tidak_setuju: 'Tidak setuju',
};

function CommunitySkeletons() {
  return (
    <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4 4xl:grid-cols-5" aria-hidden="true">
      {[1, 2, 3].map((item) => (
        <div key={item} className="card animate-pulse overflow-hidden">
          <div className="aspect-[16/10] bg-gray-100" />
          <div className="space-y-3 p-5">
            <div className="h-4 w-2/3 rounded bg-gray-100" />
            <div className="h-3 w-1/2 rounded bg-gray-100" />
            <div className="h-9 rounded-xl bg-gray-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function VerifikasiKomunitas() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [actionId, setActionId] = useState(null);

  const loadPhotos = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const response = await api.get('/verifications/community');
      setPhotos(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal memuat foto untuk verifikasi komunitas.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(''), 4500);
    return () => clearTimeout(timer);
  }, [notice]);

  const myVotes = photos.filter((photo) => photo.my_status).length;
  const totalVotes = photos.reduce(
    (total, photo) =>
      total + Number(photo.setuju_count || 0) + Number(photo.tidak_setuju_count || 0),
    0
  );

  async function handleVote(photo, status) {
    const actionKey = `${photo.id}-${status}`;
    setActionId(actionKey);
    setError('');
    try {
      await api.post('/verifications/community', {
        photo_id: photo.id,
        status,
      });
      setNotice(
        status === 'setuju'
          ? `Suara setuju untuk ${photo.farmer_name} berhasil dicatat.`
          : `Suara tidak setuju untuk ${photo.farmer_name} berhasil dicatat.`
      );
      await loadPhotos(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal menyimpan suara verifikasi.');
    } finally {
      setActionId(null);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Verifikasi Sesama Petani"
        title="Verifikasi Komunitas"
        subtitle="Bantu nilai foto progres petani lain. Suara komunitas menjadi pertimbangan sebelum verifikasi petugas."
        action={
          <button onClick={() => loadPhotos()} disabled={loading} className="btn-secondary">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Segarkan
          </button>
        }
      >
        <div className="grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { label: 'Foto menunggu', value: photos.length, icon: Clock, cls: 'bg-amber-100 text-amber-600' },
            { label: 'Sudah Anda nilai', value: myVotes, icon: CheckCircle2, cls: 'bg-green-100 text-green-600' },
            { label: 'Suara komunitas', value: totalVotes, icon: Users, cls: 'bg-blue-100 text-blue-600' },
          ].map((stat) => (
            <div key={stat.label} className="card flex items-center gap-3 p-3.5">
              <div className={`icon-tile h-9 w-9 ${stat.cls}`}>
                <stat.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-lg font-extrabold leading-none text-gray-900">{stat.value}</p>
                <p className="mt-1 text-[11px] text-gray-500">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </PageHeader>

      <div className="mt-4 flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-800">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          Anda hanya dapat menilai foto dari petani lain. Suara dapat diubah selama foto masih
          menunggu verifikasi petugas.
        </span>
      </div>

      {notice && (
        <div
          role="status"
          className="mt-4 flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-xs text-green-800"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <CommunitySkeletons />
      ) : photos.length === 0 ? (
        <div className="card mt-5 flex flex-col items-center gap-2 px-4 py-16 text-center">
          <div className="icon-tile h-12 w-12 bg-green-50 text-green-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <p className="text-sm font-semibold text-gray-700">Tidak ada foto yang menunggu</p>
          <p className="max-w-sm text-xs text-gray-500">
            Semua foto dari petani lain sudah diverifikasi petugas atau belum ada unggahan baru.
          </p>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4 4xl:grid-cols-5">
          {photos.map((photo, index) => {
            const setujuBusy = actionId === `${photo.id}-setuju`;
            const tidakBusy = actionId === `${photo.id}-tidak_setuju`;
            return (
              <article
                key={photo.id}
                className={`card overflow-hidden animate-fade-up delay-${Math.min(index + 1, 4) * 100}`}
              >
                <div className="relative aspect-[16/10] bg-gray-100">
                  {photo.photo_url ? (
                    <a
                      href={photo.photo_url}
                      target="_blank"
                      rel="noreferrer"
                      className="block h-full w-full"
                    >
                      <img
                        src={photo.photo_url}
                        alt={`Foto ${photo.field_name}`}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.02]"
                      />
                    </a>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-500">
                      <ImageOff className="h-6 w-6" />
                    </div>
                  )}
                  <span className="badge badge-warning absolute left-3 top-3 shadow-sm">
                    <Clock className="h-3 w-3" /> Menunggu
                  </span>
                  {photo.my_status && (
                    <span className="badge badge-success absolute right-3 top-3 shadow-sm">
                      Sudah dinilai
                    </span>
                  )}
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-gray-900">{photo.farmer_name}</p>
                      <p className="mt-0.5 truncate text-xs text-gray-500">{photo.field_name}</p>
                    </div>
                    <p className="shrink-0 text-[11px] text-gray-500">{timeAgo(photo.taken_at)}</p>
                  </div>

                  <p className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-gray-50 px-2 py-1 font-mono text-[11px] text-gray-600">
                    <MapPin className="h-3 w-3 text-green-600" />
                    {formatCoord(photo.latitude)}, {formatCoord(photo.longitude)}
                  </p>

                  <div className="mt-4 flex items-center gap-2">
                    <span className="badge badge-success">
                      <ThumbsUp className="h-3 w-3" /> {photo.setuju_count}
                    </span>
                    <span className="badge badge-danger">
                      <ThumbsDown className="h-3 w-3" /> {photo.tidak_setuju_count}
                    </span>
                    <span className="ml-auto text-[11px] text-gray-500">Suara komunitas</span>
                  </div>

                  {photo.my_status && (
                    <p className="mt-3 text-[11px] font-medium text-gray-500">
                      Suara Anda: <span className="font-semibold text-gray-800">{voteLabels[photo.my_status]}</span>
                    </p>
                  )}

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleVote(photo, 'setuju')}
                      disabled={Boolean(actionId)}
                      className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                        photo.my_status === 'setuju'
                          ? 'bg-green-700 text-white hover:bg-green-800'
                          : 'border border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                      }`}
                    >
                      {setujuBusy ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ThumbsUp className="h-3.5 w-3.5" />
                      )}
                      Setuju
                    </button>
                    <button
                      type="button"
                      onClick={() => handleVote(photo, 'tidak_setuju')}
                      disabled={Boolean(actionId)}
                      className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                        photo.my_status === 'tidak_setuju'
                          ? 'bg-rose-600 text-white hover:bg-rose-700'
                          : 'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                      }`}
                    >
                      {tidakBusy ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ThumbsDown className="h-3.5 w-3.5" />
                      )}
                      Tidak setuju
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
