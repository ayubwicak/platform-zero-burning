import { useState, useEffect } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  ShieldCheck,
  ArrowRight,
  Leaf,
  Camera,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronLeft,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const features = [
  { icon: Camera, text: 'Verifikasi foto progres lahan dengan GPS' },
  { icon: ShieldCheck, text: 'Verifikasi dua lapis: komunitas & petugas' },
  { icon: CreditCard, text: 'Insentif transparan bagi petani zero burning' },
];

export default function Login() {
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.registeredEmail || '');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [logoutReason, setLogoutReason] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const reason = sessionStorage.getItem('zb_logout_reason');
    if (reason) {
      setLogoutReason(reason);
      sessionStorage.removeItem('zb_logout_reason');
    }
  }, []);

  if (isAuthenticated) {
    return <Navigate to={location.state?.from || '/dashboard'} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email.trim(), password, remember);
      navigate(location.state?.from || '/dashboard', { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.error ||
          'Gagal masuk. Periksa email/password dan pastikan server backend berjalan.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      {/* Desktop branding panel */}
      <aside className="auth-brand-panel relative hidden h-full w-[42%] shrink-0 flex-col justify-between overflow-hidden bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 p-8 text-white lg:flex xl:w-[40%] xl:p-12">
        <div className="pointer-events-none absolute -top-24 -left-16 h-80 w-80 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-10 h-96 w-96 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-dots opacity-30" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/15 backdrop-blur-sm">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-lg font-extrabold tracking-tight">Zero Burning</p>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-green-200">
              Portal Insentif
            </p>
          </div>
        </div>

        <div className="relative z-10 my-auto max-w-md py-8">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest backdrop-blur-sm">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
            Platform Insentif
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight lg:text-5xl">
            Kelola lahan tanpa membakar,
            <br />
            raih insentif nyata.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-green-50/90 lg:text-base">
            Sistem terintegrasi untuk memantau lahan, memverifikasi bukti foto,
            dan menyalurkan bantuan bagi petani.
          </p>

          <ul className="mt-8 space-y-3">
            {features.map((f) => (
              <li key={f.text} className="flex items-center gap-3 text-sm text-green-50/95">
                <span className="icon-tile h-8 w-8 shrink-0 border border-white/20 bg-white/15 backdrop-blur-sm">
                  <f.icon className="h-4 w-4" />
                </span>
                {f.text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-xs text-green-200/70">
          &copy; 2026 Platform Insentif Zero Burning
        </p>
      </aside>

      {/* Form panel - fixed to the viewport on all screens */}
      <main className="relative flex h-full min-w-0 flex-1 items-center justify-center overflow-hidden bg-gray-50 px-4 py-2 sm:px-6 sm:py-4 lg:px-10">
        <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-green-100/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-emerald-100/30 blur-3xl" />

        <div className="relative z-10 flex h-full w-full max-w-md flex-col justify-center lg:max-w-[34rem]">
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
              <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              Kembali
            </Link>
          </div>

          <div className="auth-card card w-full p-4 animate-fade-up sm:p-6 lg:p-8">
            {/* Desktop back link + small brand */}
            <div className="mb-4 hidden items-center justify-between lg:flex">
              <Link
                to="/"
                className="group inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                Kembali
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
              <h2 className="auth-title text-2xl font-extrabold tracking-tight text-gray-900 lg:text-[28px] lg:leading-9">
                Selamat datang kembali
              </h2>
              <p className="auth-subtitle mt-1 text-sm text-gray-500">
                Masuk untuk mengelola lahan dan insentif.
              </p>
            </div>

            {logoutReason && (
              <div
                role="alert"
                className="mb-3 flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-800"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <div>
                  <p className="font-semibold">Sesi berakhir</p>
                  <p className="mt-0.5 leading-relaxed">{logoutReason}</p>
                </div>
              </div>
            )}

            {location.state?.registered && (
              <div
                role="status"
                className="mb-3 flex items-start gap-2 rounded-xl border border-green-100 bg-green-50 px-3.5 py-2.5 text-xs text-green-800"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                <div>
                  <p className="font-semibold">Pendaftaran selesai</p>
                  <p className="mt-0.5 leading-relaxed">
                    {location.state.registrationMessage ||
                      'Akun petani Anda sudah dibuat. Silakan masuk dengan email dan password yang didaftarkan.'}
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="grid gap-y-3">
              <div>
                <label
                  htmlFor="login-email"
                  className="mb-1 block text-sm font-semibold text-gray-700"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    className="input-field pl-10"
                    placeholder="email@contoh.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="mb-1 block text-sm font-semibold text-gray-700"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    id="login-password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    className="input-field pl-10"
                    placeholder="••••••••"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </div>
              </div>

              <label className="flex select-none items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  name="remember"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 accent-green-600 focus:ring-green-500"
                />
                Ingat saya
              </label>

              {error && (
                <div className="auth-error flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 px-3 py-1.5 text-[11px] text-rose-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
                {loading ? 'Memproses...' : 'Masuk'}
              </button>
            </form>

            {import.meta.env.DEV && (
              <div className="auth-hide-short mt-3.5 flex items-start gap-2 rounded-xl border border-green-100 bg-green-50/70 px-3.5 py-2 text-xs text-green-800">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-semibold">Akun admin demo</p>
                  <p className="mt-0.5 font-mono">admin@zeroburning.id / admin123</p>
                </div>
              </div>
            )}

            <div className="auth-footer mt-4 border-t border-gray-100 pt-3.5">
              <p className="text-center text-sm text-gray-500">
                Belum punya akun?{' '}
                <Link
                  to="/register"
                  state={location.state?.from ? { from: location.state.from } : undefined}
                  className="font-semibold text-green-700 hover:text-green-800 hover:underline"
                >
                  Daftar sebagai petani
                </Link>
              </p>
              <p className="auth-hide-short mt-1 text-center text-[11px] text-gray-500">
                Akun petugas dan admin dibuat oleh administrator.
              </p>
            </div>

            <p className="auth-hide-short mt-3.5 flex items-center justify-center gap-1.5 text-[11px] text-gray-500">
              <Leaf className="h-3.5 w-3.5 text-green-500" />
              Bersama menjaga lahan tanpa membakar
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
