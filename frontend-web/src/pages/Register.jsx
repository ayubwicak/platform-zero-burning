import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import AuthShell from '../components/AuthShell';
import BackToHome from '../components/BackToHome';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

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
    <AuthShell variant="register">
      <BackToHome className="auth-back-home" />
      <p className="text-xs uppercase tracking-[0.2em] text-ember">Daftar petani</p>
      <h1 className="auth-title mt-3 font-display text-4xl leading-tight text-foreground">
        Mulai tanpa membakar.
      </h1>
      <p className="auth-subtitle mt-2 text-muted-foreground">
        Buat akun untuk mendaftarkan lahan dan mengajukan insentif.
      </p>

      <form
        onSubmit={handleSubmit}
        className="auth-form auth-form-grid mt-8 grid grid-cols-1 sm:grid-cols-2"
        noValidate
      >
        <div>
          <label htmlFor="nama" className="block text-sm font-semibold text-foreground">
            Nama lengkap
          </label>
          <input
            id="nama"
            name="nama"
            type="text"
            required
            maxLength={100}
            autoComplete="name"
            className="public-field mt-2"
            placeholder="Sesuai KTP"
            value={form.nama}
            onChange={updateField('nama')}
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-foreground">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            maxLength={150}
            autoComplete="email"
            className="public-field mt-2"
            placeholder="email@contoh.com"
            value={form.email}
            onChange={updateField('email')}
          />
        </div>

        <div>
          <label htmlFor="nik" className="block text-sm font-semibold text-foreground">
            NIK
          </label>
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
            className="public-field mt-2"
            placeholder="16 digit"
            value={form.nik}
            onChange={handleNikChange}
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-semibold text-foreground">
            Telepon{' '}
            <span className="text-xs font-normal text-muted-foreground">(opsional)</span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            maxLength={20}
            autoComplete="tel"
            className="public-field mt-2"
            placeholder="08xxxxxxxxxx"
            value={form.phone}
            onChange={updateField('phone')}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="address" className="block text-sm font-semibold text-foreground">
            Alamat{' '}
            <span className="text-xs font-normal text-muted-foreground">(opsional)</span>
          </label>
          <textarea
            id="address"
            name="address"
            rows={2}
            maxLength={500}
            autoComplete="street-address"
            className="public-field mt-2 resize-none"
            placeholder="Alamat domisili atau lokasi lahan"
            value={form.address}
            onChange={updateField('address')}
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-foreground">
            Password
          </label>
          <div className="relative mt-2">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              minLength={6}
              maxLength={72}
              autoComplete="new-password"
              className="public-field pr-11"
              placeholder="••••••"
              value={form.password}
              onChange={updateField('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="confirm-password" className="block text-sm font-semibold text-foreground">
            Ulangi password
          </label>
          <div className="relative mt-2">
            <input
              id="confirm-password"
              name="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              required
              minLength={6}
              maxLength={72}
              autoComplete="new-password"
              className="public-field pr-11"
              placeholder="••••••"
              value={form.confirmPassword}
              onChange={updateField('confirmPassword')}
              aria-invalid={passwordMismatch}
              aria-describedby={passwordMismatch ? 'confirm-password-error' : undefined}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((prev) => !prev)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
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
            <p id="confirm-password-error" className="mt-1 text-xs text-destructive">
              Password belum sama.
            </p>
          )}
        </div>

        <label className="flex items-start gap-2 text-sm text-muted-foreground sm:col-span-2">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-input accent-primary focus:ring-ring"
            required
          />
          Saya setuju data saya dipakai untuk keperluan program Zero Burning.
        </label>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-3.5 py-2.5 text-xs text-destructive sm:col-span-2"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button type="submit" className="public-submit sm:col-span-2" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? 'Mendaftarkan akun...' : 'Daftar sebagai petani →'}
        </button>
      </form>

      <div className="auth-card-footer auth-footer mt-8 border-t border-border pt-6 text-center text-sm">
        <p className="text-muted-foreground">
          Sudah punya akun?{' '}
          <Link
            to="/login"
            state={from ? { from } : undefined}
            className="font-semibold text-primary hover:underline"
          >
            Masuk di sini
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
