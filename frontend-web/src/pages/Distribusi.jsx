import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Ban,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  MapPin,
  Package,
  PackageCheck,
  Phone,
  RefreshCw,
  Search,
  Truck,
  X,
  XCircle,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Badge from '../components/Badge';
import api from '../lib/api';
import { formatArea, formatCoord, formatDateTime } from '../lib/format';
import { useAuth } from '../context/AuthContext';

const STANDARD_REASONS = [
  'Petani tidak hadir',
  'Lahan bermasalah kembali',
  'Data tidak sesuai',
  'Stok tidak tersedia',
  'Kekeliruan input',
  'Lainnya',
];

const statusMeta = {
  diajukan: { label: 'Diajukan', variant: 'warning', icon: Clock },
  disetujui: { label: 'Disetujui', variant: 'success', icon: CheckCircle2 },
  ditolak: { label: 'Ditolak', variant: 'danger', icon: XCircle },
  dibatalkan: { label: 'Dibatalkan', variant: 'danger', icon: Ban },
};

function waitingLabel(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'Hari ini';
  if (days === 1) return '1 hari';
  return `${days} hari`;
}

function ReceiptValue({ value }) {
  if (!value) return <span className="text-muted-foreground">—</span>;
  if (/^https?:\/\//i.test(value)) {
    return (
      <a
        href={value}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
      >
        Lihat bukti <ExternalLink className="h-3 w-3" />
      </a>
    );
  }
  return (
    <span className="block max-w-[220px] truncate text-xs text-muted-foreground" title={value}>
      {value}
    </span>
  );
}

