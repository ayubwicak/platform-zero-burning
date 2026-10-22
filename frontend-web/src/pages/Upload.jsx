import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Upload as UploadIcon,
  MapPin,
  Clock,
  Camera,
  CheckCircle2,
  Info,
  ShieldCheck,
  Leaf,
  Hash,
  Loader2,
  LocateFixed,
  AlertCircle,
  RefreshCw,
  ImageOff,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import api from '../lib/api';
import { formatArea, formatCoord, formatDateTime } from '../lib/format';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const guides = [
  'Ambil foto langsung dari kamera, bukan dari galeri.',
  'Pastikan lahan terlihat jelas tanpa pembakaran.',
  'Foto diambil dalam radius 50 meter dari titik lahan.',
  'Gunakan pencahayaan cukup agar hasil tidak buram.',
];

const statusStyles = {
  menunggu_verifikasi: { label: 'Menunggu', className: 'badge-warning' },
  terverifikasi: { label: 'Terverifikasi', className: 'badge-success' },
  ditolak: { label: 'Ditolak', className: 'badge-danger' },
};

export default function Upload() {
  const [fields, setFields] = useState([]);
  const [fieldsLoading, setFieldsLoading] = useState(true);
  const [fieldId, setFieldId] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [fileName, setFileName] = useState('');
  const [location, setLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [photosLoading, setPhotosLoading] = useState(true);
  const [historyError, setHistoryError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    let active = true;

    api
      .get('/fields')
      .then((response) => {
        if (!active) return;
        const data = response.data.data || [];
        setFields(data);
        if (data.length > 0) {
          setFieldId(String(data[0].id));
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.response?.data?.error || 'Gagal memuat daftar lahan.');
        }
      })
      .finally(() => {
        if (active) {
          setFieldsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const loadPhotos = useCallback(async () => {
    setPhotosLoading(true);
    setHistoryError('');
    try {
      const response = await api.get('/photos');
      setPhotos(response.data.data || []);
    } catch (err) {
      setHistoryError(err.response?.data?.error || 'Gagal memuat riwayat unggahan.');
    } finally {
      setPhotosLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function handleFile(event) {
    const selected = event.target.files?.[0];
    if (!selected) return;

    setSuccess(null);
    setError('');

    if (!selected.type.startsWith('image/')) {
      setError('File harus berupa gambar (JPG atau PNG).');
      event.target.value = '';
      return;
    }
    if (selected.size > MAX_FILE_SIZE) {
      setError('Ukuran foto maksimal 5 MB.');
      event.target.value = '';
      return;
    }

    setFile(selected);
    setFileName(selected.name);
    setPreview(URL.createObjectURL(selected));
  }

  function handleUseLocation() {
    if (!navigator.geolocation) {
      setError('Browser tidak mendukung geolokasi.');
      return;
    }

    setLocating(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocating(false);
      },
      (err) => {
        setError(
          err.code === 1
            ? 'Izin lokasi ditolak. Aktifkan izin lokasi di browser.'
            : 'Gagal mengambil lokasi. Coba lagi.'
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  async function handleUpload(event) {
    event.preventDefault();
    setError('');
    setSuccess(null);

    if (!file) {
      setError('Pilih foto terlebih dahulu.');
      return;
    }
    if (!fieldId) {
      setError('Pilih lahan yang akan difoto.');
      return;
    }
    if (!location) {
      setError('Ambil lokasi GPS terlebih dahulu.');
      return;
    }

    const formData = new FormData();
    formData.append('foto', file);
    formData.append('field_id', fieldId);
    formData.append('latitude', String(location.latitude));
    formData.append('longitude', String(location.longitude));
    formData.append('taken_at', new Date().toISOString());
    formData.append('timestamp', String(Date.now()));

    setUploading(true);
    try {
      const response = await api.post('/photos', formData);
      setSuccess(response.data.data);
      setFile(null);
      setPreview(null);
      setFileName('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      await loadPhotos();
    } catch (err) {
      const data = err.response?.data;
      setError(
        data?.distance !== undefined
          ? `${data.error} (jarak ${data.distance} m dari titik lahan)`
          : data?.error || 'Gagal mengunggah foto.'
      );
    } finally {
      setUploading(false);
    }
  }

  const canSubmit = Boolean(file && fieldId && location) && !uploading && fields.length > 0;

  return (
    <div>
      <PageHeader
        eyebrow="Bukti Lapangan"
        title="Unggah Foto Progres"
        subtitle="Kirim bukti visual kondisi lahan untuk proses verifikasi zero burning."
      />

      <div className="mt-7 grid grid-cols-1 xl:grid-cols-5 gap-5">
        <div className="xl:col-span-3">
          <form onSubmit={handleUpload} className="card p-5 lg:p-6 space-y-6 animate-fade-up">
            <div className="flex items-center gap-3">
              <div className="icon-tile w-11 h-11 bg-green-100 text-green-600">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Foto Progres Lahan</h3>
                <p className="text-xs text-gray-500">Format JPG/PNG, maksimal 5 MB</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Pilih Lahan</label>
              <select
                className="input-field"
                value={fieldId}
                onChange={(event) => setFieldId(event.target.value)}
                disabled={fieldsLoading || fields.length === 0}
              >
                {fieldsLoading ? (
                  <option value="">Memuat lahan...</option>
                ) : fields.length === 0 ? (
                  <option value="">Belum ada lahan terdaftar</option>
                ) : (
                  fields.map((field) => (
                    <option key={field.id} value={field.id}>
                      {field.name} — {formatArea(field.area)}
                    </option>
                  ))
                )}
              </select>
              {!fieldsLoading && fields.length === 0 && (
                <p className="mt-2 text-xs text-amber-700">
                  Belum ada lahan terdaftar.{' '}
                  <Link to="/fields" className="font-semibold underline">
                    Daftarkan lahan dulu
                  </Link>
                  .
                </p>
              )}
            </div>

            <label className="relative block cursor-pointer rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/60 p-6 hover:border-green-400 hover:bg-green-50/40 transition-all duration-200">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFile}
                className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
              />
              {preview ? (
                <div className="space-y-3">
                  <img src={preview} alt="Pratinjau" className="w-full h-64 object-cover rounded-xl shadow-sm" />
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-gray-500 truncate">{fileName}</p>
                    <span className="badge badge-success shrink-0">
                      <CheckCircle2 className="w-3 h-3" /> Siap dikirim
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <div className="icon-tile w-14 h-14 bg-green-100 text-green-600">
                    <UploadIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Klik untuk memilih foto</p>
                    <p className="text-xs text-gray-500 mt-0.5">atau seret file ke area ini</p>
                  </div>
                </div>
              )}
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3.5">
                <div className="flex items-center gap-2 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <MapPin className="w-3.5 h-3.5 text-green-600" /> Lokasi GPS
                </div>
                <p className="mt-1.5 text-sm font-mono font-medium text-gray-800">
                  {location ? `${formatCoord(location.latitude)}, ${formatCoord(location.longitude)}` : 'Belum diambil'}
                </p>
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
                  {locating ? 'Mengambil lokasi...' : 'Ambil lokasi saat ini'}
                </button>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3.5">
                <div className="flex items-center gap-2 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5 text-green-600" /> Waktu
                </div>
                <p className="mt-1.5 text-sm font-medium text-gray-800">Otomatis saat unggah</p>
                <p className="mt-2 text-[11px] text-gray-500">Validasi radius maksimal 50 meter.</p>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Foto berhasil dikirim ke antrian verifikasi.</p>
                  <p className="mt-1 text-xs text-green-700">
                    Jarak dari titik lahan: {success.distance ?? 0} m · Hash:{' '}
                    <span className="font-mono">{String(success.photo_hash).slice(0, 12)}…</span>
                  </p>
                </div>
              </div>
            )}

            <button type="submit" disabled={!canSubmit} className="btn-primary w-full">
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Mengunggah...
                </>
              ) : (
                <>
                  <UploadIcon className="w-4 h-4" /> Kirim Foto Progres
                </>
              )}
            </button>
          </form>
        </div>

        <div className="xl:col-span-2 space-y-5">
          <div className="card p-5 lg:p-6 animate-fade-up delay-100">
            <h3 className="text-base font-bold text-gray-900">Panduan Unggah</h3>
            <p className="text-xs text-gray-500 mt-0.5 mb-4">Ikuti agar foto lolos verifikasi</p>
            <ul className="space-y-3">
              {guides.map((guide, index) => (
                <li key={guide} className="flex items-start gap-3">
                  <span className="mt-0.5 icon-tile w-6 h-6 bg-green-100 text-green-700 text-[11px] font-bold shrink-0">
                    {index + 1}
                  </span>
                  <p className="text-sm text-gray-600 leading-snug">{guide}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-600 to-emerald-700 p-5 text-white animate-fade-up delay-200">
            <div className="absolute -top-8 -right-6 w-28 h-28 rounded-full bg-white/10" />
            <div className="relative">
              <div className="icon-tile w-10 h-10 bg-white/15 backdrop-blur-sm">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="mt-3 font-bold">Kenapa verifikasi penting?</h3>
              <p className="mt-1.5 text-xs text-green-50/90 leading-relaxed">
                Setiap foto yang lolos verifikasi menjadi bukti sah bahwa lahan dikelola tanpa
                membakar, sehingga Anda berhak atas insentif.
              </p>
              <div className="mt-4 flex items-center gap-2 text-[11px] font-semibold text-green-100">
                <Leaf className="w-3.5 h-3.5" /> 100% bebas pembakaran lahan
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-xl border border-blue-100 bg-blue-50 p-4 text-xs text-blue-800">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              Server menolak foto di luar radius 50 meter dan foto yang identik dengan unggahan
              sebelumnya. Pastikan izin lokasi browser aktif.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 card p-5 lg:p-6 animate-fade-up">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">Riwayat Unggahan</h3>
            <p className="text-xs text-gray-500 mt-0.5">30 foto terbaru dari lahan Anda</p>
          </div>
          <button onClick={loadPhotos} className="btn-secondary">
            <RefreshCw className="w-4 h-4" /> Segarkan
          </button>
        </div>

        {photosLoading ? (
          <div className="mt-5 flex items-center justify-center gap-2 py-8 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin text-green-600" /> Memuat riwayat...
          </div>
        ) : historyError ? (
          <div className="mt-5 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0" /> {historyError}
          </div>
        ) : photos.length === 0 ? (
          <div className="mt-5 flex flex-col items-center gap-2 py-8 text-center text-gray-500">
            <ImageOff className="w-8 h-8 text-gray-300" />
            <p className="text-sm">Belum ada foto yang diunggah.</p>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {photos.map((photo) => {
              const status = statusStyles[photo.status] || {
                label: photo.status,
                className: 'badge-info',
              };

              return (
                <div key={photo.id} className="overflow-hidden rounded-xl border border-gray-100 bg-white">
                  <img
                    src={photo.photo_url}
                    alt={`Foto ${photo.field_name}`}
                    className="h-36 w-full object-cover bg-gray-100"
                  />
                  <div className="p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-gray-800">{photo.field_name}</p>
                      <span className={`badge ${status.className} shrink-0`}>{status.label}</span>
                    </div>
                    <p className="mt-1 text-[11px] text-gray-500">{formatDateTime(photo.created_at)}</p>
                    <p className="mt-1 truncate font-mono text-[11px] text-gray-400">
                      <Hash className="mr-1 inline w-3 h-3" />
                      {String(photo.photo_hash).slice(0, 12)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
