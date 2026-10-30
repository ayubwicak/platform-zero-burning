import { useState, useEffect } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import AuthShell from '../components/AuthShell';
import BackToHome from '../components/BackToHome';
import { useAuth } from '../context/AuthContext';

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
    <AuthShell>
      <BackToHome className="auth-back-home" />
      <p className="text-xs uppercase tracking-[0.2em] text-ember">Masuk</p>
      <h2 className="auth-title mt-3 font-display text-4xl leading-tight text-foreground">
        Selamat datang kembali.
      </h2>
      <p className="auth-subtitle mt-2 text-muted-foreground">
        Masuk untuk mengelola lahan dan insentif.
      </p>

      {logoutReason && (
        <div
          role="alert"
          className="mt-6 flex items-start gap-2.5 rounded-xl border border-ember/20 bg-ember/10 px-4 py-3 text-sm text-foreground"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-ember" />
          <div>
            <p className="font-semibold">Sesi berakhir</p>
            <p className="mt-0.5 leading-relaxed text-muted-foreground">{logoutReason}</p>
          </div>
        </div>
      )}

      {location.state?.registered && (
        <div
          role="status"
          className="mt-6 flex items-start gap-2.5 rounded-xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm text-foreground"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            <p className="font-semibold">Pendaftaran selesai</p>
            <p className="mt-0.5 leading-relaxed text-muted-foreground">
              {location.state.registrationMessage ||
                'Akun petani Anda sudah dibuat. Silakan masuk dengan email dan password yang didaftarkan.'}
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-form mt-8">
        <div>
          <label htmlFor="login-email" className="block text-sm font-semibold text-foreground">
            Email
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="public-field mt-2"
            placeholder="email@contoh.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        <div>
          <label htmlFor="login-password" className="block text-sm font-semibold text-foreground">
            Kata sandi
          </label>
          <input
            id="login-password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="public-field mt-2"
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        <label className="flex select-none items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            name="remember"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
            className="h-4 w-4 rounded border-input accent-primary focus:ring-ring"
          />
          Ingat saya
        </label>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-3.5 py-2.5 text-xs text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button type="submit" className="public-submit" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? 'Memproses...' : 'Masuk →'}
        </button>
      </form>

      {import.meta.env.DEV && (
        <div className="auth-hide-short mt-5 space-y-2">
          <div className="flex items-start justify-between gap-2 rounded-xl border border-primary/15 bg-primary/5 px-4 py-2.5 text-xs">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="font-semibold text-foreground">Akun Petugas Demo</p>
                <p className="mt-0.5 font-mono text-muted-foreground">petugas@contoh.com / Petugas123!</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setEmail('petugas@contoh.com');
                setPassword('Petugas123!');
              }}
              className="text-[11px] font-semibold text-primary hover:underline shrink-0"
            >
              Gunakan
            </button>
          </div>
          <div className="flex items-start justify-between gap-2 rounded-xl border border-border bg-muted/40 px-4 py-2.5 text-xs">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="font-semibold text-foreground">Akun Admin Demo</p>
                <p className="mt-0.5 font-mono text-muted-foreground">admin@zeroburning.id / admin123</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setEmail('admin@zeroburning.id');
                setPassword('admin123');
              }}
              className="text-[11px] font-semibold text-primary hover:underline shrink-0"
            >
              Gunakan
            </button>
          </div>
        </div>
      )}

      <div className="auth-card-footer auth-footer mt-8 border-t border-border pt-6 text-center text-sm">
        <p className="text-muted-foreground">
          Belum punya akun?{' '}
          <Link
            to="/register"
            state={location.state?.from ? { from: location.state.from } : undefined}
            className="font-semibold text-primary hover:underline"
          >
            Daftar sebagai petani
          </Link>
        </p>
        <p className="auth-hide-short mt-2 text-xs text-muted-foreground">
          Akun petugas dan admin dibuat oleh administrator.
        </p>
      </div>
    </AuthShell>
  );
}
