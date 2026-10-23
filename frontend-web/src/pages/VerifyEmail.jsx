import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertCircle, CheckCircle, Loader2, RefreshCw, Mail } from 'lucide-react';
import api from '../lib/api';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!email) {
      navigate('/register', { replace: true });
    }
  }, [email, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');

    if (!otp || otp.length !== 6) {
      setError('Kode OTP harus 6 digit');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/verify-email', {
        email,
        otp_code: otp,
      });

      setSuccess(true);
      setOtp('');

      setTimeout(() => {
        navigate('/login', {
          state: { message: 'Email berhasil diverifikasi. Silakan login.' },
          replace: true,
        });
      }, 2000);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          'Gagal verifikasi email. Coba lagi atau resend OTP.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setResending(true);

    try {
      await api.post('/auth/resend-otp', { email });
      setCountdown(60);
      setOtp('');
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal mengirim OTP. Coba lagi.');
    } finally {
      setResending(false);
    }
  };

  if (!email) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <Mail className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Verifikasi Email</h1>
          <p className="text-gray-600 mt-2">
            Masukkan kode OTP yang telah kami kirim ke
            <br />
            <span className="font-semibold">{email}</span>
          </p>
        </div>

        {/* Success State */}
        {success && (
          <div className="mb-6 flex flex-col items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <p className="text-sm font-semibold text-green-700">
              Email berhasil diverifikasi!
            </p>
            <p className="text-xs text-green-600">Mengarahkan ke login...</p>
          </div>
        )}

        {/* Error Alert */}
        {error && !success && (
          <div className="mb-6 flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleVerify} className="space-y-4 mb-6">
          <div>
            <label
              htmlFor="otp"
              className="block text-sm font-semibold text-gray-900 mb-2"
            >
              Kode OTP
            </label>
            <input
              id="otp"
              type="text"
              inputMode="numeric"
              maxLength="6"
              placeholder="000000"
              value={otp}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                setOtp(val);
              }}
              disabled={loading || success}
              className="w-full px-4 py-3 text-2xl text-center tracking-widest border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none font-mono disabled:bg-gray-100 disabled:cursor-not-allowed"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Masukkan 6 digit kode OTP yang Anda terima
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || success || otp.length !== 6}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Verifikasi...
              </>
            ) : success ? (
              <>
                <CheckCircle className="w-4 h-4" /> Terverifikasi
              </>
            ) : (
              'Verifikasi Email'
            )}
          </button>
        </form>

        {/* Resend OTP */}
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-3">
            {countdown > 0
              ? `Kirim ulang dalam ${countdown} detik`
              : "Belum terima kode OTP?"}
          </p>
          <button
            type="button"
            onClick={handleResend}
            disabled={countdown > 0 || resending || success}
            className="text-sm font-semibold text-green-600 hover:text-green-700 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            {resending ? 'Mengirim...' : 'Kirim Ulang OTP'}
          </button>
        </div>

        {/* Info Box */}
        <div className="mt-8 rounded-lg border border-blue-100 bg-blue-50 p-4">
          <p className="text-xs text-blue-800">
            <span className="font-semibold">Tip:</span> Periksa folder spam atau
            email promotions jika kode OTP tidak muncul di inbox utama.
          </p>
        </div>
      </div>
    </div>
  );
}
