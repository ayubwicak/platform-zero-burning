import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
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
      await api.post('/auth/register', {
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
    <div className="auth-shell">
      {/* Desktop branding panel */}
      <aside className="auth-brand-panel relative hidden h-full w-[42%] shrink-0 flex-col justify-between overflow-hidden bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 p-8 text-white lg:flex xl:w-[40%] xl:p-12">
        <div className="pointer-events-none absolute -top-24 -left-16 h-80 w-80 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-10 h-96 w-96 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-dots opacity-30" />

        <Link to="/" className="relative z-10 flex w-fit items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/15 backdrop-blur-sm">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-lg font-extrabold tracking-tight">Zero Burning</p>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-green-200">
              Portal Insentif
            </p>
          </div>
        </Link>

        <div className="relative z-10 my-auto max-w-md py-8">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
            Registrasi Petani
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight lg:text-5xl">
            Mulai langkah pertama
            <br />
            menuju insentif.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-green-50/90 lg:text-base">
            Buat akun petani untuk mendaftarkan lahan, mengunggah bukti praktik
            tanpa membakar, dan mengajukan insentif secara transparan.
          </p>

          <ul className="mt-8 space-y-4">
            {benefits.map((benefit) => (
              <li key={benefit.title} className="flex items-start gap-3 text-sm text-green-50/95">
                <span className="icon-tile h-9 w-9 shrink-0 border border-white/20 bg-white/15 backdrop-blur-sm">
                  <benefit.icon className="h-4 w-4" />
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

        <p className="relative z-10 text-xs leading-relaxed text-green-200/70">
          Pendaftaran ini khusus petani. Akun petugas dan admin dibuat oleh administrator.
        </p>
      </aside>

      {/* Form panel - fixed to the viewport on all screens */}
      <main className="relative flex h-full min-w-0 flex-1 items-center justify-center overflow-hidden bg-gray-50 px-4 py-2 sm:px-6 sm:py-4 lg:px-10">
        <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-green-100/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-emerald-100/30 blur-3xl" />

        <div className="auth-register-panel relative z-10 flex h-full w-full max-w-md flex-col justify-center lg:max-w-xl">
          {/* Mobile brand header + back link */}
          <div className="auth-mobile-header mb-2 flex shrink-0 items-center justify-between lg:hidden">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-700 shadow-md shadow-green-200">
                <ShieldCheck className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-extrabold leading-none text-gray-900">Zero Burning</p>
                <p className="mt-0.5 text-[9px] font-bold uppercase tracking-widest text-green-700">
                  Portal Insentif
                </p>
              </div>
            </Link>
            <Link
              to="/"
              className="group inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              Kembali
            </Link>
          </div>

          <div className="auth-card card w-full p-4 animate-fade-up sm:p-6 lg:p-8">
            {/* Desktop back link */}
            <div className="mb-4 hidden items-center justify-between lg:flex">
              <Link
                to="/"
                className="group inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-green-700"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Kembali ke beranda
              </Link>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-700 shadow-md shadow-green-200">
                  <ShieldCheck className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-extrabold leading-none text-gray-900">Zero Burning</p>
                  <p className="mt-0.5 text-[8px] font-bold uppercase tracking-widest text-green-700">
                    Portal Insentif
                  </p>
                </div>
              </div>
            </div>

            <div className="auth-heading mb-4">
              <h1 className="auth-title text-2xl font-extrabold tracking-tight text-gray-900 lg:text-[28px] lg:leading-9">
                Daftar sebagai petani
              </h1>
              <p className="auth-subtitle mt-1 text-xs text-gray-500 sm:text-sm">
                Khusus petani. Akun petugas &amp; admin dibuat administrator.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="auth-form-grid grid grid-cols-2 gap-x-3 gap-y-2.5 sm:gap-x-4 sm:gap-y-3"
              noValidate
            >
              <div className="col-span-2 sm:col-span-1">
                <label
                  htmlFor="nama"
                  className="mb-1 block text-sm font-semibold text-gray-700"
                >
                  Nama lengkap
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    id="nama"
                    name="nama"
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

              <div className="col-span-2 sm:col-span-1">
                <label
                  htmlFor="email"
                  className="mb-1 block text-sm font-semibold text-gray-700"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    id="email"
                    name="email"
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
                  className="mb-1 block text-sm font-semibold text-gray-700"
                >
                  NIK
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    id="nik"
                    name="nik"
                    type="text"
                    inputMode="numeric"
                    required
                    maxLength={16}
                    pattern="[0-9]{16}"
                    title="NIK terdiri dari 16 digit angka"
                    autoComplete="off"
                    className="input-field pl-10"
                    placeholder="16 digit"
                    value={form.nik}
                    onChange={handleNikChange}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="mb-1 block whitespace-nowrap text-sm font-semibold text-gray-700"
                >
                  Telepon <span className="text-[10px] font-normal text-gray-500 sm:text-xs">(opsional)</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    id="phone"
                    name="phone"
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

              <div className="col-span-2">
                <label
                  htmlFor="address"
                  className="mb-1 block text-sm font-semibold text-gray-700"
                >
                  Alamat <span className="text-[10px] font-normal text-gray-500 sm:text-xs">(opsional)</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                  <textarea
                    id="address"
                    name="address"
                    rows={2}
                    maxLength={500}
                    autoComplete="street-address"
                    className="input-field resize-none pl-10"
                    placeholder="Alamat domisili atau lokasi lahan"
                    value={form.address}
                    onChange={updateField('address')}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-1 block text-sm font-semibold text-gray-700"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    maxLength={72}
                    autoComplete="new-password"
                    className="input-field pl-10 pr-10"
                    placeholder="••••••"
                    value={form.password}
                    onChange={updateField('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600"
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirm-password"
                  className="mb-1 block text-sm font-semibold text-gray-700"
                >
                  Ulangi password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    id="confirm-password"
                    name="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    required
                    minLength={6}
                    maxLength={72}
                    autoComplete="new-password"
                    className="input-field pl-10 pr-10"
                    placeholder="••••••"
                    value={form.confirmPassword}
                    onChange={updateField('confirmPassword')}
                    aria-invalid={passwordMismatch}
                    aria-describedby={passwordMismatch ? 'confirm-password-error' : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((prev) => !prev)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600"
                    aria-label={
                      showConfirm
                        ? 'Sembunyikan konfirmasi password'
                        : 'Tampilkan konfirmasi password'
                    }
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordMismatch && !error && (
                  <p id="confirm-password-error" className="mt-1 text-[11px] text-rose-600">
                    Password belum sama.
                  </p>
                )}
              </div>

              {error && (
                <div
                  role="alert"
                  className="auth-error col-span-2 flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 px-3 py-1.5 text-[11px] text-rose-700"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                className="btn-primary col-span-2 w-full"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                {loading ? 'Mendaftarkan akun...' : 'Daftar sebagai petani'}
              </button>
            </form>

            <div className="auth-footer mt-4 border-t border-gray-100 pt-3.5">
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
        </div>
      </main>
    </div>
  );
}
