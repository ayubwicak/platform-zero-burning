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
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

const filters = ['Semua', 'Benih', 'Pupuk', 'Alat'];

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

export default function Katalog() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Semua');

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

  const maxStock = useMemo(
    () => Math.max(1, ...items.map((item) => Number(item.quantity) || 0)),
    [items]
  );

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
        eyebrow="Persediaan Bantuan"
        title="Katalog Insentif"
        subtitle="Daftar bantuan benih, pupuk, dan alat yang tersedia untuk petani terverifikasi."
        action={
          <button onClick={load} disabled={loading} className="btn-secondary">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Segarkan
          </button>
        }
      />

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
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
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

                {user?.role === 'petani' ? (
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
                  <p className="mt-4 text-center text-[11px] text-gray-400">
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
    </div>
  );
}
