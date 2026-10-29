import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Wheat,
  Leaf,
  Wrench,
  Package,
  ArrowRight,
  ClipboardList,
  CheckCircle2,
  Clock,
  Wallet,
  ShieldCheck,
  PackageCheck,
  Loader2,
  AlertCircle,
  XCircle,
  Ban,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Select from '../components/ui/Select';
import api from '../lib/api';
import { formatArea, formatCoord } from '../lib/format';

const steps = [
  { label: 'Pilih Insentif', icon: ClipboardList },
  { label: 'Verifikasi', icon: ShieldCheck },
  { label: 'Distribusi', icon: PackageCheck },
];

const claimStatus = {
  diajukan: { label: 'Diproses', cls: 'badge-warning', icon: Clock },
  disetujui: { label: 'Disetujui', cls: 'badge-success', icon: CheckCircle2 },
  ditolak: { label: 'Ditolak', cls: 'badge-danger', icon: XCircle },
  dibatalkan: { label: 'Dibatalkan', cls: 'badge-danger', icon: Ban },
};

function categoryType(name) {
  const value = String(name || '').toLowerCase();
  if (value.includes('benih')) return 'Benih';
  if (value.includes('pupuk')) return 'Pupuk';
  if (value.includes('alat')) return 'Alat';
  return 'Lainnya';
}