function DistributionModal({ claim, receipt, setReceipt, onClose, onConfirm, submitting, error }) {
  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === 'Escape' && !submitting) onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose, submitting]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4 backdrop-blur-sm animate-fade-in"
      onClick={() => !submitting && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="distribution-modal-title"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-card shadow-2xl border border-border animate-fade-up"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative overflow-hidden bg-primary p-6 text-primary-foreground">
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="icon-tile h-11 w-11 bg-white/15 backdrop-blur-sm text-primary-foreground">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <h2 id="distribution-modal-title" className="text-lg font-bold">
                  Catat Distribusi
                </h2>
                <p className="text-xs text-primary-foreground/80">Pastikan insentif diterima petani.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg p-1.5 transition-colors hover:bg-white/10 disabled:opacity-50"
              aria-label="Tutup"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-5 p-6">
          <div className="rounded-2xl border border-border bg-muted/40 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-foreground">{claim.farmer_name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{claim.field_name}</p>
              </div>
              <Badge variant="warning" icon={Clock}>Menunggu</Badge>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-muted-foreground">Insentif</p>
                <p className="mt-0.5 font-semibold text-foreground">{claim.category_name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Stok saat ini</p>
                <p className="mt-0.5 font-semibold text-foreground">
                  {claim.stock} unit → {Math.max(0, Number(claim.stock) - 1)} unit
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Lahan</p>
                <p className="mt-0.5 font-semibold text-foreground">{formatArea(claim.field_area)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Lokasi</p>
                <p className="mt-0.5 inline-flex items-center gap-1 font-mono text-[11px] text-foreground">
                  <MapPin className="h-3 w-3 text-primary" />
                  {formatCoord(claim.latitude)}, {formatCoord(claim.longitude)}
                </p>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="receipt-proof" className="mb-1.5 block text-sm font-semibold text-foreground">
              Bukti serah terima <span className="font-normal text-muted-foreground">(opsional)</span>
            </label>
            <textarea
              id="receipt-proof"
              rows={3}
              value={receipt}
              onChange={(event) => setReceipt(event.target.value)}
              maxLength={500}
              placeholder="Contoh: BA-001, diterima langsung oleh petani"
              className="input-field resize-none"
            />
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Dapat berupa nomor berita acara, tautan, atau catatan singkat.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-xs text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="btn-secondary flex-1"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={submitting || Number(claim.stock) <= 0}
              className="btn-primary flex-1"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <PackageCheck className="h-4 w-4" />
              )}
              {submitting ? 'Menyimpan...' : 'Catat Distribusi'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ClaimActionModal({ claim, type, onClose, onConfirm, submitting, error }) {
  const [reason, setReason] = useState(STANDARD_REASONS[0]);
  const [note, setNote] = useState('');

  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === 'Escape' && !submitting) onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose, submitting]);

  const isReject = type === 'reject';
  const title = isReject ? 'Tolak Pengajuan Klaim' : 'Batalkan Klaim Insentif';
  const desc = isReject
    ? 'Klaim akan ditolak dan petani akan menerima pemberitahuan beserta alasannya.'
    : 'Klaim akan dibatalkan. Jika klaim sudah disetujui, stok insentif akan dikembalikan.';

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm({ reason, note });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4 backdrop-blur-sm animate-fade-in"
      onClick={() => !submitting && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="claim-action-title"
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-card p-6 shadow-2xl border border-border animate-fade-up"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="icon-tile h-10 w-10 bg-destructive/10 text-destructive">
              {isReject ? <XCircle className="h-5 w-5" /> : <Ban className="h-5 w-5" />}
            </div>
            <div>
              <h2 id="claim-action-title" className="text-base font-bold text-foreground">
                {title}
              </h2>
              <p className="text-xs text-muted-foreground">{claim.farmer_name} - {claim.category_name}</p>
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
          <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Alasan {isReject ? 'Penolakan' : 'Pembatalan'} <span className="text-destructive">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="input-field text-sm"
              disabled={submitting}
            >
              {STANDARD_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Catatan / Keterangan {reason === 'Lainnya' ? <span className="text-destructive">*</span> : '(Opsional)'}
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={300}
              placeholder={reason === 'Lainnya' ? 'Tuliskan alasan spesifik (wajib)...' : 'Catatan tambahan (maksimal 300 karakter)...'}
              className="input-field resize-none text-xs"
              disabled={submitting}
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
              Kembali
            </button>
            <button
              type="submit"
              disabled={submitting || (reason === 'Lainnya' && !note.trim())}
              className="btn-danger flex-1"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isReject ? (
                <XCircle className="h-4 w-4" />
              ) : (
                <Ban className="h-4 w-4" />
              )}
              {submitting ? 'Memproses...' : isReject ? 'Tolak Klaim' : 'Batalkan Klaim'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Distribusi() {
  const { user } = useAuth();
  const [pending, setPending] = useState([]);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [history, setHistory] = useState([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('diajukan');

  // Distribution modal state
  const [selected, setSelected] = useState(null);
  const [receipt, setReceipt] = useState('');
  const [distError, setDistError] = useState('');
  const [submittingDist, setSubmittingDist] = useState(false);

  // Action modal (reject / cancel) state
  const [actionClaim, setActionClaim] = useState(null);
  const [actionType, setActionType] = useState('reject'); // 'reject' | 'cancel'
  const [actionError, setActionError] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const pendingUrl = statusFilter === 'semua'
        ? '/incentives/claims/pending?status=semua'
        : `/incentives/claims/pending?status=${statusFilter}`;

      const [pendingResponse, historyResponse] = await Promise.all([
        api.get(pendingUrl),
        api.get('/incentives/distributions'),
      ]);
      setPending(pendingResponse.data.data || []);
      setPendingTotal(Number(pendingResponse.data.total) || 0);
      setHistory(historyResponse.data.data || []);
      setHistoryTotal(Number(historyResponse.data.total) || 0);
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal memuat data distribusi.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(''), 5000);
    return () => clearTimeout(timer);
  }, [notice]);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return pending;
    return pending.filter(
      (claim) =>
        String(claim.farmer_name || '').toLowerCase().includes(keyword) ||
        String(claim.field_name || '').toLowerCase().includes(keyword) ||
        String(claim.category_name || '').toLowerCase().includes(keyword) ||
        String(claim.reason || '').toLowerCase().includes(keyword)
    );
  }, [pending, query]);

  const lowStock = pending.filter((claim) => Number(claim.stock) <= 5).length;

  function openDistribution(claim) {
    setSelected(claim);
    setReceipt('');
    setDistError('');
  }

  function closeDistribution() {
    if (submittingDist) return;
    setSelected(null);
    setReceipt('');
    setDistError('');
  }

  async function handleDistribute() {
    if (!selected) return;
    setSubmittingDist(true);
    setDistError('');
    try {
      await api.post('/incentives/distributions', {
        claim_id: selected.id,
        receipt_proof: receipt.trim() || null,
      });
      setNotice(`Distribusi ${selected.category_name} untuk ${selected.farmer_name} berhasil dicatat.`);
      setSelected(null);
      setReceipt('');
      await loadData();
    } catch (err) {
      setDistError(err.response?.data?.error || 'Gagal mencatat distribusi.');
    } finally {
      setSubmittingDist(false);
    }
  }

  function openActionModal(claim, type) {
    setActionClaim(claim);
    setActionType(type);
    setActionError('');
  }

  function closeActionModal() {
    if (submittingAction) return;
    setActionClaim(null);
    setActionError('');
  }

  async function handleActionConfirm({ reason, note }) {
    if (!actionClaim) return;
    setSubmittingAction(true);
    setActionError('');
    try {
      const endpoint = actionType === 'reject'
        ? `/claims/${actionClaim.id}/reject`
        : `/claims/${actionClaim.id}/cancel`;

      await api.post(endpoint, { reason, note });
      setNotice(`Klaim #${actionClaim.id} berhasil ${actionType === 'reject' ? 'ditolak' : 'dibatalkan'}.`);
      setActionClaim(null);
      await loadData();
    } catch (err) {
      setActionError(err.response?.data?.error || 'Gagal memproses klaim.');
    } finally {
      setSubmittingAction(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Penyaluran Bantuan"
        title="Distribusi Insentif"
        subtitle="Kelola antrean penyaluran bantuan, penolakan klaim tidak layak, dan pembatalan klaim."
        action={
          <button onClick={loadData} disabled={loading} className="btn-secondary">
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
            { label: 'Menunggu distribusi', value: pendingTotal, icon: Clock, cls: 'bg-amber-100 text-amber-600' },
            { label: 'Paket tersalurkan', value: historyTotal, icon: PackageCheck, cls: 'bg-green-100 text-green-600' },
            { label: 'Stok menipis', value: lowStock, icon: AlertCircle, cls: 'bg-rose-100 text-rose-600' },
          ].map((stat) => (
            <div key={stat.label} className="card flex items-center gap-3 p-3.5">
              <div className={`icon-tile h-9 w-9 ${stat.cls}`}>
                <stat.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-lg font-extrabold leading-none text-foreground">{stat.value}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
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
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <section className="card mt-5 overflow-hidden animate-fade-up">
        <div className="flex flex-col gap-3 p-5 lg:flex-row lg:items-center lg:justify-between lg:px-6 lg:pt-6">
          <div>
            <h3 className="text-base font-bold text-foreground">Daftar Antrean & Klaim</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Filter status dan kelola penyaluran insentif petani.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            {/* Status Filter Tabs */}
            <div className="flex rounded-xl bg-muted/60 p-1 text-xs">
              {[
                { key: 'diajukan', label: 'Menunggu' },
                { key: 'ditolak', label: 'Ditolak' },
                { key: 'dibatalkan', label: 'Dibatalkan' },
                { key: 'semua', label: 'Semua' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setStatusFilter(tab.key)}
                  className={`rounded-lg px-3 py-1 font-medium transition-colors ${
                    statusFilter === tab.key
                      ? 'bg-card text-foreground shadow-xs font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari petani, lahan, alasan..."
                className="input-field pl-10 text-xs"
              />
            </div>
          </div>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[1080px]">
            <thead>
              <tr>
                <th className="table-header">Bukti</th>
                <th className="table-header">Petani</th>
                <th className="table-header">Lahan</th>
                <th className="table-header">Insentif</th>
                <th className="table-header">Status</th>
                <th className="table-header">Waktu / Alasan</th>
                <th className="table-header">Stok</th>
                <th className="table-header text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-sm text-muted-foreground">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-primary" />
                    <p className="mt-2">Memuat daftar klaim...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center">
                    <div className="mx-auto flex max-w-xs flex-col items-center gap-2">
                      <div className="icon-tile h-12 w-12 bg-muted text-muted-foreground">
                        <Package className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">
                        {pending.length === 0 ? 'Tidak ada data klaim' : 'Klaim tidak ditemukan'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {pending.length === 0
                          ? 'Klaim baru akan muncul di sini setelah diajukan petani.'
                          : 'Coba kata kunci atau filter lain.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((claim) => {
                  const stock = Number(claim.stock) || 0;
                  const meta = statusMeta[claim.status] || { label: claim.status, variant: 'info' };

                  return (
                    <tr key={claim.id} className="transition-colors hover:bg-muted/30">
                      <td className="table-cell">
                        {claim.verified_photo_url ? (
                          <a
                            href={claim.verified_photo_url}
                            target="_blank"
                            rel="noreferrer"
                            className="block h-14 w-20 overflow-hidden rounded-xl bg-muted"
                          >
                            <img
                              src={claim.verified_photo_url}
                              alt={`Bukti ${claim.field_name}`}
                              loading="lazy"
                              className="h-full w-full object-cover"
                            />
                          </a>
                        ) : (
                          <div className="flex h-14 w-20 items-center justify-center rounded-xl bg-muted">
                            <Package className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </td>
                      <td className="table-cell">
                        <p className="font-semibold text-foreground">{claim.farmer_name || 'Petani'}</p>
                        {claim.farmer_phone && (
                          <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Phone className="h-3 w-3" /> {claim.farmer_phone}
                          </p>
                        )}
                      </td>
                      <td className="table-cell">
                        <p className="font-medium text-foreground">{claim.field_name}</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">{formatArea(claim.field_area)}</p>
                      </td>
                      <td className="table-cell">
                        <Badge variant="info">{claim.category_name}</Badge>
                      </td>
                      <td className="table-cell">
                        <Badge variant={meta.variant} icon={meta.icon}>
                          {meta.label}
                        </Badge>
                      </td>
                      <td className="table-cell max-w-xs">
                        <p className="text-xs font-medium text-foreground">
                          {formatDateTime(claim.claim_date)}
                        </p>
                        {claim.reason ? (
                          <p className="mt-1 text-xs text-destructive font-medium line-clamp-2" title={claim.reason}>
                            Alasan: {claim.reason}
                          </p>
                        ) : (
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            Menunggu {waitingLabel(claim.claim_date)}
                          </p>
                        )}
                      </td>
                      <td className="table-cell">
                        <span className={`badge ${stock <= 0 ? 'badge-danger' : stock <= 5 ? 'badge-warning' : 'badge-success'}`}>
                          {stock} unit
                        </span>
                      </td>
                      <td className="table-cell text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {claim.status === 'diajukan' && (
                            <>
                              <button
                                type="button"
                                onClick={() => openDistribution(claim)}
                                disabled={stock <= 0}
                                className="btn-primary py-1 px-2.5 text-xs inline-flex items-center gap-1"
                              >
                                <PackageCheck className="h-3.5 w-3.5" />
                                {stock <= 0 ? 'Stok habis' : 'Distribusikan'}
                              </button>
                              <button
                                type="button"
                                onClick={() => openActionModal(claim, 'reject')}
                                className="btn-secondary py-1 px-2 text-xs text-destructive hover:bg-destructive/10 inline-flex items-center gap-1"
                                title="Tolak klaim"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                Tolak
                              </button>
                              <button
                                type="button"
                                onClick={() => openActionModal(claim, 'cancel')}
                                className="btn-secondary py-1 px-2 text-xs text-muted-foreground hover:bg-muted inline-flex items-center gap-1"
                                title="Batalkan klaim"
                              >
                                <Ban className="h-3.5 w-3.5" />
                                Batal
                              </button>
                            </>
                          )}

                          {claim.status === 'disetujui' && user?.role === 'admin' && (
                            <button
                              type="button"
                              onClick={() => openActionModal(claim, 'cancel')}
                              className="btn-secondary py-1 px-2.5 text-xs text-destructive hover:bg-destructive/10 inline-flex items-center gap-1"
                              title="Batalkan klaim dan kembalikan stok"
                            >
                              <Ban className="h-3.5 w-3.5" />
                              Batalkan
                            </button>
                          )}

                          {(claim.status === 'ditolak' || claim.status === 'dibatalkan') && (
                            <span className="text-[11px] text-muted-foreground italic">Selesai</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card mt-5 overflow-hidden animate-fade-up delay-100">
        <div className="flex items-center justify-between gap-3 p-5 lg:px-6 lg:pt-6">
          <div>
            <h3 className="text-base font-bold text-foreground">Riwayat Distribusi</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">Penyaluran terbaru yang sudah dicatat.</p>
          </div>
          <Badge variant="success">{historyTotal} total</Badge>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead>
              <tr>
                <th className="table-header">Tanggal</th>
                <th className="table-header">Petani</th>
                <th className="table-header">Lahan</th>
                <th className="table-header">Insentif</th>
                <th className="table-header">Petugas</th>
                <th className="table-header">Bukti</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-muted-foreground">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-primary" />
                    <p className="mt-2">Memuat riwayat...</p>
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-muted-foreground">
                    Belum ada distribusi yang dicatat.
                  </td>
                </tr>
              ) : (
                history.map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-muted/30">
                    <td className="table-cell text-xs text-muted-foreground">
                      {formatDateTime(item.distribution_date)}
                    </td>
                    <td className="table-cell font-medium text-foreground">{item.farmer_name}</td>
                    <td className="table-cell text-muted-foreground">{item.field_name}</td>
                    <td className="table-cell">
                      <Badge variant="success">{item.category_name}</Badge>
                    </td>
                    <td className="table-cell text-xs text-muted-foreground">{item.officer_name}</td>
                    <td className="table-cell">
                      <ReceiptValue value={item.receipt_proof} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selected && (
        <DistributionModal
          claim={selected}
          receipt={receipt}
          setReceipt={setReceipt}
          onClose={closeDistribution}
          onConfirm={handleDistribute}
          submitting={submittingDist}
          error={distError}
        />
      )}

      {actionClaim && (
        <ClaimActionModal
          claim={actionClaim}
          type={actionType}
          onClose={closeActionModal}
          onConfirm={handleActionConfirm}
          submitting={submittingAction}
          error={actionError}
        />
      )}
    </div>
  );
}
