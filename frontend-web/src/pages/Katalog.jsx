import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Wheat,
  Leaf,
  Wrench,
  Package,
  ArrowRight,
  Loader2,
  AlertCircle,
  RefreshCw,
  Plus,
  Pencil,
  X,
  CheckCircle2,
  Save,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

const filters = ['Semua', 'Benih', 'Pupuk', 'Alat'];

function categoryType(name) {
  const value = String(name || '').toLowerCase();
  if (value.includes('benih') || value.includes('bibit')) return 'Benih';
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

function CategoryModal({ mode, item, onClose, onSaved }) {
  const [name, setName] = useState(item?.name || '');
  const [quantity, setQuantity] = useState(String(item?.quantity ?? 0));
  const [requirements, setRequirements] = useState(item?.requirements || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === 'Escape' && !saving) onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose, saving]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;
    setError('');

    const normalizedName = name.trim();
    const numericQuantity = Number(quantity);

    if (!normalizedName) {
      setError('Nama kategori wajib diisi.');
      return;
    }
    if (quantity === '' || !Number.isInteger(numericQuantity) || numericQuantity < 0) {
      setError('Stok harus berupa bilangan bulat 0 atau lebih.');
      return;
    }
    if (requirements.trim().length > 500) {
      setError('Persyaratan maksimal 500 karakter.');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name: normalizedName,
        quantity: numericQuantity,
        requirements: requirements.trim() || null,
      };
      const response =
        mode === 'edit'
          ? await api.patch(`/incentives/categories/${item.id}`, payload)
          : await api.post('/incentives/categories', payload);
      onSaved(response.data.data, mode);
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal menyimpan kategori insentif.');
    } finally {
      setSaving(false);
    }
  };

  const title = mode === 'edit' ? 'Kelola Kategori' : 'Tambah Kategori';
  const subtitle =
    mode === 'edit'
      ? 'Perbarui nama, stok, atau persyaratan insentif.'
      : 'Tambahkan jenis bantuan baru ke katalog.';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4 backdrop-blur-sm animate-fade-in"
      onClick={() => !saving && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-modal-title"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl animate-fade-up"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative overflow-hidden bg-gradient-to-br from-green-600 to-emerald-700 p-6 text-white">
          <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="icon-tile h-11 w-11 bg-white/15 backdrop-blur-sm">
                {mode === 'edit' ? <Pencil className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              </div>
              <div>
                <h2 id="category-modal-title" className="text-lg font-bold">
                  {title}
                </h2>
                <p className="text-xs text-green-100/90">{subtitle}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg p-1.5 transition-colors hover:bg-white/10 disabled:opacity-50"
              aria-label="Tutup"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label
              htmlFor="category-name"
              className="mb-1.5 block text-sm font-semibold text-gray-700"
            >
              Nama kategori
            </label>
            <input
              id="category-name"
              type="text"
              required
              maxLength={100}
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="input-field"
              placeholder="Contoh: Benih Jagung"
            />
          </div>

          <div>
            <label
              htmlFor="category-quantity"
              className="mb-1.5 block text-sm font-semibold text-gray-700"
            >
              Stok tersedia
            </label>
            <input
              id="category-quantity"
              type="number"
              required
              min={0}
              max={2147483647}
              step={1}
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              className="input-field"
              placeholder="0"
            />
            <p className="mt-1.5 text-[11px] text-gray-500">
              Stok berkurang otomatis saat insentif didistribusikan.
            </p>
          </div>

          <div>
            <label
              htmlFor="category-requirements"
              className="mb-1.5 block text-sm font-semibold text-gray-700"
            >
              Persyaratan <span className="font-normal text-gray-500">(opsional)</span>
            </label>
            <textarea
              id="category-requirements"
              rows={3}
              maxLength={500}
              value={requirements}
              onChange={(event) => setRequirements(event.target.value)}
              className="input-field resize-none"
              placeholder="Contoh: Lahan terverifikasi zero burning minimal satu periode."
            />
            <p className="mt-1.5 text-[11px] text-gray-500">{requirements.length}/500 karakter</p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="btn-secondary flex-1"
            >
              Batal
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Katalog() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Semua');
  const [editor, setEditor] = useState(null);
  const isAdmin = user?.role === 'admin';

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/incentives/categories');
      setItems(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal memuat katalog insentif.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(''), 5000);
    return () => clearTimeout(timer);
  }, [notice]);

  const maxStock = useMemo(
    () => Math.max(1, ...items.map((item) => Number(item.quantity) || 0)),
    [items]
  );

  const stockSummary = useMemo(() => {
    const totalStock = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    const lowStock = items.filter((item) => Number(item.quantity) <= 5).length;
    return { totalStock, lowStock };
  }, [items]);

  const handleSaved = (saved, mode) => {
    setNotice(
      mode === 'edit'
        ? `${saved.name} berhasil diperbarui.`
        : `${saved.name} berhasil ditambahkan ke katalog.`
    );
    setEditor(null);
    load();
  };

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return items.filter((item) => {
      const type = categoryType(item.name);
      const matchesSearch =
        !keyword ||
        String(item.name || '').toLowerCase().includes(keyword) ||
        String(item.requirements || '').toLowerCase().includes(keyword);
      const matchesFilter = filter === 'Semua' || type === filter;
      return matchesSearch && matchesFilter;
    });
  }, [items, search, filter]);

  return (
    <div>
      <PageHeader
        eyebrow={isAdmin ? 'Khusus Admin' : 'Persediaan Bantuan'}
        title="Katalog Insentif"
        subtitle={
          isAdmin
            ? 'Kelola kategori, persyaratan, dan stok bantuan yang tersedia untuk petani terverifikasi.'
            : 'Daftar bantuan benih, pupuk, dan alat yang tersedia untuk petani terverifikasi.'
        }
        action={
          <div className="flex flex-wrap gap-2">
            <button
              onClick={load}
              disabled={loading}
              className="btn-secondary whitespace-nowrap"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Segarkan
            </button>
            {isAdmin && (
              <button
                onClick={() => setEditor({ mode: 'create', item: null })}
                className="btn-primary whitespace-nowrap"
              >
                <Plus className="w-4 h-4" /> Tambah Kategori
              </button>
            )}
          </div>
        }
      >
        {isAdmin && (
          <div className="grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              {
                label: 'Kategori aktif',
                value: items.length,
                icon: Package,
                tone: 'bg-green-100 text-green-600',
              },
              {
                label: 'Total stok',
                value: stockSummary.totalStock.toLocaleString('id-ID'),
                icon: Wheat,
                tone: 'bg-amber-100 text-amber-600',
              },
              {
                label: 'Stok menipis',
                value: stockSummary.lowStock,
                icon: AlertCircle,
                tone: 'bg-rose-100 text-rose-600',
              },
            ].map((stat) => (
              <div key={stat.label} className="card flex items-center gap-3 p-3.5">
                <div className={`icon-tile h-9 w-9 ${stat.tone}`}>
                  <stat.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-lg font-extrabold leading-none text-gray-900">{stat.value}</p>
                  <p className="mt-1 text-[11px] text-gray-500">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </PageHeader>

      {notice && (
        <div
          role="status"
          className="mt-4 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 animate-fade-in"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="flex-1">{notice}</span>
          <button
            onClick={() => setNotice('')}
            className="text-green-700/70 hover:text-green-900"
            aria-label="Tutup notifikasi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="mt-6 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {filters.map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={`chip ${filter === item ? 'chip-active' : ''}`}
            >
              {item === 'Semua' ? <Package className="w-3.5 h-3.5" /> : null}
              {item}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari insentif..."
            className="input-field pl-10"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="mt-5 card flex flex-col items-center justify-center p-12 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin text-green-600" />
          <p className="mt-3 text-sm">Memuat katalog...</p>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4 4xl:grid-cols-5 gap-5">
          {filtered.map((item, index) => {
            const visual = visualFor(item.name);
            const Icon = visual.icon;
            const quantity = Number(item.quantity) || 0;
            const type = categoryType(item.name);

            return (
              <div
                key={item.id}
                className={`card card-hover p-5 animate-fade-up delay-${Math.min(index + 1, 4) * 100}`}
              >
                <div className="flex items-start justify-between">
                  <div className={`icon-tile w-12 h-12 ${visual.tone}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="badge badge-info">{type}</span>
                </div>

                <h3 className="mt-4 text-lg font-bold text-gray-900">{item.name}</h3>
                <p className="mt-1 text-xs text-gray-500 line-clamp-2 min-h-[2rem]">
                  {item.requirements || 'Belum ada ketentuan khusus.'}
                </p>

                <div className="mt-3 space-y-2.5">
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-semibold mb-1.5">
                      <span className="text-gray-500">Stok tersedia</span>
                      <span className={quantity > 0 ? 'text-gray-800' : 'text-rose-600'}>
                        {quantity} unit
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${visual.bar}`}
                        style={{ width: `${Math.max(4, (quantity / maxStock) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                    <span className="text-[11px] font-medium text-gray-500">Status stok</span>
                    <span className={`badge ${quantity > 0 ? 'badge-success' : 'badge-danger'}`}>
                      {quantity > 0 ? 'Tersedia' : 'Habis'}
                    </span>
                  </div>
                </div>

                {isAdmin ? (
                  <button
                    onClick={() => setEditor({ mode: 'edit', item })}
                    className="mt-4 w-full btn-secondary text-xs"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Kelola Kategori
                  </button>
                ) : user?.role === 'petani' ? (
                  quantity > 0 ? (
                    <Link
                      to={`/klaim?category=${item.id}`}
                      className="mt-4 w-full btn-secondary text-xs"
                    >
                      Ajukan Klaim <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <button
                      disabled
                      className="mt-4 w-full btn-secondary text-xs opacity-60 cursor-not-allowed"
                    >
                      Stok Habis
                    </button>
                  )
                ) : (
                  <p className="mt-4 text-center text-[11px] text-gray-500">
                    Klaim hanya untuk akun petani
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="card mt-5 flex flex-col items-center gap-2 py-16 text-center">
          <div className="icon-tile w-12 h-12 bg-gray-100 text-gray-400">
            <Search className="w-5 h-5" />
          </div>
          <p className="text-sm font-semibold text-gray-700">Insentif tidak ditemukan</p>
          <p className="text-xs text-gray-500">Coba kata kunci atau kategori lain.</p>
        </div>
      )}

      {editor && (
        <CategoryModal
          key={`${editor.mode}-${editor.item?.id || 'new'}`}
          mode={editor.mode}
          item={editor.item}
          onClose={() => setEditor(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
