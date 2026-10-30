import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Eye,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Loader2,
  AlertCircle,
  Users,
  ShieldAlert,
  SlidersHorizontal,
  X,
  Ban,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Badge from '../components/Badge';
import Select from '../components/ui/Select';
import api from '../lib/api';
import { formatCoord } from '../lib/format';

const statusMeta = {
  menunggu_verifikasi: { key: 'menunggu', label: 'Menunggu', variant: 'warning', icon: Clock },
  terverifikasi: { key: 'terverifikasi', label: 'Terverifikasi', variant: 'success', icon: CheckCircle2 },
  ditolak: { key: 'ditolak', label: 'Ditolak', variant: 'danger', icon: XCircle },
};

const tabs = [
  { key: 'semua', label: 'Semua' },
  { key: 'menunggu', label: 'Menunggu' },
  { key: 'terverifikasi', label: 'Terverifikasi' },
  { key: 'ditolak', label: 'Ditolak' },
];

const OVERRIDE_STATUS_OPTIONS = [
  { value: 'tidak_lolos', label: 'Tolak (Tidak Lolos Verifikasi)' },
  { value: 'lolos', label: 'Setujui (Lolos Verifikasi Resmi)' },
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

function OverrideModal({ photo, onClose, onConfirm, submitting, error }) {
  const [overrideStatus, setOverrideStatus] = useState('tidak_lolos');
  const [note, setNote] = useState('');

  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === 'Escape' && !event.defaultPrevented && !submitting) onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose, submitting]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!note.trim() || note.trim().length < 5) return;
    onConfirm({
      photo_id: photo.id,
      status: overrideStatus,
      note: note.trim(),
      is_override: true,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4 backdrop-blur-sm animate-fade-in"
      onClick={() => !submitting && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="override-title"
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-card p-6 shadow-2xl border border-border animate-fade-up"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="icon-tile h-10 w-10 bg-destructive/10 text-destructive">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h2 id="override-title" className="text-base font-bold text-foreground">
                Anulir Hasil Verifikasi
              </h2>
              <p className="text-xs text-muted-foreground">{photo.farmer_name} - {photo.field_name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Sebagai petugas atau admin, Anda dapat menganulir status verifikasi ini.
            Tindakan ini akan membatalkan status sebelumnya dan tercatat lengkap di Audit Log.
          </p>

          <div>
            <label htmlFor="override-status-select" className="block text-xs font-semibold text-foreground mb-1.5">
              Status Baru <span className="text-destructive">*</span>
            </label>
            <Select
              id="override-status-select"
              aria-label="Status Baru"
              value={overrideStatus}
              onChange={(val) => setOverrideStatus(val)}
              options={OVERRIDE_STATUS_OPTIONS}
              disabled={submitting}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Alasan Pembatalan / Catatan Petugas <span className="text-destructive">* (wajib)</span>
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={300}
              placeholder="Jelaskan alasan resmi pembatalan/anulir (minimal 5 karakter)..."
              className="input-field resize-none text-xs"
              disabled={submitting}
              required
            />
            <p className="text-[10px] text-muted-foreground text-right mt-1">{note.length}/300</p>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="btn-secondary flex-1"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting || note.trim().length < 5}
              className="btn-danger flex-1"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Ban className="h-4 w-4" />
              )}
              {submitting ? 'Memproses...' : 'Simpan Anulir'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Verifikasi() {
  const [photos, setPhotos] = useState([]);
  const [votingConfig, setVotingConfig] = useState({ approveThreshold: 5, rejectThreshold: 3, autoMode: 'flag' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [tab, setTab] = useState('semua');
  const [query, setQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState(false);
  const [actionId, setActionId] = useState(null);

  // Override modal state
  const [overridePhoto, setOverridePhoto] = useState(null);
  const [overrideError, setOverrideError] = useState('');
  const [submittingOverride, setSubmittingOverride] = useState(false);

  const loadPhotos = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const url = priorityFilter ? '/verifications?prioritas=warga' : '/verifications';
      const response = await api.get(url);
      setPhotos(response.data.data || []);
      if (response.data.config) {
        setVotingConfig(response.data.config);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal memuat data verifikasi.');
    } finally {
      setLoading(false);
    }
  }, [priorityFilter]);

  useEffect(() => {
    loadPhotos();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadPhotos();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [loadPhotos]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(''), 5000);
    return () => clearTimeout(timer);
  }, [notice]);

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
      setNotice(`Verifikasi foto #${photo.id} (${status === 'lolos' ? 'Disetujui' : 'Ditolak'}) berhasil dicatat.`);
      await loadPhotos();
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal menyimpan hasil verifikasi.');
    } finally {
      setActionId(null);
    }
  }

  async function handleOverrideConfirm(payload) {
    setSubmittingOverride(true);
    setOverrideError('');
    try {
      await api.post('/verifications/override', payload);
      setNotice(`Status foto #${payload.photo_id} berhasil dianulir oleh petugas.`);
      setOverridePhoto(null);
      await loadPhotos();
    } catch (err) {
      setOverrideError(err.response?.data?.error || 'Gagal menganulir status verifikasi.');
    } finally {
      setSubmittingOverride(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Validasi Bukti"
        title="Verifikasi Foto"
        subtitle="Tinjau foto progres lahan, rekomendasi warga sekitar, dan tentukan status verifikasi."
      >
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
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
                  <p className="text-lg font-extrabold text-foreground leading-none">{stat.value}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-border bg-card p-3 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Sistem Voting Warga: </span>
            <span>Ambang batas {votingConfig.approveThreshold} suara setuju (Mode: <strong className="text-foreground uppercase">{votingConfig.autoMode}</strong>)</span>
          </div>
        </div>
      </PageHeader>

      {notice && (
        <div
          role="status"
          className="mt-4 flex items-start gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-xs text-primary"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs text-destructive">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="mt-6 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {tabs.map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={`chip ${tab === item.key ? 'chip-active' : ''}`}
            >
              {item.label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  tab === item.key ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}
              >
                {counts[item.key]}
              </span>
            </button>
          ))}

          <button
            type="button"
            onClick={() => setPriorityFilter((prev) => !prev)}
            className={`chip inline-flex items-center gap-1.5 ${
              priorityFilter ? 'chip-active' : 'bg-card border border-border text-foreground'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Prioritas Warga</span>
          </button>
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari petani atau lahan..."
            className="input-field pl-10 text-xs"
          />
        </div>
      </div>

      <div className="mt-4 card overflow-hidden animate-fade-up">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px]">
            <thead>
              <tr>
                <th className="table-header">Foto</th>
                <th className="table-header">Petani</th>
                <th className="table-header">Lahan & Lokasi</th>
                <th className="table-header">Dukungan Warga</th>
                <th className="table-header">Waktu</th>
                <th className="table-header">Status</th>
                <th className="table-header text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-muted-foreground">
                    <Loader2 className="mx-auto w-5 h-5 animate-spin text-primary" />
                    <p className="mt-2">Memuat foto...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-muted-foreground">
                    Tidak ada foto verifikasi ditemukan.
                  </td>
                </tr>
              ) : (
                filtered.map((photo) => {
                  const meta = statusMeta[photo.status] || {
                    label: photo.status,
                    variant: 'info',
                    icon: Clock,
                    key: 'lainnya',
                  };
                  const { time, date } = formatTime(photo.taken_at || photo.created_at);
                  const busy = actionId === photo.id;
                  const setuju = photo.setuju_count || 0;
                  const tidakSetuju = photo.tidak_setuju_count || 0;
                  const threshold = votingConfig.approveThreshold || 5;
                  const progressPct = Math.min(100, Math.round((setuju / threshold) * 100));

                  return (
                    <tr key={photo.id} className="hover:bg-muted/30 transition-colors">
                      <td className="table-cell">
                        <a
                          href={photo.photo_url}
                          target="_blank"
                          rel="noreferrer"
                          className="block h-14 w-20 overflow-hidden rounded-xl bg-muted"
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
                              <Eye className="w-5 h-5 text-muted-foreground" />
                            </span>
                          )}
                        </a>
                      </td>

                      <td className="table-cell">
                        <div className="flex items-center gap-2.5">
                          <div className="icon-tile w-8 h-8 rounded-full bg-muted text-foreground text-[11px] font-bold">
                            {initials(photo.farmer_name)}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground text-xs">{photo.farmer_name || 'Petani'}</p>
                            <p className="text-[10px] text-muted-foreground">ID Foto #{photo.id}</p>
                          </div>
                        </div>
                      </td>

                      <td className="table-cell">
                        <p className="font-medium text-foreground text-xs">{photo.field_name}</p>
                        <p className="mt-1 inline-flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
                          <MapPin className="w-3 h-3 text-primary" />
                          {formatCoord(photo.latitude)}, {formatCoord(photo.longitude)}
                        </p>
                      </td>

                      <td className="table-cell min-w-[160px]">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="inline-flex items-center gap-1 font-medium text-foreground">
                              <Users className="w-3 h-3 text-muted-foreground" />
                              {setuju}/{threshold} Setuju
                            </span>
                            {tidakSetuju > 0 && (
                              <span className="text-[10px] text-destructive font-medium">
                                ({tidakSetuju} Tolak)
                              </span>
                            )}
                          </div>

                          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                setuju >= threshold ? 'bg-primary' : 'bg-primary/60'
                              }`}
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>

                          {/* Badge Penanda Komunitas / Sistem */}
                          <div className="flex flex-wrap gap-1 mt-1">
                            {photo.verified_by_system ? (
                              <Badge variant="info">Diverifikasi Otomatis</Badge>
                            ) : photo.community_recommendation === 'rekomendasi_setuju' ? (
                              <Badge variant="success">Rekomendasi Warga</Badge>
                            ) : photo.community_recommendation === 'perlu_ditinjau' ? (
                              <Badge variant="danger">Perlu Ditinjau</Badge>
                            ) : null}
                          </div>
                        </div>
                      </td>

                      <td className="table-cell">
                        <p className="text-xs font-medium text-foreground">{time}</p>
                        <p className="text-[11px] text-muted-foreground">{date}</p>
                      </td>

                      <td className="table-cell">
                        <Badge variant={meta.variant} icon={meta.icon}>
                          {meta.label}
                        </Badge>
                      </td>

                      <td className="table-cell text-right">
                        {meta.key === 'menunggu' ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => handleVerify(photo, 'lolos')}
                              disabled={busy}
                              className="btn-primary py-1 px-2.5 text-xs inline-flex items-center gap-1"
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
                              className="btn-secondary py-1 px-2 text-xs text-destructive hover:bg-destructive/10 inline-flex items-center gap-1"
                            >
                              <XCircle className="w-3 h-3" /> Tolak
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-2">
                            {photo.verified_by_system && (
                              <button
                                type="button"
                                onClick={() => setOverridePhoto(photo)}
                                className="btn-secondary py-1 px-2 text-xs text-destructive hover:bg-destructive/10 inline-flex items-center gap-1"
                                title="Anulir verifikasi otomatis"
                              >
                                <Ban className="w-3 h-3" />
                                Anulir
                              </button>
                            )}
                            <a
                              href={photo.photo_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-semibold text-primary hover:underline"
                            >
                              Lihat
                            </a>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {overridePhoto && (
        <OverrideModal
          photo={overridePhoto}
          onClose={() => setOverridePhoto(null)}
          onConfirm={handleOverrideConfirm}
          submitting={submittingOverride}
          error={overrideError}
        />
      )}
    </div>
  );
}
