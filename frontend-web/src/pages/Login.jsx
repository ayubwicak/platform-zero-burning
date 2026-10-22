import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const features = [
  { icon: Camera, text: 'Verifikasi foto progres lahan dengan GPS' },
  { icon: ShieldCheck, text: 'Verifikasi dua lapis: komunitas & petugas' },
  { icon: CreditCard, text: 'Insentif transparan bagi petani zero burning' },
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
    <div className="min-h-screen flex bg-gray-50">
      {/* Panel branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 text-white p-12 flex-col justify-between">
        <div className="absolute -top-24 -left-16 w-80 h-80 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-32 -right-10 w-96 h-96 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="absolute inset-0 bg-dots opacity-30" />

        <div className="relative flex items-center gap-3">
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

        <div className="relative max-w-md">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
            Platform Insentif
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight">
            Kelola lahan tanpa membakar,
            <br />
            raih insentif nyata.
          </h1>
          <p className="mt-4 text-green-50/90 text-sm leading-relaxed">
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

        <p className="relative text-xs text-green-200/70">
          &copy; 2026 Platform Insentif Zero Burning
        </p>
      </div>

      {/* Form login */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Brand mobile */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
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

          <div className="card p-8 animate-fade-up">
            <div className="mb-7">
              <h2 className="text-2xl font-extrabold tracking-tight text-gray-900">
                Selamat datang kembali
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Masuk untuk mengelola lahan dan insentif.
              </p>
            </div>

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

            <p className="text-center text-sm text-gray-500 mt-6">
              Belum punya akun? Hubungi{' '}
              <span className="text-green-700 font-semibold">administrator</span>.
            </p>
          </div>

          <p className="flex items-center justify-center gap-1.5 text-[11px] text-gray-500 mt-6">
            <Leaf className="w-3.5 h-3.5 text-green-500" />
            Bersama menjaga lahan tanpa membakar
          </p>
        </div>
      </div>
    </div>
  );
}