function visualFor(name) {
  const type = categoryType(name);
  if (type === 'Benih') {
    return { icon: Wheat, tone: 'bg-amber-100 text-amber-600', bar: 'from-amber-400 to-orange-500' };
  }
  if (type === 'Pupuk') {
    return { icon: Leaf, tone: 'bg-green-100 text-green-600', bar: 'from-green-400 to-emerald-500' };
  }
  if (type === 'Alat') {
    return { icon: Wrench, tone: 'bg-blue-100 text-blue-600', bar: 'from-blue-400 to-sky-500' };
  }
  return { icon: Package, tone: 'bg-gray-100 text-gray-600', bar: 'from-gray-400 to-gray-500' };
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Klaim() {
  const [searchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [fields, setFields] = useState([]);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [selectedFieldId, setSelectedFieldId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [categoryResponse, fieldResponse, claimResponse] = await Promise.all([
        api.get('/incentives/categories'),
        api.get('/fields'),
        api.get('/incentives/claims'),
      ]);
      setCategories(categoryResponse.data.data || []);
      setFields(fieldResponse.data.data || []);
      setClaims(claimResponse.data.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal memuat data klaim.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [loadData]);

  useEffect(() => {
    if (fields.length === 0) return;
    setSelectedFieldId((current) => {
      if (current && fields.some((field) => String(field.id) === current)) {
        return current;
      }
      const verified = fields.find((field) => Number(field.verified_photo_count) > 0);
      return String((verified || fields[0]).id);
    });
  }, [fields]);

  useEffect(() => {
    const categoryId = searchParams.get('category');
    if (!categoryId) return;
    if (categories.some((category) => String(category.id) === categoryId)) {
      setSelectedCategoryId(categoryId);
    }
  }, [searchParams, categories]);

  const selectedCategory =
    categories.find((category) => String(category.id) === String(selectedCategoryId)) || null;
  const selectedField =
    fields.find((field) => String(field.id) === String(selectedFieldId)) || null;
  const fieldOptions = useMemo(() => {
    return fields.map((field) => ({
      value: String(field.id),
      label: field.name,
      description: formatArea(field.area),
    }));
  }, [fields]);
  const selectedVisual = selectedCategory ? visualFor(selectedCategory.name) : null;
  const selectedStock = Number(selectedCategory?.quantity) || 0;
  const selectedFieldVerified = Number(selectedField?.verified_photo_count) > 0;
  const pendingCount = claims.filter((claim) => claim.status === 'diajukan').length;
  const approvedCount = claims.filter((claim) => claim.status === 'disetujui').length;
  const activeStep = approvedCount > 0 ? 2 : pendingCount > 0 ? 1 : 0;
  const maxStock = Math.max(1, ...categories.map((category) => Number(category.quantity) || 0));

  async function handleClaim() {
    if (!selectedCategory || !selectedField) {
      setFormError('Pilih kategori insentif dan lahan terlebih dahulu.');
      return;
    }

    setSubmitting(true);
    setFormError('');
    setNotice('');

    try {
      await api.post('/incentives/claims', {
        field_id: selectedField.id,
        category_id: selectedCategory.id,
      });
      setNotice('Klaim berhasil diajukan dan menunggu verifikasi petugas.');
      await loadData();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Gagal mengajukan klaim.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Bantuan Petani"
        title="Klaim Insentif"
        subtitle="Ajukan bantuan benih, pupuk, atau alat setelah lahan terverifikasi zero burning."
      />

      <div className="mt-6 card p-4 lg:p-5 animate-fade-up">
        <div className="flex items-center justify-between gap-2 max-w-2xl mx-auto">
          {steps.map((step, index) => {
            const state =
              index < activeStep ? 'done' : index === activeStep ? 'active' : 'todo';
            return (
              <div key={step.label} className="flex items-center gap-2 flex-1 last:flex-none">
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <div
                    className={`icon-tile w-9 h-9 text-sm font-bold shrink-0 ${
                      state === 'active'
                        ? 'bg-green-600 text-white shadow-md shadow-green-200'
                        : state === 'done'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    <step.icon className="w-4 h-4" />
                  </div>
                  <span
                    className={`text-[11px] sm:text-xs font-semibold ${
                      state === 'todo' ? 'text-gray-400' : 'text-gray-900'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden sm:block flex-1 h-px bg-gray-200 mx-2" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="mt-5 grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 space-y-5">
          <div className="card p-5 lg:p-6 animate-fade-up">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">Pilih Kategori Insentif</h3>
                <p className="text-xs text-gray-500 mt-0.5">Satu klaim untuk satu kategori</p>
              </div>
              <span className="badge badge-info">
                <Wallet className="w-3 h-3" /> Stok tersedia
              </span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin text-green-600" /> Memuat kategori...
              </div>
            ) : categories.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-gray-200 py-8 text-center text-sm text-gray-500">
                Belum ada kategori insentif.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {categories.map((category) => {
                  const visual = visualFor(category.name);
                  const Icon = visual.icon;
                  const quantity = Number(category.quantity) || 0;
                  const isSelected = String(selectedCategoryId) === String(category.id);
                  const disabled = quantity <= 0;

                  return (
                    <button
                      key={category.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        setSelectedCategoryId(String(category.id));
                        setFormError('');
                        setNotice('');
                      }}
                      className={`group relative rounded-2xl border p-4 text-left transition-all duration-200 ${
                        isSelected
                          ? 'border-green-500 bg-green-50/60 ring-2 ring-green-500/20 shadow-md shadow-green-100'
                          : 'border-gray-100 bg-white hover:border-green-200 hover:shadow-sm'
                      } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
                    >
                      {isSelected && (
                        <span className="absolute top-3 right-3 icon-tile w-5 h-5 rounded-full bg-green-600 text-white">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </span>
                      )}
                      <div className={`icon-tile w-11 h-11 ${visual.tone} mb-3 group-hover:scale-105 transition-transform`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <p className="text-sm font-bold text-gray-900">{category.name}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5 mb-3 line-clamp-2 min-h-[2rem]">
                        {category.requirements || 'Tanpa ketentuan khusus'}
                      </p>
                      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${visual.bar}`}
                          style={{ width: `${Math.max(4, (quantity / maxStock) * 100)}%` }}
                        />
                      </div>
                      <p className="mt-1.5 text-[11px] font-semibold text-gray-600">
                        Stok: {quantity}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="card overflow-hidden animate-fade-up delay-100">
            <div className="flex items-center justify-between p-5 lg:px-6 lg:pt-6">
              <div>
                <h3 className="text-base font-bold text-gray-900">Riwayat Klaim</h3>
                <p className="text-xs text-gray-500 mt-0.5">Klaim terbaru dari lahan Anda</p>
              </div>
            </div>
            <div className="overflow-x-auto mt-3">
              <table className="w-full min-w-[560px]">
                <thead>
                  <tr>
                    <th className="table-header">ID</th>
                    <th className="table-header">Lahan</th>
                    <th className="table-header">Insentif</th>
                    <th className="table-header">Tanggal</th>
                    <th className="table-header text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-sm text-gray-500">
                        <Loader2 className="mx-auto w-5 h-5 animate-spin text-green-600" />
                        <p className="mt-2">Memuat riwayat...</p>
                      </td>
                    </tr>
                  ) : claims.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-sm text-gray-500">
                        Belum ada klaim. Pilih kategori di atas untuk mengajukan.
                      </td>
                    </tr>
                  ) : (
                    claims.map((claim) => {
                      const meta = claimStatus[claim.status] || {
                        label: claim.status,
                        cls: 'badge-info',
                        icon: Clock,
                      };

                      return (
                        <tr key={claim.id} className="hover:bg-gray-50/70 transition-colors">
                          <td className="table-cell font-mono text-xs font-semibold text-gray-500">
                            #CL-{String(claim.id).padStart(3, '0')}
                          </td>
                          <td className="table-cell font-medium text-gray-900">{claim.field_name}</td>
                          <td className="table-cell">{claim.category_name}</td>
                          <td className="table-cell text-xs text-gray-500">{formatDate(claim.claim_date)}</td>
                          <td className="table-cell text-right">
                            <span className={`badge ${meta.cls}`}>
                              <meta.icon className="w-3 h-3" /> {meta.label}
                            </span>
                            {claim.reason && (
                              <p className="mt-1 text-[11px] text-destructive max-w-[200px] ml-auto text-right font-medium" title={claim.reason}>
                                Alasan: {claim.reason}
                              </p>
                            )}
                            {claim.distribution_date && (
                              <p className="mt-1 text-[10px] text-muted-foreground">
                                Distribusi {formatDate(claim.distribution_date)}
                              </p>
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
        </div>

        <div className="space-y-5">
          <div className="card p-5 lg:p-6 animate-fade-up delay-200">
            <h3 className="text-base font-bold text-gray-900 mb-4">Konfirmasi Klaim</h3>

            {selectedCategory && selectedVisual ? (
              <div className="space-y-4">
                <div className={`rounded-2xl p-4 ${selectedVisual.tone}`}>
                  <selectedVisual.icon className="w-6 h-6" />
                  <p className="mt-2 text-lg font-bold">{selectedCategory.name}</p>
                  <p className="text-[11px] font-medium opacity-80">
                    {selectedCategory.requirements || 'Tanpa ketentuan khusus'}
                  </p>
                </div>

                <div>
                  <label htmlFor="klaim-field-select" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Lahan
                  </label>
                  {fields.length > 0 ? (
                    <Select
                      id="klaim-field-select"
                      aria-label="Pilih Lahan untuk Klaim"
                      value={selectedFieldId}
                      onChange={(val) => {
                        setSelectedFieldId(val);
                        setFormError('');
                        setNotice('');
                      }}
                      options={fieldOptions}
                      placeholder="Pilih lahan..."
                      searchable={fields.length > 5}
                    />
                  ) : (
                    <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
                      Belum ada lahan.{' '}
                      <Link to="/fields" className="font-semibold underline">
                        Daftarkan lahan dulu
                      </Link>
                      .
                    </p>
                  )}
                </div>

                {selectedField && (
                  <div className="space-y-2.5 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Luas</span>
                      <span className="font-semibold text-gray-900">{formatArea(selectedField.area)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Lokasi</span>
                      <span className="font-mono text-xs text-gray-700">
                        {formatCoord(selectedField.latitude)}, {formatCoord(selectedField.longitude)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Status lahan</span>
                      <span className={`badge ${selectedFieldVerified ? 'badge-success' : 'badge-warning'}`}>
                        {selectedFieldVerified ? 'Terverifikasi' : 'Belum terverifikasi'}
                      </span>
                    </div>
                  </div>
                )}

                {selectedField && !selectedFieldVerified && (
                  <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
                    Lahan ini belum memiliki foto terverifikasi. Unggah foto dan tunggu verifikasi petugas.
                  </p>
                )}

                {selectedStock <= 0 && (
                  <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-700">
                    Stok kategori ini sedang habis.
                  </p>
                )}

                {formError && (
                  <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-700">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{formError}</span>
                  </div>
                )}

                {notice && (
                  <div className="flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2.5 text-xs text-green-800">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{notice}</span>
                  </div>
                )}

                <button
                  onClick={handleClaim}
                  disabled={submitting || !selectedFieldVerified || selectedStock <= 0 || !selectedField}
                  className="btn-primary w-full"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                  {submitting ? 'Mengajukan...' : 'Ajukan Klaim'}
                </button>
                <p className="text-center text-[11px] text-gray-400">
                  Klaim akan diverifikasi petugas sebelum distribusi.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 py-10 text-center">
                <div className="icon-tile w-11 h-11 bg-gray-100 text-gray-400">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <p className="text-sm font-semibold text-gray-700">Belum ada pilihan</p>
                <p className="text-xs text-gray-500 max-w-[200px]">
                  Pilih salah satu kategori insentif di samping.
                </p>
              </div>
            )}
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-600 to-emerald-700 p-5 text-white animate-fade-up delay-300">
            <div className="absolute -top-8 -right-6 w-28 h-28 rounded-full bg-white/10" />
            <div className="relative">
              <Wallet className="w-6 h-6" />
              <p className="mt-2 text-2xl font-extrabold">{claims.length}</p>
              <p className="text-xs text-green-50/90">Total klaim Anda</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                <div className="rounded-lg bg-white/10 px-2.5 py-2">
                  <p className="text-lg font-bold">{pendingCount}</p>
                  <p className="text-green-100/90">Diproses</p>
                </div>
                <div className="rounded-lg bg-white/10 px-2.5 py-2">
                  <p className="text-lg font-bold">{approvedCount}</p>
                  <p className="text-green-100/90">Disetujui</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
