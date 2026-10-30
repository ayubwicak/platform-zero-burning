import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Download,
  History,
  Loader2,
  Package,
  PackagePlus,
  RefreshCw,
  Search,
  ShieldCheck,
  Truck,
  UserCheck,
  UserCog,
  UserPlus,
  UserX,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import api from '../lib/api';
import { formatDateTime } from '../lib/format';

const roleLabels = {
  petani: 'Petani',
  petugas: 'Petugas Lapangan',
  admin: 'Administrator',
  sistem: 'Sistem',
};

const actionMeta = {
  'user.created': {
    label: 'Pengguna dibuat',
    group: 'akun',
    icon: UserPlus,
    tone: 'bg-blue-100 text-blue-700',
    badge: 'badge-info',
  },
  'user.role_changed': {
    label: 'Role diubah',
    group: 'akun',
    icon: UserCog,
    tone: 'bg-purple-100 text-purple-700',
    badge: 'bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-200',
  },
  'user.status_changed': {
    label: 'Status akun',
    group: 'akun',
    icon: UserCheck,
    tone: 'bg-amber-100 text-amber-800',
    badge: 'badge-warning',
  },
  'category.created': {
    label: 'Kategori dibuat',
    group: 'katalog',
    icon: PackagePlus,
    tone: 'bg-green-100 text-green-700',
    badge: 'badge-success',
  },
  'category.updated': {
    label: 'Katalog diubah',
    group: 'katalog',
    icon: Package,
    tone: 'bg-amber-100 text-amber-800',
    badge: 'badge-warning',
  },
  'stock.distributed': {
    label: 'Stok terdistribusi',
    group: 'stok',
    icon: Truck,
    tone: 'bg-sky-100 text-sky-700',
    badge: 'badge-info',
  },
};

const fallbackMeta = {
  label: 'Aktivitas',
  group: 'lainnya',
  icon: History,
  tone: 'bg-gray-100 text-gray-600',
  badge: 'badge-info',
};

const filters = [
  { key: 'semua', label: 'Semua' },
  { key: 'akun', label: 'Akun & Role' },
  { key: 'katalog', label: 'Katalog' },
  { key: 'stok', label: 'Stok' },
];

