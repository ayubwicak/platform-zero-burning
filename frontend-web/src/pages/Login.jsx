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
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50">
      {/* Desktop branding panel */}
      <div className="hidden lg:flex lg:w-[40%] overflow-hidden bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 text-white p-8 lg:p-12 flex-col justify-between">
        <div className="absolute -top-24 -left-16 w-80 h-80 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-32 -right-10 w-96 h-96 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="absolute inset-0 bg-dots opacity-30" />

        <div className="relative flex items-center gap-3 z-10">
          <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-lg font-extrabold tracking-tight">Zero Burning</p>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-green-200">
              Portal Insentif
            </p>
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
            Platform Insentif
          </span>
          <h1 className="mt-5 text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight">
            Kelola lahan tanpa membakar,
            <br />
            raih insentif nyata.
          </h1>
          <p className="mt-4 text-green-50/90 text-sm lg:text-base leading-relaxed">
            Sistem terintegrasi untuk memantau lahan, memverifikasi bukti foto,
            dan menyalurkan bantuan bagi petani.
          </p>

          <ul className="mt-8 space-y-3">
            {features.map((f) => (
              <li key={f.text} className="flex items-center gap-3 text-sm text-green-50/95">
                <span className="icon-tile w-8 h-8 bg-white/15 border border-white/20 backdrop-blur-sm shrink-0">
                  <f.icon className="w-4 h-4" />
                </span>
                {f.text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-green-200/70 z-10">
          &copy; 2026 Platform Insentif Zero Burning
        </p>
      </div>

      {/* Form panel - visible on all screens */}
      <div className="flex-1 min-h-[60vh] lg:min-h-screen relative overflow-hidden bg-gray-50 px-6 py-10 lg:px-12 lg:py-0 flex items-center justify-center">
        {/* Decorative background */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-green-100/30 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-emerald-100/30 blur-3xl" />

        <div className="relative z-10 w-full max-w-md lg:max-w-lg xl:max-w-xl">
          {/* Mobile brand header + back link */}
          <div className="lg:hidden flex items-center justify-between mb-6">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center shadow-md shadow-green-200">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-extrabold text-gray-900 leading-none">Zero Burning</p>
                <p className="text-[9px] font-bold uppercase tracking-widest text-green-700 mt-0.5">
                  Portal Insentif
                </p>
              </div>
            </Link>
            <Link
              to="/"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 group"
            >
              <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
              Kembali
            </Link>
          </div>

          <div className="card p-8 sm:p-10 animate-fade-up">
            {/* Desktop back link + small brand */}
            <div className="hidden lg:flex items-center justify-between mb-8">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 group"
              >
                <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
                Kembali
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center shadow-md shadow-green-200">
                  <ShieldCheck className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-gray-900 leading-none">Zero Burning</p>
                  <p className="text-[8px] font-bold uppercase tracking-widest text-green-700 mt-0.5">
                    Portal Insentif
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-7">
              <h2 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-gray-900">
                Selamat datang kembali
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Masuk untuk mengelola lahan dan insentif.
              </p>
            </div>

            {logoutReason && (
              <div
                role="alert"
                className="mb-5 flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 px-3.5 py-3 text-xs text-amber-800"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <div>
                  <p className="font-semibold">Sesi berakhir</p>
                  <p className="mt-0.5 leading-relaxed">{logoutReason}</p>
                </div>
              </div>
            )}

            {location.state?.registered && (
              <div
                role="status"
                className="mb-5 flex items-start gap-2 rounded-xl border border-green-100 bg-green-50 px-3.5 py-3 text-xs text-green-800"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-green-600" />
                <div>
                  <p className="font-semibold">Pendaftaran selesai</p>
                  <p className="mt-0.5 leading-relaxed">
                    {location.state.registrationMessage ||
                      'Akun petani Anda sudah dibuat. Silakan masuk dengan email dan password yang didaftarkan.'}
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    required
                    className="input-field pl-10"
                    placeholder="email@contoh.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    required
                    className="input-field pl-10"
                    placeholder="••••••••"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-600 select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                Ingat saya
              </label>

              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                {loading ? 'Memproses...' : 'Masuk'}
              </button>
            </form>

            {import.meta.env.DEV && (
              <div className="mt-6 flex items-start gap-2 rounded-xl border border-green-100 bg-green-50/70 px-3.5 py-2.5 text-xs text-green-800">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Akun admin demo</p>
                  <p className="mt-0.5 font-mono">admin@zeroburning.id / admin123</p>
                </div>
              </div>
            )}

            <div className="mt-6 border-t border-gray-100 pt-5">
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
              <p className="mt-1 text-center text-[11px] text-gray-500">
                Akun petugas dan admin dibuat oleh administrator.
              </p>
            </div>

            <p className="flex items-center justify-center gap-1.5 text-[11px] text-gray-500 mt-6">
              <Leaf className="w-3.5 h-3.5 text-green-500" />
              Bersama menjaga lahan tanpa membakar
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
