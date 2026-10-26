import { useCallback, useEffect, useState } from 'react';
import {
  Plus,
  MapPin,
  RefreshCw,
  Sprout,
  Ruler,
  Leaf,
  Camera,
  Loader2,
  LocateFixed,
  AlertCircle,
  CheckCircle2,
  Pencil,
  Save,
  Trash2,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import api from '../lib/api';
import { formatArea, formatCoord, timeAgo } from '../lib/format';

const accents = [
  { bar: 'from-green-500 to-emerald-600', tile: 'bg-green-100', icon: 'text-green-600' },
  { bar: 'from-amber-400 to-orange-500', tile: 'bg-amber-100', icon: 'text-amber-600' },
  { bar: 'from-blue-500 to-sky-600', tile: 'bg-blue-100', icon: 'text-blue-600' },
];

const emptyForm = { name: '', area: '', crop_type: '', latitude: '', longitude: '' };

function fieldStatus(field) {
  const photoCount = Number(field.photo_count) || 0;
  const verifiedCount = Number(field.verified_photo_count) || 0;

  if (verifiedCount > 0) {
    return {
      label: 'Terverifikasi',
      badge: 'badge-success',
      progress: photoCount > 0 ? Math.round((verifiedCount / photoCount) * 100) : 100,
    };
  }
  if (photoCount > 0) {
    return { label: 'Menunggu', badge: 'badge-warning', progress: 0 };
  }
  return { label: 'Belum ada foto', badge: 'badge-info', progress: 0 };
}

export default function Fields() {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [locating, setLocating] = useState(false);
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState(emptyForm);

  const loadFields = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/fields');
      setFields(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal memuat daftar lahan.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFields();
  }, [loadFields]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(''), 5000);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!open && !deleteTarget) return undefined;

    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      if (deleteTarget) {
        closeDelete();
      } else {
        closeModal();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, deleteTarget, saving, deleting]);

  const totalArea = fields.reduce((sum, field) => sum + (Number(field.area) || 0), 0);
  const totalPhotos = fields.reduce((sum, field) => sum + (Number(field.photo_count) || 0), 0);

  function openModal() {
    setEditingField(null);
    setForm(emptyForm);
    setFormError('');
    setOpen(true);
  }

  function openEdit(field) {
    setEditingField(field);
    setForm({
      name: field.name || '',
      area: field.area !== null && field.area !== undefined ? String(field.area) : '',
      crop_type: field.crop_type || '',
      latitude: field.latitude !== null && field.latitude !== undefined ? String(field.latitude) : '',
      longitude: field.longitude !== null && field.longitude !== undefined ? String(field.longitude) : '',
    });
    setFormError('');
    setOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setOpen(false);
  }

  function openDelete(field) {
    setDeleteTarget(field);
    setDeleteError('');
  }

  function closeDelete() {
    if (deleting) return;
    setDeleteTarget(null);
    setDeleteError('');
  }

  function handleUseLocation() {
    if (!navigator.geolocation) {
      setFormError('Browser tidak mendukung geolokasi.');
      return;
    }

    setLocating(true);
    setFormError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((current) => ({
          ...current,
          latitude: position.coords.latitude.toFixed(8),
          longitude: position.coords.longitude.toFixed(8),
        }));
        setLocating(false);
      },
      (err) => {
        setFormError(
          err.code === 1
            ? 'Izin lokasi ditolak. Aktifkan izin lokasi di browser.'
            : 'Gagal mengambil lokasi. Coba lagi atau isi koordinat manual.'
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  async function handleSave(event) {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setFormError('');

    const payload = {
      name: form.name.trim(),
      area: Number(form.area),
      crop_type: form.crop_type.trim(),
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
    };
    const wasEditing = Boolean(editingField);

    try {
      if (wasEditing) {
        await api.patch(`/fields/${editingField.id}`, payload);
      } else {
        await api.post('/fields', payload);
      }
      setOpen(false);
      setEditingField(null);
      setForm(emptyForm);
      setNotice(wasEditing ? 'Data lahan berhasil diperbarui.' : 'Lahan berhasil ditambahkan.');
      await loadFields();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Gagal menyimpan lahan.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget || deleting) return;

    setDeleting(true);
    setDeleteError('');

    try {
      await api.delete(`/fields/${deleteTarget.id}`);
      setDeleteTarget(null);
      setNotice('Lahan berhasil dihapus.');
      await loadFields();
    } catch (err) {
      setDeleteError(err.response?.data?.error || 'Gagal menghapus lahan.');
    } finally {
      setDeleting(false);
    }
  }

  const stats = [
    { label: 'Total Lahan', value: fields.length, icon: Leaf, color: 'text-green-600', bg: 'bg-green-100' },
    {
      label: 'Luas Total',
      value: `${totalArea.toLocaleString('id-ID', { maximumFractionDigits: 2 })} ha`,
      icon: Ruler,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    { label: 'Foto Terunggah', value: totalPhotos, icon: Camera, color: 'text-amber-600', bg: 'bg-amber-100' },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Manajemen Lahan"
        title="Lahan Saya"
        subtitle="Kelola dan pantau lahan pertanian zero burning Anda dalam satu tampilan."
        action={
          <>
            <button
              onClick={loadFields}
              className="btn-secondary"
              aria-label="Segarkan daftar lahan"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Segarkan</span>
            </button>
            <button onClick={openModal} className="btn-primary">
              <Plus className="w-4 h-4" /> Tambah Lahan
            </button>
          </>
        }
      >
        <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-xl">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="card flex flex-col items-start gap-2 p-2.5 sm:flex-row sm:items-center sm:gap-3 sm:p-3.5"
            >
              <div className={`icon-tile h-8 w-8 shrink-0 sm:h-9 sm:w-9 ${stat.bg} ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 w-full">
                <p className="truncate text-base font-extrabold leading-none text-gray-900 sm:text-lg">
                  {stat.value}
                </p>
                <p className="mt-1 text-[10px] leading-tight text-gray-500 sm:text-[11px]">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </PageHeader>

      {notice && (
        <div
          role="status"
          className="mt-6 flex items-center gap-2 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {error && (
        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={loadFields} className="btn-secondary">
            Coba lagi
          </button>
        </div>
      )}

      {loading ? (
        <div className="mt-7 card flex flex-col items-center justify-center p-12 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin text-green-600" />
          <p className="mt-3 text-sm">Memuat lahan...</p>
        </div>
      ) : (
        <div className="mt-7 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4 4xl:grid-cols-5 gap-5">
          {fields.map((field, index) => {
            const accent = accents[index % accents.length];
            const status = fieldStatus(field);
            const photoCount = Number(field.photo_count) || 0;
            const verifiedCount = Number(field.verified_photo_count) || 0;

            return (
              <div
                key={field.id}
                className={`card overflow-hidden card-hover animate-fade-up delay-${((index % 4) + 1) * 100}`}
              >
                <div className={`h-1.5 bg-gradient-to-r ${accent.bar}`} />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className={`icon-tile w-11 h-11 ${accent.tile}`}>
                      <Sprout className={`w-5 h-5 ${accent.icon}`} />
                    </div>
                    <span className={`badge ${status.badge}`}>{status.label}</span>
                  </div>

                  <h3 className="mt-4 text-lg font-bold text-gray-900">{field.name}</h3>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1 rounded-md bg-gray-50 px-2 py-1 font-medium">
                      <Sprout className="w-3 h-3" /> {field.crop_type || 'Tanaman belum diisi'}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-gray-50 px-2 py-1 font-medium">
                      <Ruler className="w-3 h-3" /> {formatArea(field.area)}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-600">
                    <MapPin className="w-3.5 h-3.5 text-green-600 shrink-0" />
                    <span className="truncate font-mono">
                      {formatCoord(field.latitude)}, {formatCoord(field.longitude)}
                    </span>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between text-[11px] font-semibold mb-1.5">
                      <span className="text-gray-500">Progres verifikasi</span>
                      <span className={status.progress === 100 ? 'text-green-700' : 'text-amber-800'}>
                        {verifiedCount}/{photoCount} foto
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${accent.bar}`}
                        style={{ width: `${status.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate text-[11px] text-gray-500">
                      {field.last_photo_at
                        ? `Foto ${timeAgo(field.last_photo_at)}`
                        : `Didaftarkan ${timeAgo(field.created_at)}`}
                    </span>
                    <div className="flex shrink-0 items-center gap-0.5">
                      <button
                        onClick={() => openEdit(field)}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-green-700 transition-colors hover:bg-green-50"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Ubah
                      </button>
                      <button
                        onClick={() => openDelete(field)}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Hapus
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <button
            onClick={openModal}
            className="group flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 bg-white/50 p-8 min-h-[260px] hover:border-green-400 hover:bg-green-50/50 transition-all duration-200"
          >
            <div className="icon-tile w-12 h-12 bg-green-100 text-green-600 group-hover:scale-110 transition-transform">
              <Plus className="w-6 h-6" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-800">
                {fields.length === 0 ? 'Daftarkan Lahan Pertama' : 'Tambah Lahan Baru'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {fields.length === 0
                  ? 'Mulai dengan menambahkan lahan zero burning'
                  : 'Daftarkan lahan zero burning'}
              </p>
            </div>
          </button>
        </div>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-fade-in"
          onClick={closeModal}
          role="presentation"
        >
          <div
            className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl animate-fade-up"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="field-modal-title"
          >
            <div className="relative overflow-hidden bg-gradient-to-br from-green-600 to-emerald-700 p-6 text-white">
              <div className="absolute -top-10 -right-8 w-32 h-32 rounded-full bg-white/10" />
              <div className="relative flex items-center gap-3">
                <div className="icon-tile w-11 h-11 bg-white/15 backdrop-blur-sm">
                  <Sprout className="w-5 h-5" />
                </div>
                <div>
                  <h2 id="field-modal-title" className="text-lg font-bold">
                    {editingField ? 'Ubah Data Lahan' : 'Daftarkan Lahan Baru'}
                  </h2>
                  <p className="text-xs text-green-100/90">
                    {editingField
                      ? 'Perbarui informasi lahan Anda'
                      : 'Lengkapi data lahan Anda'}
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label htmlFor="field-name" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Nama Lahan
                </label>
                <input
                  id="field-name"
                  className="input-field"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  placeholder="Contoh: Lahan Gambut A"
                  maxLength={100}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="field-area" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Luas (ha)
                  </label>
                  <input
                    id="field-area"
                    className="input-field"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.area}
                    onChange={(event) => setForm({ ...form, area: event.target.value })}
                    placeholder="0.5"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="field-crop" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Tanaman
                  </label>
                  <input
                    id="field-crop"
                    className="input-field"
                    value={form.crop_type}
                    onChange={(event) => setForm({ ...form, crop_type: event.target.value })}
                    placeholder="Padi"
                    maxLength={50}
                    required
                  />
                </div>
              </div>

              <fieldset>
                <legend className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Lokasi Lahan (GPS)
                </legend>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    className="input-field font-mono text-xs"
                    inputMode="decimal"
                    aria-label="Latitude"
                    value={form.latitude}
                    onChange={(event) => setForm({ ...form, latitude: event.target.value })}
                    placeholder="Latitude"
                    required
                  />
                  <input
                    className="input-field font-mono text-xs"
                    inputMode="decimal"
                    aria-label="Longitude"
                    value={form.longitude}
                    onChange={(event) => setForm({ ...form, longitude: event.target.value })}
                    placeholder="Longitude"
                    required
                  />
                </div>
                <button
                  type="button"
                  onClick={handleUseLocation}
                  disabled={locating}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 hover:text-green-800 disabled:opacity-60"
                >
                  {locating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <LocateFixed className="w-3.5 h-3.5" />
                  )}
                  {locating ? 'Mengambil lokasi...' : 'Gunakan lokasi saat ini'}
                </button>
                <p className="mt-1 text-[11px] text-gray-500">
                  Koordinat dipakai untuk validasi radius 50 meter saat unggah foto.
                </p>
              </fieldset>

              {formError && (
                <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="btn-secondary flex-1" disabled={saving}>
                  Batal
                </button>
                <button type="submit" className="btn-primary flex-1" disabled={saving}>
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : editingField ? (
                    <Save className="w-4 h-4" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  {saving ? 'Menyimpan...' : editingField ? 'Simpan Perubahan' : 'Simpan Lahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-fade-in"
          onClick={closeDelete}
          role="presentation"
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-fade-up"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-field-title"
          >
            <div className="flex items-start gap-4">
              <div className="icon-tile w-12 h-12 shrink-0 bg-rose-100 text-rose-600">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h2 id="delete-field-title" className="text-lg font-bold text-gray-900">
                  Hapus lahan?
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-gray-500">
                  Lahan akan dihapus dari daftar dan tidak dapat digunakan untuk unggah foto baru.
                  Riwayat foto dan klaim yang sudah ada tetap tersimpan.
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
              <p className="text-sm font-semibold text-gray-900">{deleteTarget.name}</p>
              <p className="mt-0.5 text-xs text-gray-500">
                {deleteTarget.crop_type || 'Tanaman belum diisi'} · {formatArea(deleteTarget.area)}
              </p>
            </div>

            {deleteError && (
              <div role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={closeDelete}
                className="btn-secondary flex-1"
                disabled={deleting}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="btn-danger flex-1"
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                {deleting ? 'Menghapus...' : 'Hapus Lahan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
