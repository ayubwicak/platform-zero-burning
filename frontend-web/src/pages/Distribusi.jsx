import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
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
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import api from '../lib/api';
import { formatArea, formatCoord, formatDateTime } from '../lib/format';

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
  if (!value) return <span className="text-gray-500">—</span>;
  if (/^https?:\/\//i.test(value)) {
    return (
      <a
        href={value}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 hover:text-green-800"
      >
        Lihat bukti <ExternalLink className="h-3 w-3" />
      </a>
    );
  }
  return (
    <span className="block max-w-[220px] truncate text-xs text-gray-600" title={value}>
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
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl animate-fade-up"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative overflow-hidden bg-gradient-to-br from-green-600 to-emerald-700 p-6 text-white">
          <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="icon-tile h-11 w-11 bg-white/15 backdrop-blur-sm">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <h2 id="distribution-modal-title" className="text-lg font-bold">
                  Catat Distribusi
                </h2>
                <p className="text-xs text-green-100/90">Pastikan insentif diterima petani.</p>
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
          <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-gray-900">{claim.farmer_name}</p>
                <p className="mt-0.5 text-xs text-gray-600">{claim.field_name}</p>
              </div>
              <span className="badge badge-warning">
                <Clock className="h-3 w-3" /> Menunggu
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-gray-600">Insentif</p>
                <p className="mt-0.5 font-semibold text-gray-800">{claim.category_name}</p>
              </div>
              <div>
                <p className="text-gray-600">Stok saat ini</p>
                <p className="mt-0.5 font-semibold text-gray-800">
                  {claim.stock} unit → {Math.max(0, Number(claim.stock) - 1)} unit
                </p>
              </div>
              <div>
                <p className="text-gray-600">Lahan</p>
                <p className="mt-0.5 font-semibold text-gray-800">{formatArea(claim.field_area)}</p>
              </div>
              <div>
                <p className="text-gray-600">Lokasi</p>
                <p className="mt-0.5 inline-flex items-center gap-1 font-mono text-[11px] text-gray-700">
                  <MapPin className="h-3 w-3 text-green-600" />
                  {formatCoord(claim.latitude)}, {formatCoord(claim.longitude)}
                </p>
              </div>
            </div>
            {claim.verified_photo_url && (
              <a
                href={claim.verified_photo_url}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-green-800 hover:text-green-900"
              >
                Lihat bukti foto terverifikasi <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>

          <div>
            <label htmlFor="receipt-proof" className="mb-1.5 block text-sm font-semibold text-gray-700">
              Bukti serah terima <span className="font-normal text-gray-600">(opsional)</span>
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
            <p className="mt-1.5 text-[11px] text-gray-500">
              Dapat berupa nomor berita acara, tautan, atau catatan singkat.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-700">
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

export default function Distribusi() {
  const [pending, setPending] = useState([]);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [history, setHistory] = useState([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [receipt, setReceipt] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [pendingResponse, historyResponse] = await Promise.all([
        api.get('/incentives/claims/pending'),
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
  }, []);

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
        String(claim.category_name || '').toLowerCase().includes(keyword)
    );
  }, [pending, query]);

  const lowStock = pending.filter((claim) => Number(claim.stock) <= 5).length;

  function openDistribution(claim) {
    setSelected(claim);
    setReceipt('');
    setFormError('');
  }

  function closeDistribution() {
    if (submitting) return;
    setSelected(null);
    setReceipt('');
    setFormError('');
  }

  async function handleDistribute() {
    if (!selected) return;
    setSubmitting(true);
    setFormError('');
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
      setFormError(err.response?.data?.error || 'Gagal mencatat distribusi.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Penyaluran Bantuan"
        title="Distribusi Insentif"
        subtitle="Catat penyaluran benih, pupuk, atau alat untuk klaim petani yang sudah terverifikasi."
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
                <p className="text-lg font-extrabold leading-none text-gray-900">{stat.value}</p>
                <p className="mt-1 text-[11px] text-gray-500">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </PageHeader>

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

      <section className="card mt-5 overflow-hidden animate-fade-up">
        <div className="flex flex-col gap-3 p-5 lg:flex-row lg:items-center lg:justify-between lg:px-6 lg:pt-6">
          <div>
            <h3 className="text-base font-bold text-gray-900">Antrean Distribusi</h3>
            <p className="mt-0.5 text-xs text-gray-500">
              Klaim yang sudah lolos verifikasi dan menunggu disalurkan.
            </p>
          </div>
          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari petani, lahan, atau insentif..."
              className="input-field pl-10"
            />
          </div>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[1040px]">
            <thead>
              <tr>
                <th className="table-header">Bukti</th>
                <th className="table-header">Petani</th>
                <th className="table-header">Lahan</th>
                <th className="table-header">Insentif</th>
                <th className="table-header">Diajukan</th>
                <th className="table-header">Stok</th>
                <th className="table-header text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-gray-500">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-green-600" />
                    <p className="mt-2">Memuat antrean distribusi...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <div className="mx-auto flex max-w-xs flex-col items-center gap-2">
                      <div className="icon-tile h-12 w-12 bg-gray-100 text-gray-500">
                        <Package className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-semibold text-gray-700">
                        {pending.length === 0 ? 'Tidak ada antrean distribusi' : 'Klaim tidak ditemukan'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {pending.length === 0
                          ? 'Klaim baru akan muncul di sini setelah diajukan petani.'
                          : 'Coba kata kunci lain.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((claim) => {
                  const stock = Number(claim.stock) || 0;
                  return (
                    <tr key={claim.id} className="transition-colors hover:bg-gray-50/70">
                      <td className="table-cell">
                        {claim.verified_photo_url ? (
                          <a
                            href={claim.verified_photo_url}
                            target="_blank"
                            rel="noreferrer"
                            className="block h-14 w-20 overflow-hidden rounded-xl bg-gray-100"
                          >
                            <img
                              src={claim.verified_photo_url}
                              alt={`Bukti ${claim.field_name}`}
                              loading="lazy"
                              className="h-full w-full object-cover"
                            />
                          </a>
                        ) : (
                          <div className="flex h-14 w-20 items-center justify-center rounded-xl bg-gray-100">
                            <Package className="h-5 w-5 text-gray-500" />
                          </div>
                        )}
                      </td>
                      <td className="table-cell">
                        <p className="font-semibold text-gray-900">{claim.farmer_name || 'Petani'}</p>
                        {claim.farmer_phone && (
                          <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-gray-500">
                            <Phone className="h-3 w-3" /> {claim.farmer_phone}
                          </p>
                        )}
                      </td>
                      <td className="table-cell">
                        <p className="font-medium text-gray-800">{claim.field_name}</p>
                        <p className="mt-0.5 text-[11px] text-gray-500">{formatArea(claim.field_area)}</p>
                      </td>
                      <td className="table-cell">
                        <span className="badge badge-info">{claim.category_name}</span>
                      </td>
                      <td className="table-cell">
                        <p className="text-xs font-medium text-gray-700">
                          {formatDateTime(claim.claim_date)}
                        </p>
                        <p className="mt-0.5 text-[11px] text-gray-500">
                          Menunggu {waitingLabel(claim.claim_date)}
                        </p>
                      </td>
                      <td className="table-cell">
                        <span className={`badge ${stock <= 0 ? 'badge-danger' : stock <= 5 ? 'badge-warning' : 'badge-success'}`}>
                          {stock} unit
                        </span>
                      </td>
                      <td className="table-cell text-right">
                        <button
                          type="button"
                          onClick={() => openDistribution(claim)}
                          disabled={stock <= 0}
                          className="inline-flex items-center gap-1 rounded-lg bg-green-700 px-3 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <PackageCheck className="h-3 w-3" />
                          {stock <= 0 ? 'Stok habis' : 'Catat'}
                        </button>
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
            <h3 className="text-base font-bold text-gray-900">Riwayat Distribusi</h3>
            <p className="mt-0.5 text-xs text-gray-500">Penyaluran terbaru yang sudah dicatat.</p>
          </div>
          <span className="badge badge-success">{historyTotal} total</span>
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
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-gray-500">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-green-600" />
                    <p className="mt-2">Memuat riwayat...</p>
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-gray-500">
                    Belum ada distribusi yang dicatat.
                  </td>
                </tr>
              ) : (
                history.map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-gray-50/70">
                    <td className="table-cell text-xs text-gray-500">
                      {formatDateTime(item.distribution_date)}
                    </td>
                    <td className="table-cell font-medium text-gray-900">{item.farmer_name}</td>
                    <td className="table-cell">{item.field_name}</td>
                    <td className="table-cell">
                      <span className="badge badge-success">{item.category_name}</span>
                    </td>
                    <td className="table-cell text-xs text-gray-600">{item.officer_name}</td>
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
          submitting={submitting}
          error={formError}
        />
      )}
    </div>
  );
}