function resolveMeta(log) {
  const base = actionMeta[log.action] || { ...fallbackMeta, label: log.action || fallbackMeta.label };

  if (log.action === 'user.status_changed') {
    const active = Boolean(log.metadata?.new_active);
    return {
      ...base,
      label: active ? 'Akun diaktifkan' : 'Akun dinonaktifkan',
      icon: active ? UserCheck : UserX,
      tone: active ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700',
      badge: active ? 'badge-success' : 'badge-danger',
    };
  }

  return base;
}

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState({ total: 0, account: 0, catalog: 0, stock: 0 });
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('semua');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/audit-logs', { params: { limit: 100 } });
      setLogs(response.data.data || []);
      setTotal(response.data.total || 0);
      setSummary(
        response.data.summary || { total: 0, account: 0, catalog: 0, stock: 0 }
      );
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal memuat audit log.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleExport = useCallback(async (format) => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      params.append('format', format);
      if (query) params.append('q', query);
      if (filter !== 'semua') {
        const entityType = filter === 'akun' ? 'user' : filter === 'katalog' ? 'category' : 'stock';
        params.append('entity_type', entityType);
      }

      const response = await api.get(`/audit-logs/export?${params}`, {
        responseType: format === 'csv' ? 'blob' : 'json',
      });

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `audit-log-${timestamp}.${format}`;
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal mengunduh audit log.');
    } finally {
      setExporting(false);
    }
  }, [query, filter]);

  useEffect(() => {
    load();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        load();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [load]);

  const decorated = useMemo(
    () => logs.map((log) => ({ log, meta: resolveMeta(log) })),
    [logs]
  );

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return decorated.filter(({ log, meta }) => {
      const matchFilter = filter === 'semua' || meta.group === filter;
      const matchQuery =
        !keyword ||
        String(log.summary || '').toLowerCase().includes(keyword) ||
        String(log.actor_name || '').toLowerCase().includes(keyword) ||
        String(log.action || '').toLowerCase().includes(keyword) ||
        String(log.entity_type || '').toLowerCase().includes(keyword);
      return matchFilter && matchQuery;
    });
  }, [decorated, filter, query]);

  const groupCounts = {
    semua: summary.total,
    akun: summary.account,
    katalog: summary.catalog,
    stok: summary.stock,
  };

  const stats = [
    { label: 'Total Aktivitas', value: summary.total, icon: History, tone: 'bg-gray-100 text-gray-600' },
    { label: 'Akun & Role', value: summary.account, icon: ShieldCheck, tone: 'bg-purple-100 text-purple-700' },
    { label: 'Katalog', value: summary.catalog, icon: Package, tone: 'bg-green-100 text-green-700' },
    { label: 'Stok Terdistribusi', value: summary.stock, icon: Truck, tone: 'bg-sky-100 text-sky-700' },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Khusus Admin"
        title="Audit Log"
        subtitle="Jejak perubahan role, status akun, katalog, dan stok yang dilakukan administrator."
        action={
          <div className="relative group">
            <button className="btn-secondary whitespace-nowrap" disabled={exporting || logs.length === 0}>
              <Download className="w-4 h-4" /> Unduh
            </button>
            <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              <button
                onClick={() => handleExport('csv')}
                disabled={exporting}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg border-b border-gray-100"
              >
                CSV
              </button>
              <button
                onClick={() => handleExport('json')}
                disabled={exporting}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 last:rounded-b-lg"
              >
                JSON
              </button>
            </div>
          </div>
        }
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((stat) => (
            <div key={stat.label} className="card p-4 flex items-center gap-3">
              <div className={`icon-tile w-10 h-10 ${stat.tone}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl font-extrabold text-gray-900 leading-none">{stat.value}</p>
                <p className="text-[11px] text-gray-500 mt-1">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-gray-500">
          Catatan audit bersifat permanen dan hanya dapat dibaca. Perubahan stok akibat distribusi
          juga tercatat otomatis.
        </p>
      </PageHeader>

      <div className="mt-4 flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-800">
        <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          Hanya admin yang dapat membuka halaman ini. Setiap perubahan role, status akun, kategori,
          dan stok dicatat dengan nama pelaku serta waktu kejadian.
        </span>
      </div>

      <div className="mt-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {filters.map((item) => (
            <button
              key={item.key}
              onClick={() => setFilter(item.key)}
              className={`chip ${filter === item.key ? 'chip-active' : ''}`}
            >
              {item.label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  filter === item.key ? 'bg-white/20' : 'bg-gray-100'
                }`}
              >
                {groupCounts[item.key]}
              </span>
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari aktivitas atau pelaku..."
            className="input-field pl-10"
            aria-label="Cari audit log"
          />
        </div>
      </div>

      <div className="mt-4 card overflow-hidden animate-fade-up">
        {loading && logs.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin" /> Memuat audit log...
          </div>
        ) : error ? (
          <div className="m-5 flex flex-col items-center gap-3 rounded-xl border border-rose-100 bg-rose-50 px-4 py-8 text-center">
            <AlertCircle className="w-6 h-6 text-rose-500" />
            <p className="text-sm font-semibold text-rose-700">{error}</p>
            <button onClick={load} className="btn-secondary text-xs">
              <RefreshCw className="w-3.5 h-3.5" /> Coba lagi
            </button>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <div className="icon-tile w-12 h-12 bg-gray-100 text-gray-500">
              <History className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-gray-700">Belum ada aktivitas tercatat</p>
            <p className="max-w-md text-xs text-gray-500">
              Perubahan role, status akun, katalog, dan stok akan otomatis muncul di sini.
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-5 py-4">
              <div>
                <h2 className="text-sm font-bold text-gray-900">Riwayat aktivitas</h2>
                <p className="text-xs text-gray-500">
                  {total > logs.length
                    ? `Menampilkan ${logs.length} dari ${total} aktivitas terbaru.`
                    : `${total} aktivitas tercatat.`}
                </p>
              </div>
              <span className="badge badge-info">{filtered.length} ditampilkan</span>
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                <div className="icon-tile w-12 h-12 bg-gray-100 text-gray-500">
                  <Search className="w-5 h-5" />
                </div>
                <p className="text-sm font-semibold text-gray-700">Aktivitas tidak ditemukan</p>
                <p className="text-xs text-gray-500">Coba ubah filter atau kata pencarian.</p>
              </div>
            ) : (
              <ol className="divide-y divide-gray-100">
                {filtered.map(({ log, meta }) => {
                  const Icon = meta.icon;
                  const actorRole = roleLabels[log.actor_role] || log.actor_role || 'Sistem';
                  const showActorRole =
                    actorRole.toLowerCase() !== String(log.actor_name || '').toLowerCase();
                  return (
                    <li key={log.id} className="flex items-start gap-3 p-4 sm:gap-4 sm:p-5">
                      <div className={`icon-tile w-10 h-10 shrink-0 ${meta.tone}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`badge ${meta.badge}`}>{meta.label}</span>
                          <time dateTime={log.created_at} className="text-[11px] text-gray-500">
                            {formatDateTime(log.created_at)}
                          </time>
                        </div>
                        <p className="mt-1.5 text-sm font-semibold leading-snug text-gray-900 break-words">
                          {log.summary}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          oleh{' '}
                          <span className="font-semibold text-gray-700">{log.actor_name}</span>
                          {showActorRole && ` · ${actorRole}`}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </>
        )}
      </div>
    </div>
  );
}
