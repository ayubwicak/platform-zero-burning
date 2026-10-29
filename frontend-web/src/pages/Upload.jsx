import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  ImageOff,
  Trash2,
  XCircle,
  ImageIcon,
  ImagePlus,
  Maximize2,
  X,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Select from '../components/ui/Select';
import api from '../lib/api';
import { formatArea, formatCoord, formatDateTime, formatFileSize } from '../lib/format';
import { validateUploadFile } from '../lib/fileValidation';

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
  const [fileSize, setFileSize] = useState(0);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [location, setLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [success, setSuccess] = useState(null);
  const [announcement, setAnnouncement] = useState('');
  const [photos, setPhotos] = useState([]);
  const [photosLoading, setPhotosLoading] = useState(true);
  const [historyError, setHistoryError] = useState('');

  const fileInputRef = useRef(null);
  const dropzoneRef = useRef(null);
  const dragCounterRef = useRef(0);
  const uploadAbortControllerRef = useRef(null);

  // Mencegah browser membuka file di tab baru jika di-drop di luar area upload
  useEffect(() => {
    const preventWindowDrop = (e) => {
      e.preventDefault();
    };
    window.addEventListener('dragover', preventWindowDrop);
    window.addEventListener('drop', preventWindowDrop);

    return () => {
      window.removeEventListener('dragover', preventWindowDrop);
      window.removeEventListener('drop', preventWindowDrop);
    };
  }, []);

  // Bersihkan URL object saat komponen unmount atau saat preview berganti
  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  // Listener keyboard Escape untuk menutup lightbox
  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setLightboxOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen]);

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
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadPhotos();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [loadPhotos]);

  /**
   * Format ekstensi file (JPG, PNG, WebP)
   */
  const fileFormat = useMemo(() => {
    if (!fileName) return 'IMG';
    const parts = fileName.split('.');
    if (parts.length <= 1) return 'IMG';
    const ext = parts.pop()?.toUpperCase();
    if (ext === 'JPEG') return 'JPG';
    return ext || 'IMG';
  }, [fileName]);

  /**
   * Fungsi sentral pemrosesan file (dari click input, drag & drop, atau paste)
   */
  const processFiles = useCallback(
    (fileList) => {
      if (!fileList || fileList.length === 0) return;
      const files = Array.from(fileList);

      setError('');
      setNotice('');
      setSuccess(null);

      // Ambil file pertama dan validasi
      const selected = files[0];
      const validation = validateUploadFile(selected);

      if (!validation.valid) {
        setError(validation.error);
        setAnnouncement(validation.error);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      // Beritahu pengguna jika mengunggah lebih dari 1 file sekaligus
      if (files.length > 1) {
        setNotice('Hanya satu foto yang dapat diunggah per kirim. File pertama dipilih.');
      }

      // Bersihkan preview lama jika ada
      if (preview) {
        URL.revokeObjectURL(preview);
      }

      const objectUrl = URL.createObjectURL(selected);
      setFile(selected);
      setFileName(selected.name);
      setFileSize(selected.size);
      setDimensions({ width: 0, height: 0 });
      setPreview(objectUrl);
      setLightboxOpen(false);
      setUploadProgress(0);
      setAnnouncement(`Gambar ${selected.name} siap dikirim.`);
    },
    [preview]
  );

  function handleFileInputChange(event) {
    processFiles(event.target.files);
  }

  // --- Drag and Drop Handlers ---
  function handleDragEnter(e) {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
    }
  }

  function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDragging(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragging(false);

    if (uploading) return;

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      processFiles(droppedFiles);
    }
  }

  // --- Paste Handler (Ctrl+V) ---
  function handlePaste(e) {
    if (uploading) return;
    const items = e.clipboardData?.items;
    if (!items) return;

    const imageFiles = [];
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const blob = item.getAsFile();
        if (blob) imageFiles.push(blob);
      }
    }

    if (imageFiles.length > 0) {
      e.preventDefault();
      processFiles(imageFiles);
    }
  }

  // --- Hapus File Sebelum Upload ---
  function handleRemoveFile(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (uploading) return;

    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setFile(null);
    setPreview(null);
    setFileName('');
    setFileSize(0);
    setDimensions({ width: 0, height: 0 });
    setLightboxOpen(false);
    setUploadProgress(0);
    setError('');
    setNotice('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setAnnouncement('Gambar dihapus');
  }

  // --- Batalkan Upload saat Berjalan ---
  function handleCancelUpload(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (uploadAbortControllerRef.current) {
      uploadAbortControllerRef.current.abort();
    }
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
    setNotice('');
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

    const controller = new AbortController();
    uploadAbortControllerRef.current = controller;
    setUploading(true);
    setUploadProgress(0);

    try {
      const response = await api.post('/photos', formData, {
        signal: controller.signal,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent);
          }
        },
      });

      setSuccess(response.data.data);
      setAnnouncement('Foto berhasil dikirim ke antrian verifikasi.');
      if (preview) {
        URL.revokeObjectURL(preview);
      }
      setFile(null);
      setPreview(null);
      setFileName('');
      setFileSize(0);
      setDimensions({ width: 0, height: 0 });
      setLightboxOpen(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      await loadPhotos();
    } catch (err) {
      // Pembatalan request via AbortController
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
        setNotice('Unggahan dibatalkan.');
        setAnnouncement('Unggahan dibatalkan.');
        setUploadProgress(0);
        return;
      }

      if (err.response?.status === 409) {
        setError(
          err.response.data?.error || 'Foto ini sudah pernah diunggah untuk lahan tersebut.'
        );
      } else if (err.response?.status === 429) {
        setError(
          err.response.data?.error ||
            'Batas unggahan tercapai. Anda telah mencapai batas maksimal unggahan foto per jam. Silakan coba lagi beberapa saat lagi.'
        );
      } else {
        const data = err.response?.data;
        setError(
          data?.distance !== undefined
            ? `${data.error} (jarak ${data.distance} m dari titik lahan)`
            : data?.error || 'Gagal mengunggah foto.'
        );
      }
    } finally {
      setUploading(false);
      uploadAbortControllerRef.current = null;
    }
  }

  const canSubmit = Boolean(file && fieldId && location) && !uploading && fields.length > 0;

  const fieldOptions = useMemo(() => {
    return fields.map((field) => ({
      value: String(field.id),
      label: field.name,
      description: formatArea(field.area),
    }));
  }, [fields]);

  return (
    <div>
      {/* Pengumuman pembaca layar (ARIA Live Region) */}
      <div className="sr-only" role="status" aria-live="polite">
        {announcement}
      </div>

      <PageHeader
        eyebrow="Bukti Lapangan"
        title="Unggah Foto Progres"
        subtitle="Kirim bukti visual kondisi lahan untuk proses verifikasi zero burning."
      />

      <div className="mt-7 grid grid-cols-1 xl:grid-cols-5 gap-5">
        <div className="xl:col-span-3">
          <form
            onSubmit={handleUpload}
            onPaste={handlePaste}
            className="card p-5 lg:p-6 space-y-6 animate-fade-up"
          >
            <div className="flex items-center gap-3">
              <div className="icon-tile w-11 h-11 bg-primary/10 text-primary">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Foto Progres Lahan</h3>
                <p className="text-xs text-muted-foreground">Format JPG, PNG, atau WebP, maksimal 5 MB</p>
              </div>
            </div>

            <div>
              <label htmlFor="upload-field-select" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Pilih Lahan
              </label>
              <Select
                id="upload-field-select"
                aria-label="Pilih Lahan"
                value={fieldId}
                onChange={(val) => setFieldId(val)}
                options={fieldOptions}
                disabled={fieldsLoading || fields.length === 0 || uploading}
                placeholder={
                  fieldsLoading
                    ? 'Memuat lahan...'
                    : fields.length === 0
                    ? 'Belum ada lahan terdaftar'
                    : 'Pilih lahan...'
                }
                emptyMessage="Belum ada lahan terdaftar"
                searchable={fields.length > 5}
              />
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

            {/* Input file tersembunyi yang dapat dipicu lewat klik dropzone atau tombol */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
              capture="environment"
              disabled={uploading}
              onChange={handleFileInputChange}
              className="hidden"
              id="file-upload-input"
            />

            {/* Area Dropzone dan Pratinjau Foto */}
            {preview ? (
              <div className="relative rounded-2xl border border-border bg-card p-4 space-y-3.5 animate-fade-in shadow-xs">
                {/* Kontainer Gambar Rasio Tetap (16:9), Max Height ~280px, Object Contain Tanpa Upscale */}
                <div
                  role="button"
                  tabIndex={0}
                  aria-label="Perbesar pratinjau"
                  onClick={() => !uploading && setLightboxOpen(true)}
                  onKeyDown={(e) => {
                    if (!uploading && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      setLightboxOpen(true);
                    }
                  }}
                  className="relative w-full aspect-[16/9] max-h-[280px] overflow-hidden rounded-xl bg-muted/40 flex items-center justify-center select-none group cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-primary/40 border border-border/40"
                >
                  <img
                    src={preview}
                    alt={`Pratinjau foto progres lahan: ${fileName}`}
                    onLoad={(e) =>
                      setDimensions({
                        width: e.currentTarget.naturalWidth,
                        height: e.currentTarget.naturalHeight,
                      })
                    }
                    className="max-w-full max-h-full w-auto h-auto object-contain rounded-xl transition-transform duration-200 group-hover:scale-[1.01]"
                  />

                  {/* Indikator Hover Zoom In */}
                  {!uploading && (
                    <div
                      className="absolute bottom-2.5 right-2.5 p-1.5 rounded-lg bg-gray-900/60 text-white opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity backdrop-blur-xs pointer-events-none"
                      aria-hidden="true"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </div>
                  )}

                  {/* Overlay Status Uploading */}
                  {uploading && (
                    <div
                      className="absolute inset-0 bg-gray-900/50 backdrop-blur-xs flex flex-col items-center justify-center text-white p-4 rounded-xl cursor-default"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Loader2 className="w-8 h-8 animate-spin text-white mb-2" />
                      <p className="text-sm font-semibold">Mengunggah foto... {uploadProgress}%</p>
                    </div>
                  )}
                </div>

                {/* Progress Bar Tipis Saat Upload Berjalan */}
                {uploading && (
                  <div className="space-y-1 py-0.5">
                    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-primary h-1.5 rounded-full transition-all duration-200"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-muted-foreground">
                      <span>Proses pengunggahan ke server</span>
                      <span className="font-semibold">{uploadProgress}%</span>
                    </div>
                  </div>
                )}

                {/* Baris Info File dan Aksi (Ganti / Hapus / Batalkan) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border/60">
                  {/* Info File: Ikon tile, nama file truncate + title penuh, metadata muted */}
                  <div className="min-w-0 flex items-center gap-3">
                    <div className="icon-tile w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary/10 text-primary shrink-0">
                      <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0">
                      <p
                        className="text-xs sm:text-sm font-medium text-foreground truncate max-w-[200px] sm:max-w-xs md:max-w-sm"
                        title={fileName}
                      >
                        {fileName}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {formatFileSize(fileSize)} · {fileFormat}
                        {dimensions.width && dimensions.height
                          ? ` · ${dimensions.width} × ${dimensions.height} px`
                          : ''}
                      </p>
                    </div>
                  </div>

                  {/* Tombol Aksi: Sejajar vertikal tengah, tinggi seragam (40px desktop, 44px mobile) */}
                  <div className="w-full sm:w-auto grid grid-cols-2 sm:flex sm:items-center gap-2">
                    {uploading ? (
                      <button
                        type="button"
                        onClick={handleCancelUpload}
                        className="col-span-2 w-full sm:w-auto h-11 sm:h-10 px-4 inline-flex items-center justify-center gap-1.5 rounded-full border border-border bg-card hover:bg-secondary text-foreground text-xs font-semibold shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
                        aria-label="Batalkan proses unggah"
                      >
                        <XCircle className="w-4 h-4 text-muted-foreground" />
                        <span>Batalkan</span>
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full sm:w-auto h-11 sm:h-10 px-4 inline-flex items-center justify-center gap-1.5 rounded-full border border-border bg-card hover:bg-secondary text-foreground text-xs font-semibold shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                          <ImagePlus className="w-4 h-4 text-muted-foreground" />
                          <span>Ganti foto</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveFile}
                          className="w-full sm:w-auto h-11 sm:h-10 px-4 sm:px-3.5 inline-flex items-center justify-center gap-1.5 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-destructive/20"
                          aria-label={`Hapus gambar ${fileName}`}
                          title="Hapus gambar"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="sm:hidden">Hapus</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div
                ref={dropzoneRef}
                role="button"
                tabIndex={0}
                aria-label="Area unggah foto. Klik atau seret gambar ke sini, tekan Enter atau Spasi untuk memilih file"
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative block cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-200 select-none focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                  isDragging
                    ? 'border-primary bg-primary/10 ring-2 ring-primary/20 scale-[0.99]'
                    : 'border-input bg-card hover:border-primary/50 hover:bg-secondary/30'
                }`}
              >
                <div className="flex flex-col items-center gap-3 py-6 pointer-events-none">
                  <div
                    className={`icon-tile w-14 h-14 transition-colors ${
                      isDragging ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
                    }`}
                  >
                    <UploadIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {isDragging ? 'Lepaskan gambar di sini' : 'Klik untuk memilih foto'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isDragging
                        ? 'File akan langsung diproses'
                        : 'atau seret langsung dari File Explorer / Unduhan'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Lightbox / Modal Perbesar Foto Sederhana */}
            {lightboxOpen && preview && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/85 p-4 sm:p-6 backdrop-blur-sm animate-fade-in"
                onClick={() => setLightboxOpen(false)}
              >
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-label={`Pratinjau besar: ${fileName}`}
                  className="relative max-w-4xl w-full flex flex-col items-center justify-center animate-fade-up"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="w-full flex justify-end pb-2">
                    <button
                      type="button"
                      onClick={() => setLightboxOpen(false)}
                      className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white"
                      aria-label="Tutup pratinjau"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="overflow-hidden rounded-2xl bg-black/40 border border-white/10 shadow-2xl flex items-center justify-center p-2 max-h-[75vh]">
                    <img
                      src={preview}
                      alt={`Pratinjau foto progres lahan: ${fileName}`}
                      className="max-w-full max-h-[70vh] object-contain rounded-xl"
                    />
                  </div>
                  <div className="mt-3 text-center text-white/90 text-xs sm:text-sm font-medium drop-shadow-md">
                    <p className="truncate max-w-md sm:max-w-xl">{fileName}</p>
                    <p className="text-[11px] text-white/70 mt-0.5">
                      {formatFileSize(fileSize)} · {fileFormat}
                      {dimensions.width && dimensions.height
                        ? ` · ${dimensions.width} × ${dimensions.height} px`
                        : ''}
                    </p>
                  </div>
                </div>
              </div>
            )}

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
                  disabled={locating || uploading}
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
              <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-700 animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {notice && (
              <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-800 animate-fade-in">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{notice}</span>
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
                  <Loader2 className="w-4 h-4 animate-spin" /> Mengunggah... ({uploadProgress}%)
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
        <div>
          <h3 className="text-base font-bold text-gray-900">Riwayat Unggahan</h3>
          <p className="text-xs text-gray-500 mt-0.5">30 foto terbaru dari lahan Anda</p>
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
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 3xl:grid-cols-4 4xl:grid-cols-5 gap-4">
            {photos.map((photo) => {
              const status = statusStyles[photo.status] || {
                label: photo.status,
                className: 'badge-info',
              };
              return (
                <div key={photo.id} className="card p-3 space-y-2.5 animate-fade-up">
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-100">
                    <img
                      src={photo.photo_url}
                      alt={`Foto lahan ${photo.field_name || ''}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <span className={`absolute top-2 right-2 badge ${status.className}`}>
                      {status.label}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-gray-800 truncate">
                      {photo.field_name || 'Lahan'}
                    </p>
                    <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-gray-400" /> {formatDateTime(photo.taken_at)}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-green-600" />
                      {photo.distance_from_center !== null && photo.distance_from_center !== undefined
                        ? `${photo.distance_from_center} m`
                        : '-'}
                    </span>
                    <span className="flex items-center gap-1 font-mono text-[10px] text-gray-400">
                      <Hash className="w-3 h-3" />
                      {photo.photo_hash ? `${photo.photo_hash.slice(0, 8)}…` : '-'}
                    </span>
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
