import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Eye,
  EyeOff,
  Leaf,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sprout,
  User,
  UserPlus,
} from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

const benefits = [
  {
    icon: Sprout,
    title: 'Kelola lahan',
    desc: 'Catat lokasi, luas, dan jenis tanaman dalam satu tempat.',
  },
  {
    icon: ShieldCheck,
    title: 'Bukti terverifikasi',
    desc: 'Unggah foto progres dengan validasi GPS dan hash berkas.',
  },
  {
    icon: Leaf,
    title: 'Klaim insentif',
    desc: 'Ajukan benih, pupuk, atau alat setelah lahan terverifikasi.',
  },
];

export default function Register() {
  const [form, setForm] = useState({
    nama: '',
    email: '',
    nik: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;

  if (isAuthenticated) {
    return <Navigate to={from || '/dashboard'} replace />;
  }

  const updateField = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleNikChange = (event) => {
    const value = event.target.value.replace(/\D/g, '').slice(0, 16);
    setForm((prev) => ({ ...prev, nik: value }));
  };

  const validate = () => {
    if (!form.nama.trim()) return 'Nama lengkap wajib diisi.';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return 'Masukkan alamat email yang valid.';
    if (!/^\d{16}$/.test(form.nik)) return 'NIK harus terdiri dari 16 digit angka.';
    if (form.password.length < 6) return 'Password minimal 6 karakter.';
    if (form.password.length > 72) return 'Password maksimal 72 karakter.';
    if (form.password !== form.confirmPassword) return 'Konfirmasi password belum sama.';
    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const normalizedEmail = form.email.trim().toLowerCase();
      const response = await api.post('/auth/register', {
        nama: form.nama.trim(),
        email: normalizedEmail,
        password: form.password,
        role: 'petani',
        nik: form.nik,
        phone: form.phone.trim(),
        address: form.address.trim(),
      });

      navigate('/verify-email', {
        replace: true,
        state: {
          email: normalizedEmail,
        },
      });
    } catch (err) {
      setError(
        err.response?.data?.error ||
          'Registrasi gagal. Periksa koneksi dan pastikan server backend berjalan.'
      );
    } finally {
      setLoading(false);
    }
  };

  const passwordMismatch =
    form.confirmPassword.length > 0 && form.password !== form.confirmPassword;

  return (
    <div className="h-screen overflow-hidden flex bg-gray-50">
      {/* Panel branding */}
      <aside className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 text-white p-12 flex-col justify-between">
        <div className="absolute -top-24 -left-16 w-80 h-80 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-32 -right-10 w-96 h-96 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="absolute inset-0 bg-dots opacity-30" />

        <Link to="/" className="relative flex items-center gap-3 w-fit">
          <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-lg font-extrabold tracking-tight">Zero Burning</p>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-green-200">
              Portal Insentif
            </p>
          </div>
        </Link>

        <div className="relative max-w-md">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
            Registrasi Petani
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight">
            Mulai langkah pertama
            <br />
            menuju insentif.
          </h1>
          <p className="mt-4 text-green-50/90 text-sm leading-relaxed">
            Buat akun petani untuk mendaftarkan lahan, mengunggah bukti praktik
            tanpa membakar, dan mengajukan insentif secara transparan.
          </p>

          <ul className="mt-8 space-y-4">
            {benefits.map((benefit) => (
              <li key={benefit.title} className="flex items-start gap-3 text-sm text-green-50/95">
                <span className="icon-tile w-9 h-9 bg-white/15 border border-white/20 backdrop-blur-sm shrink-0">
                  <benefit.icon className="w-4 h-4" />
                </span>
                <div>
                  <p className="font-semibold text-white">{benefit.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-green-100/80">
                    {benefit.desc}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs leading-relaxed text-green-200/70">
          Pendaftaran ini khusus petani. Akun petugas dan admin dibuat oleh administrator.
        </p>
      </aside>

      {/* Form registrasi */}
      <main className="flex-1 flex items-center justify-center p-5 sm:p-8 lg:p-12">
        <div className="w-full max-w-md">
          {/* Brand mobile */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-7">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center shadow-md shadow-green-200">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-lg font-extrabold text-gray-900 leading-none">Zero Burning</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-green-700 mt-1">
                Portal Insentif
              </p>
            </div>
          </div>

          <div className="card p-6 sm:p-8 animate-fade-up">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 transition-colors hover:text-green-700"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Kembali ke beranda
            </Link>

            <div className="mt-2 mb-6">
              <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
                Daftar sebagai petani
              </h1>
            </div>

            <div className="mb-5 flex items-start gap-2 rounded-xl border border-green-100 bg-green-50/70 px-3.5 py-2.5 text-xs leading-relaxed text-green-800">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <span className="font-semibold">Khusus petani.</span> Akun petugas dan admin
                tidak dapat dibuat dari halaman ini.
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label htmlFor="nama" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Nama lengkap
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="nama"
                    type="text"
                    required
                    maxLength={100}
                    autoComplete="name"
                    className="input-field pl-10"
                    placeholder="Sesuai KTP"
                    value={form.nama}
                    onChange={updateField('nama')}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold text-gray-700 mb-1.5"
                  >
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      id="email"
                      type="email"
                      required
                      maxLength={150}
                      autoComplete="email"
                      className="input-field pl-10"
                      placeholder="email@contoh.com"
                      value={form.email}
                      onChange={updateField('email')}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="nik"
                    className="block text-sm font-semibold text-gray-700 mb-1.5"
                  >
                    NIK
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      id="nik"
                      type="text"
                      inputMode="numeric"
                      required
                      maxLength={16}
                      pattern="[0-9]{16}"
                      title="NIK terdiri dari 16 digit angka"
                      autoComplete="off"
                      className="input-field pl-10"
                      placeholder="16 digit sesuai KTP"
                      value={form.nik}
                      onChange={handleNikChange}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-semibold text-gray-700 mb-1.5"
                >
                  Nomor telepon <span className="font-normal text-gray-500">(opsional)</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="phone"
                    type="tel"
                    maxLength={20}
                    autoComplete="tel"
                    className="input-field pl-10"
                    placeholder="08xxxxxxxxxx"
                    value={form.phone}
                    onChange={updateField('phone')}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="address"
                  className="block text-sm font-semibold text-gray-700 mb-1.5"
                >
                  Alamat <span className="font-normal text-gray-500">(opsional)</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                  <textarea
                    id="address"
                    rows={2}
                    maxLength={500}
                    autoComplete="street-address"
                    className="input-field pl-10 resize-none"
                    placeholder="Alamat domisili atau lokasi lahan"
                    value={form.address}
                    onChange={updateField('address')}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-gray-700 mb-1.5"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      maxLength={72}
                      autoComplete="new-password"
                      className="input-field pl-10 pr-11"
                      placeholder="Minimal 6 karakter"
                      value={form.password}
                      onChange={updateField('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600"
                      aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="confirm-password"
                    className="block text-sm font-semibold text-gray-700 mb-1.5"
                  >
                    Konfirmasi password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      id="confirm-password"
                      type={showConfirm ? 'text' : 'password'}
                      required
                      minLength={6}
                      maxLength={72}
                      autoComplete="new-password"
                      className="input-field pl-10 pr-11"
                      placeholder="Ulangi password"
                      value={form.confirmPassword}
                      onChange={updateField('confirmPassword')}
                      aria-invalid={passwordMismatch}
                      aria-describedby={passwordMismatch ? 'confirm-password-error' : undefined}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((prev) => !prev)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600"
                      aria-label={
                        showConfirm ? 'Sembunyikan konfirmasi password' : 'Tampilkan konfirmasi password'
                      }
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordMismatch && (
                    <p id="confirm-password-error" className="mt-1 text-[11px] text-rose-600">
                      Password belum sama.
                    </p>
                  )}
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-700"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                {loading ? 'Mendaftarkan akun...' : 'Daftar sebagai petani'}
              </button>
            </form>

            <div className="mt-6 border-t border-gray-100 pt-5">
              <p className="text-center text-sm text-gray-500">
                Sudah punya akun?{' '}
                <Link
                  to="/login"
                  state={from ? { from } : undefined}
                  className="font-semibold text-green-700 hover:text-green-800 hover:underline"
                >
                  Masuk di sini
                </Link>
              </p>
            </div>
          </div>

          <p className="flex items-center justify-center gap-1.5 text-[11px] text-gray-500 mt-6">
            <Leaf className="w-3.5 h-3.5 text-green-500" />
            Bersama menjaga lahan tanpa membakar
          </p>
        </div>
      </main>
    </div>
  );
}
