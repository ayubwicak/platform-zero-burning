import { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Search,
  RefreshCw,
  Users,
  Sprout,
  ShieldCheck,
  UserCog,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  UserX,
  UserCheck,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Select from '../components/ui/Select';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

const roleMeta = {
  petani: {
    label: 'Petani',
    badge: 'badge-success',
    avatar: 'from-green-500 to-emerald-700',
    icon: Sprout,
    desc: 'Mengelola lahan, mengunggah foto, dan mengajukan klaim insentif.',
  },
  petugas: {
    label: 'Petugas',
    badge: 'badge-info',
    avatar: 'from-blue-500 to-sky-700',
    icon: ShieldCheck,
    desc: 'Melakukan verifikasi resmi dan mencatat distribusi insentif.',
  },
  admin: {
    label: 'Admin',
    badge: 'bg-purple-100 text-purple-700',
    avatar: 'from-purple-500 to-fuchsia-700',
    icon: UserCog,
    desc: 'Akses penuh, termasuk pengelolaan akun dan hak akses pengguna.',
  },
};

const roleKeys = ['petani', 'petugas', 'admin'];

const emptyCreateForm = {
  nama: '',
  email: '',
  password: '',
  role: 'petani',
  nik: '',
  phone: '',
  address: '',
  nip: '',
  position: '',
  unit: '',
};

function initials(nama) {
  return (
    String(nama || '')
      .trim()
      .split(/\s+/)
      .map((word) => word[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?'
  );
}

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function RolePicker({ value, onChange }) {
  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {roleKeys.map((key) => {
          const meta = roleMeta[key];
          const active = value === key;
          return (
            <button
              type="button"
              key={key}
              onClick={() => onChange(key)}
              className={`rounded-xl border p-3 text-left transition-all ${
                active
                  ? 'border-green-500 bg-green-50 ring-2 ring-green-500/20'
                  : 'border-gray-200 hover:border-green-200 hover:bg-gray-50'
              }`}
            >
              <meta.icon className={`w-4 h-4 ${active ? 'text-green-600' : 'text-gray-400'}`} />
              <p className={`mt-2 text-xs font-bold ${active ? 'text-green-700' : 'text-gray-700'}`}>
                {meta.label}
              </p>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] text-gray-500">{roleMeta[value].desc}</p>
    </div>
  );
}

function ModalShell({ title, subtitle, icon: Icon, onClose, children }) {
  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === 'Escape' && !event.defaultPrevented) onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl animate-fade-up"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative overflow-hidden bg-gradient-to-br from-green-800 to-emerald-900 p-6 text-white">
          <div className="absolute -top-10 -right-8 w-32 h-32 rounded-full bg-white/10" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="icon-tile w-11 h-11 bg-white/15 backdrop-blur-sm">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold">{title}</h2>
                <p className="text-xs text-green-100">{subtitle}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 hover:bg-white/10 transition-colors"
              aria-label="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function ErrorAlert({ message }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-700">
      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
}

export default function Pengguna() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('semua');
  const [notice, setNotice] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);

  const [roleTarget, setRoleTarget] = useState(null);
  const [selectedRole, setSelectedRole] = useState('petani');
  const [roleForm, setRoleForm] = useState({ nik: '', phone: '', address: '', nip: '', position: '', unit: '' });
  const [roleError, setRoleError] = useState('');
  const [roleSaving, setRoleSaving] = useState(false);

  const [statusTarget, setStatusTarget] = useState(null);
  const [statusError, setStatusError] = useState('');
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState('semua');

  const loadUsers = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const response = await api.get('/users');
      setUsers(response.data.data);
    } catch (err) {
      setLoadError(err.response?.data?.error || 'Gagal memuat data pengguna.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadUsers();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(''), 5000);
    return () => clearTimeout(timer);
  }, [notice]);

  const counts = useMemo(
    () => ({
      semua: users.length,
      petani: users.filter((item) => item.role === 'petani').length,
      petugas: users.filter((item) => item.role === 'petugas').length,
      admin: users.filter((item) => item.role === 'admin').length,
      aktif: users.filter((item) => item.is_active).length,
      nonaktif: users.filter((item) => !item.is_active).length,
    }),
    [users]
  );

  const statusOptions = useMemo(
    () => [
      { value: 'semua', label: 'Semua status' },
      { value: 'aktif', label: `Aktif (${counts.aktif})` },
      { value: 'nonaktif', label: `Nonaktif (${counts.nonaktif})` },
    ],
    [counts.aktif, counts.nonaktif]
  );

  const filtered = useMemo(
    () =>
      users.filter((item) => {
        const matchRole = filter === 'semua' || item.role === filter;
        const matchStatus =
          statusFilter === 'semua' ||
          (statusFilter === 'aktif' ? item.is_active : !item.is_active);
        const keyword = query.trim().toLowerCase();
        const matchQuery =
          !keyword ||
          item.nama.toLowerCase().includes(keyword) ||
          item.email.toLowerCase().includes(keyword) ||
          String(item.nik || '').includes(keyword) ||
          String(item.nip || '').includes(keyword);
        return matchRole && matchStatus && matchQuery;
      }),
    [users, filter, statusFilter, query]
  );

  const openCreate = () => {
    setCreateForm(emptyCreateForm);
    setCreateError('');
    setCreateOpen(true);
  };

  const submitCreate = async (event) => {
    event.preventDefault();
    setCreating(true);
    setCreateError('');
    try {
      const payload = {
        nama: createForm.nama.trim(),
        email: createForm.email.trim(),
        password: createForm.password,
        role: createForm.role,
      };
      if (createForm.role === 'petani') {
        payload.nik = createForm.nik.trim();
        payload.phone = createForm.phone.trim();
        payload.address = createForm.address.trim();
      } else if (createForm.role === 'petugas') {
        payload.nip = createForm.nip.trim();
        payload.position = createForm.position.trim();
        payload.unit = createForm.unit.trim();
      }

      const response = await api.post('/users', payload);
      setCreateOpen(false);
      setNotice(`Pengguna ${response.data.data.nama} berhasil dibuat sebagai ${roleMeta[response.data.data.role].label}.`);
      await loadUsers();
    } catch (err) {
      setCreateError(err.response?.data?.error || 'Gagal membuat pengguna.');
    } finally {
      setCreating(false);
    }
  };

  const openRoleModal = (target) => {
    setRoleTarget(target);
    setSelectedRole(target.role);
    setRoleForm({
      nik: '',
      phone: target.phone || '',
      address: target.address || '',
      nip: '',
      position: target.position || '',
      unit: target.unit || '',
    });
    setRoleError('');
  };

  const submitRole = async (event) => {
    event.preventDefault();
    setRoleSaving(true);
    setRoleError('');
    try {
      const payload = { role: selectedRole };
      if (selectedRole === 'petani' && !roleTarget.nik) {
        payload.nik = roleForm.nik.trim();
        payload.phone = roleForm.phone.trim();
        payload.address = roleForm.address.trim();
      }
      if (selectedRole === 'petugas' && !roleTarget.nip) {
        payload.nip = roleForm.nip.trim();
        payload.position = roleForm.position.trim();
        payload.unit = roleForm.unit.trim();
      }

      await api.patch(`/users/${roleTarget.id}/role`, payload);
      setNotice(`Hak akses ${roleTarget.nama} diubah menjadi ${roleMeta[selectedRole].label}.`);
      setRoleTarget(null);
      await loadUsers();
    } catch (err) {
      setRoleError(err.response?.data?.error || 'Gagal mengubah hak akses.');
    } finally {
      setRoleSaving(false);
    }
  };

  const openStatusModal = (target) => {
    setStatusTarget(target);
    setStatusError('');
  };

  const submitStatus = async () => {
    if (!statusTarget || statusSaving) return;
    const target = statusTarget;
    const nextActive = !target.is_active;
    setStatusSaving(true);
    setStatusError('');

    try {
      await api.patch(`/users/${target.id}/status`, { is_active: nextActive });
      setStatusTarget(null);
      setNotice(
        `${target.nama} berhasil ${nextActive ? 'diaktifkan' : 'dinonaktifkan'}.`
      );
      await loadUsers();
    } catch (err) {
      setStatusError(err.response?.data?.error || 'Gagal mengubah status akun.');
    } finally {
      setStatusSaving(false);
    }
  };

  const roleUnchanged = roleTarget && selectedRole === roleTarget.role;
  const requiresNik = selectedRole === 'petani' && roleTarget && !roleTarget.nik;
  const requiresNip = selectedRole === 'petugas' && roleTarget && !roleTarget.nip;

  const stats = [
    { key: 'semua', label: 'Total Pengguna', value: counts.semua, icon: Users, tone: 'bg-gray-100 text-gray-600' },
    { key: 'petani', label: 'Petani', value: counts.petani, icon: Sprout, tone: 'bg-green-100 text-green-600' },
    { key: 'petugas', label: 'Petugas', value: counts.petugas, icon: ShieldCheck, tone: 'bg-blue-100 text-blue-600' },
    { key: 'admin', label: 'Admin', value: counts.admin, icon: UserCog, tone: 'bg-purple-100 text-purple-600' },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Khusus Admin"
        title="Manajemen Pengguna"
        subtitle="Kelola akun, tentukan role, dan nonaktifkan akses tanpa menghapus data pengguna."
        action={
          <button onClick={openCreate} className="btn-primary whitespace-nowrap">
            <Plus className="w-4 h-4" /> Tambah Pengguna
          </button>
        }
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((stat) => (
            <div key={stat.key} className="card p-4 flex items-center gap-3">
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
          {counts.nonaktif > 0
            ? `${counts.nonaktif} akun nonaktif. Akun nonaktif tidak dapat login, tetapi data dan riwayatnya tetap tersimpan.`
            : 'Semua akun aktif dan dapat mengakses sistem sesuai role masing-masing.'}
        </p>
      </PageHeader>

      {notice && (
        <div
          role="status"
          className="mt-4 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 animate-fade-in"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="flex-1">{notice}</span>
          <button onClick={() => setNotice('')} className="text-green-700/70 hover:text-green-900" aria-label="Tutup notifikasi">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="mt-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {['semua', 'petani', 'petugas', 'admin'].map((key) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`chip ${filter === key ? 'chip-active' : ''}`}
            >
              {key === 'semua' ? 'Semua' : roleMeta[key].label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  filter === key ? 'bg-white/20' : 'bg-gray-100'
                }`}
              >
                {counts[key]}
              </span>
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <Select
            id="user-status-filter"
            aria-label="Filter status akun"
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            options={statusOptions}
            size="sm"
            className="w-full sm:w-44"
          />
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari nama, email, NIK, atau NIP..."
              className="input-field pl-10"
            />
          </div>
        </div>
      </div>

      <div className="mt-4 card overflow-hidden animate-fade-up">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin" /> Memuat pengguna...
          </div>
        ) : loadError ? (
          <div className="m-5 flex flex-col items-center gap-3 rounded-xl border border-rose-100 bg-rose-50 px-4 py-8 text-center">
            <AlertCircle className="w-6 h-6 text-rose-500" />
            <p className="text-sm font-semibold text-rose-700">{loadError}</p>
            <button onClick={loadUsers} className="btn-secondary text-xs">
              <RefreshCw className="w-3.5 h-3.5" /> Coba lagi
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr>
                    <th className="table-header">Pengguna</th>
                    <th className="table-header">Hak Akses</th>
                    <th className="table-header">Data Profil</th>
                    <th className="table-header">Terdaftar</th>
                    <th className="table-header text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => {
                    const meta = roleMeta[item.role] || roleMeta.petani;
                    const isSelf = currentUser?.id === item.id;
                    return (
                      <tr key={item.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="table-cell">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-full bg-gradient-to-br ${meta.avatar} flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0`}
                            >
                              {initials(item.nama)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 truncate">
                                {item.nama}
                                {isSelf && (
                                  <span className="ml-2 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-700">
                                    Anda
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-gray-500 truncate">{item.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="table-cell">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className={`badge ${meta.badge}`}>
                              <meta.icon className="w-3 h-3" /> {meta.label}
                            </span>
                            {!item.is_active && (
                              <span className="badge badge-danger">Nonaktif</span>
                            )}
                          </div>
                        </td>
                        <td className="table-cell">
                          {item.nik && (
                            <p className="text-xs text-gray-700">
                              <span className="text-gray-500">NIK </span>
                              <span className="font-mono">{item.nik}</span>
                            </p>
                          )}
                          {item.nip && (
                            <p className="text-xs text-gray-700">
                              <span className="text-gray-500">NIP </span>
                              <span className="font-mono">{item.nip}</span>
                            </p>
                          )}
                          {item.position && <p className="text-[11px] text-gray-500">{item.position}</p>}
                          {!item.nik && !item.nip && <span className="text-xs text-gray-500">—</span>}
                        </td>
                        <td className="table-cell text-xs text-gray-500">{formatDate(item.created_at)}</td>
                        <td className="table-cell text-right">
                          {isSelf ? (
                            <span className="text-[11px] font-semibold text-gray-500">Akun Anda</span>
                          ) : (
                            <div className="flex flex-wrap items-center justify-end gap-2">
                              <button
                                onClick={() => openRoleModal(item)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-[11px] font-semibold text-green-700 hover:bg-green-100 transition-colors"
                              >
                                <UserCog className="w-3.5 h-3.5" /> Atur Akses
                              </button>
                              <button
                                onClick={() => openStatusModal(item)}
                                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                                  item.is_active
                                    ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                                    : 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                                }`}
                              >
                                {item.is_active ? (
                                  <>
                                    <UserX className="w-3.5 h-3.5" /> Nonaktifkan
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="w-3.5 h-3.5" /> Aktifkan
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                <div className="icon-tile w-12 h-12 bg-gray-100 text-gray-400">
                  <Search className="w-5 h-5" />
                </div>
                <p className="text-sm font-semibold text-gray-700">Pengguna tidak ditemukan</p>
                <p className="text-xs text-gray-500">Coba ubah filter atau kata pencarian.</p>
              </div>
            )}
          </>
        )}
      </div>

      {createOpen && (
        <ModalShell
          title="Tambah Pengguna"
          subtitle="Buat akun baru dan tentukan hak aksesnya"
          icon={Plus}
          onClose={() => setCreateOpen(false)}
        >
          <form onSubmit={submitCreate} className="space-y-4">
            <ErrorAlert message={createError} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nama Lengkap</label>
                <input
                  required
                  className="input-field"
                  placeholder="Nama pengguna"
                  value={createForm.nama}
                  onChange={(event) => setCreateForm({ ...createForm, nama: event.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
                <input
                  required
                  type="email"
                  className="input-field"
                  placeholder="email@contoh.com"
                  value={createForm.email}
                  onChange={(event) => setCreateForm({ ...createForm, email: event.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password Awal</label>
              <input
                required
                type="password"
                minLength={6}
                className="input-field"
                placeholder="Minimal 6 karakter"
                value={createForm.password}
                onChange={(event) => setCreateForm({ ...createForm, password: event.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Hak Akses</label>
              <RolePicker
                value={createForm.role}
                onChange={(role) => setCreateForm({ ...createForm, role })}
              />
            </div>

            {createForm.role === 'petani' && (
              <div className="space-y-3 rounded-xl border border-gray-100 bg-gray-50/70 p-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">NIK</label>
                  <input
                    required
                    className="input-field"
                    placeholder="Nomor induk kependudukan"
                    value={createForm.nik}
                    onChange={(event) => setCreateForm({ ...createForm, nik: event.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Telepon</label>
                    <input
                      className="input-field"
                      placeholder="08xxxxxxxxxx"
                      value={createForm.phone}
                      onChange={(event) => setCreateForm({ ...createForm, phone: event.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Alamat</label>
                    <input
                      className="input-field"
                      placeholder="Desa/Kecamatan"
                      value={createForm.address}
                      onChange={(event) => setCreateForm({ ...createForm, address: event.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}

            {createForm.role === 'petugas' && (
              <div className="space-y-3 rounded-xl border border-gray-100 bg-gray-50/70 p-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">NIP</label>
                  <input
                    required
                    className="input-field"
                    placeholder="Nomor induk pegawai"
                    value={createForm.nip}
                    onChange={(event) => setCreateForm({ ...createForm, nip: event.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Jabatan</label>
                    <input
                      className="input-field"
                      placeholder="Verifikator"
                      value={createForm.position}
                      onChange={(event) => setCreateForm({ ...createForm, position: event.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Unit</label>
                    <input
                      className="input-field"
                      placeholder="Kecamatan"
                      value={createForm.unit}
                      onChange={(event) => setCreateForm({ ...createForm, unit: event.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}

            {createForm.role === 'admin' && (
              <div className="rounded-xl border border-purple-100 bg-purple-50 p-3 text-xs text-purple-800">
                Akun admin tidak memerlukan data profil tambahan dan langsung memiliki akses penuh.
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setCreateOpen(false)} className="btn-secondary flex-1">
                Batal
              </button>
              <button type="submit" className="btn-primary flex-1" disabled={creating}>
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {creating ? 'Menyimpan...' : 'Buat Pengguna'}
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {roleTarget && (
        <ModalShell
          title="Atur Hak Akses"
          subtitle="Tentukan role pengguna dalam sistem"
          icon={UserCog}
          onClose={() => setRoleTarget(null)}
        >
          <form onSubmit={submitRole} className="space-y-4">
            <ErrorAlert message={roleError} />

            <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/70 p-3">
              <div
                className={`w-10 h-10 rounded-full bg-gradient-to-br ${roleMeta[roleTarget.role].avatar} flex items-center justify-center text-white text-xs font-bold`}
              >
                {initials(roleTarget.nama)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{roleTarget.nama}</p>
                <p className="text-xs text-gray-500 truncate">{roleTarget.email}</p>
              </div>
              <span className={`badge ml-auto ${roleMeta[roleTarget.role].badge}`}>
                {roleMeta[roleTarget.role].label}
              </span>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Role Baru</label>
              <RolePicker value={selectedRole} onChange={setSelectedRole} />
            </div>

            {requiresNik && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">NIK (wajib)</label>
                <input
                  required
                  className="input-field"
                  placeholder="Nomor induk kependudukan"
                  value={roleForm.nik}
                  onChange={(event) => setRoleForm({ ...roleForm, nik: event.target.value })}
                />
                <p className="mt-1 text-[11px] text-gray-500">
                  Dibutuhkan karena pengguna belum memiliki profil petani.
                </p>
              </div>
            )}

            {requiresNip && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">NIP (wajib)</label>
                <input
                  required
                  className="input-field"
                  placeholder="Nomor induk pegawai"
                  value={roleForm.nip}
                  onChange={(event) => setRoleForm({ ...roleForm, nip: event.target.value })}
                />
                <p className="mt-1 text-[11px] text-gray-500">
                  Dibutuhkan karena pengguna belum memiliki profil petugas.
                </p>
              </div>
            )}

            {!requiresNik && !requiresNip && (
              <div className="flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-800">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Perubahan hak akses berlaku langsung. Pengguna harus login ulang untuk melihat menu barunya.</span>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setRoleTarget(null)} className="btn-secondary flex-1">
                Batal
              </button>
              <button
                type="submit"
                className="btn-primary flex-1"
                disabled={roleSaving || roleUnchanged}
              >
                {roleSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {roleSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {statusTarget && (
        <ModalShell
          title={statusTarget.is_active ? 'Nonaktifkan Pengguna' : 'Aktifkan Pengguna'}
          subtitle={
            statusTarget.is_active
              ? 'Cabut akses akun tanpa menghapus data'
              : 'Pulihkan akses akun ke sistem'
          }
          icon={statusTarget.is_active ? UserX : UserCheck}
          onClose={() => !statusSaving && setStatusTarget(null)}
        >
          <div className="space-y-4">
            <ErrorAlert message={statusError} />

            <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/70 p-3">
              <div
                className={`w-10 h-10 rounded-full bg-gradient-to-br ${roleMeta[statusTarget.role].avatar} flex items-center justify-center text-white text-xs font-bold`}
              >
                {initials(statusTarget.nama)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{statusTarget.nama}</p>
                <p className="text-xs text-gray-500 truncate">{statusTarget.email}</p>
              </div>
              <span className={`badge ml-auto ${statusTarget.is_active ? 'badge-success' : 'badge-danger'}`}>
                {statusTarget.is_active ? 'Aktif' : 'Nonaktif'}
              </span>
            </div>

            <div
              className={`flex items-start gap-2 rounded-xl border px-3.5 py-3 text-xs ${
                statusTarget.is_active
                  ? 'border-rose-100 bg-rose-50 text-rose-800'
                  : 'border-green-100 bg-green-50 text-green-800'
              }`}
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                {statusTarget.is_active
                  ? 'Pengguna tidak dapat login dan sesi aktifnya langsung ditolak. Data lahan, foto, klaim, dan riwayat distribusi tetap tersimpan.'
                  : 'Pengguna dapat login kembali dengan password yang sama dan memperoleh akses sesuai role yang tersimpan.'}
              </span>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStatusTarget(null)}
                disabled={statusSaving}
                className="btn-secondary flex-1"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={submitStatus}
                disabled={statusSaving}
                className={`${statusTarget.is_active ? 'btn-danger' : 'btn-primary'} flex-1`}
              >
                {statusSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : statusTarget.is_active ? (
                  <UserX className="w-4 h-4" />
                ) : (
                  <UserCheck className="w-4 h-4" />
                )}
                {statusSaving
                  ? 'Menyimpan...'
                  : statusTarget.is_active
                    ? 'Nonaktifkan'
                    : 'Aktifkan'}
              </button>
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
}
