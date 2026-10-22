import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  BadgeCheck,
  Briefcase,
  Building2,
  CalendarDays,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { formatDateTime } from '../lib/format';

const roleLabels = {
  petani: 'Petani',
  petugas: 'Petugas Lapangan',
  admin: 'Administrator',
};

const emptyPasswordForm = {
  current_password: '',
  new_password: '',
  confirm_password: '',
};

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="icon-tile w-8 h-8 bg-gray-50 text-gray-500 shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{label}</p>
        <p className="mt-0.5 break-words text-sm font-medium text-gray-800">{value || '-'}</p>
      </div>
    </div>
  );
}

function PasswordInput({ id, label, value, onChange, visible, onToggle, autoComplete }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-gray-700">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          className="input-field pr-11"
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          required
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          aria-label={visible ? 'Sembunyikan password' : 'Tampilkan password'}
        >
          {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

export default function Profil() {
  const { updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [form, setForm] = useState({
    nama: '',
    phone: '',
    address: '',
    position: '',
    unit: '',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordVisible, setPasswordVisible] = useState({
    current: false,
    next: false,
    confirm: false,
  });

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setLoadError('');

    try {
      const response = await api.get('/auth/me');
      const data = response.data.data;
      setProfile(data);
      setForm({
        nama: data.nama || '',
        phone: data.phone || '',
        address: data.address || '',
        position: data.position || '',
        unit: data.unit || '',
      });
    } catch (err) {
      setLoadError(err.response?.data?.error || 'Gagal memuat profil.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (!profileSuccess) return undefined;
    const timer = setTimeout(() => setProfileSuccess(''), 5000);
    return () => clearTimeout(timer);
  }, [profileSuccess]);

  useEffect(() => {
    if (!passwordSuccess) return undefined;
    const timer = setTimeout(() => setPasswordSuccess(''), 5000);
    return () => clearTimeout(timer);
  }, [passwordSuccess]);

  const updateForm = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const updatePasswordForm = (key, value) =>
    setPasswordForm((current) => ({ ...current, [key]: value }));
  const togglePassword = (key) =>
    setPasswordVisible((current) => ({ ...current, [key]: !current[key] }));

  async function handleProfileSubmit(event) {
    event.preventDefault();
    if (profileSaving) return;

    setProfileSaving(true);
    setProfileError('');
    setProfileSuccess('');

    try {
      const payload = { nama: form.nama.trim() };
      if (profile?.role === 'petani') {
        payload.phone = form.phone.trim();
        payload.address = form.address.trim();
      } else if (profile?.role === 'petugas') {
        payload.position = form.position.trim();
        payload.unit = form.unit.trim();
      }

      const response = await api.patch('/auth/profile', payload);
      const updated = response.data.data;
      setProfile(updated);
      setForm((current) => ({
        ...current,
        nama: updated.nama || '',
        phone: updated.phone || '',
        address: updated.address || '',
        position: updated.position || '',
        unit: updated.unit || '',
      }));
      updateUser({ nama: updated.nama });
      setProfileSuccess('Profil berhasil diperbarui.');
    } catch (err) {
      setProfileError(err.response?.data?.error || 'Gagal memperbarui profil.');
    } finally {
      setProfileSaving(false);
    }
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();
    if (passwordSaving) return;

    setPasswordError('');
    setPasswordSuccess('');

    if (passwordForm.new_password.length < 6) {
      setPasswordError('Password baru minimal 6 karakter.');
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError('Konfirmasi password baru tidak cocok.');
      return;
    }

    setPasswordSaving(true);

    try {
      await api.patch('/auth/password', {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      setPasswordForm(emptyPasswordForm);
      setPasswordVisible({ current: false, next: false, confirm: false });
      setPasswordSuccess('Password berhasil diubah.');
    } catch (err) {
      setPasswordError(err.response?.data?.error || 'Gagal mengubah password.');
    } finally {
      setPasswordSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Akun Saya"
        title="Profil & Keamanan"
        subtitle="Perbarui data akun dan jaga keamanan akses Anda ke platform."
      />

      {loading ? (
        <div className="mt-7 card flex flex-col items-center justify-center p-12 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin text-green-600" />
          <p className="mt-3 text-sm">Memuat profil...</p>
        </div>
      ) : loadError ? (
        <div className="mt-7 flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{loadError}</span>
          </div>
          <button onClick={loadProfile} className="btn-secondary">
            Coba lagi
          </button>
        </div>
      ) : profile ? (
        <div className="mt-7 grid grid-cols-1 gap-5 xl:grid-cols-3">
          <aside className="space-y-5 xl:col-span-1">
            <section className="card overflow-hidden">
              <div className="relative overflow-hidden bg-gradient-to-br from-green-700 to-emerald-700 px-6 pb-14 pt-6 text-white">
                <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10" />
                <div className="absolute -bottom-12 -left-6 h-28 w-28 rounded-full bg-white/10" />
                <div className="relative flex items-center gap-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-xl font-extrabold backdrop-blur-sm ring-1 ring-white/20">
                    {profile.nama?.trim()?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-bold">{profile.nama}</h2>
                    <p className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-green-100">
                      {roleLabels[profile.role] || profile.role}
                    </p>
                  </div>
                </div>
              </div>

              <div className="-mt-8 px-6 pb-6">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-green-700 shadow-sm ring-1 ring-green-100">
                  <ShieldCheck className="h-3.5 w-3.5" /> Akun aktif
                </div>

                <div className="mt-5 space-y-4">
                  <InfoRow icon={Mail} label="Email" value={profile.email} />
                  {profile.role === 'petani' && (
                    <>
                      <InfoRow icon={BadgeCheck} label="NIK" value={profile.nik} />
                      <InfoRow icon={Phone} label="Telepon" value={profile.phone} />
                      <InfoRow icon={MapPin} label="Alamat" value={profile.address} />
                    </>
                  )}
                  {profile.role === 'petugas' && (
                    <>
                      <InfoRow icon={BadgeCheck} label="NIP" value={profile.nip} />
                      <InfoRow icon={Briefcase} label="Jabatan" value={profile.position} />
                      <InfoRow icon={Building2} label="Unit kerja" value={profile.unit} />
                    </>
                  )}
                  <InfoRow
                    icon={CalendarDays}
                    label="Bergabung sejak"
                    value={formatDateTime(profile.created_at)}
                  />
                </div>
              </div>
            </section>

            <div className="rounded-2xl border border-green-100 bg-green-50/70 p-4 text-xs leading-relaxed text-green-800">
              <p className="font-semibold">Catatan keamanan</p>
              <p className="mt-1">
                Gunakan password yang kuat dan tidak dipakai di layanan lain. Jika Anda menduga akun
                pernah diakses orang lain, segera ubah password.
              </p>
            </div>
          </aside>

          <div className="space-y-5 xl:col-span-2">
            <section className="card p-6">
              <div className="flex items-start gap-3">
                <div className="icon-tile h-10 w-10 shrink-0 bg-green-100 text-green-700">
                  <UserRound className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Data Profil</h2>
                  <p className="mt-0.5 text-sm text-gray-500">
                    Perbarui informasi yang digunakan pada seluruh aktivitas platform.
                  </p>
                </div>
              </div>

              <form onSubmit={handleProfileSubmit} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="profile-nama" className="mb-1.5 block text-sm font-semibold text-gray-700">
                    Nama lengkap
                  </label>
                  <input
                    id="profile-nama"
                    className="input-field"
                    value={form.nama}
                    onChange={(event) => updateForm('nama', event.target.value)}
                    maxLength={100}
                    autoComplete="name"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="profile-email" className="mb-1.5 block text-sm font-semibold text-gray-700">
                    Email
                  </label>
                  <input
                    id="profile-email"
                    className="input-field bg-gray-50 text-gray-600"
                    value={profile.email}
                    readOnly
                    disabled
                  />
                  <p className="mt-1.5 text-[11px] text-gray-500">
                    Email, NIK/NIP, dan role hanya dapat diubah oleh administrator.
                  </p>
                </div>

                {profile.role === 'petani' && (
                  <>
                    <div>
                      <label htmlFor="profile-phone" className="mb-1.5 block text-sm font-semibold text-gray-700">
                        Nomor telepon
                      </label>
                      <input
                        id="profile-phone"
                        className="input-field"
                        type="tel"
                        value={form.phone}
                        onChange={(event) => updateForm('phone', event.target.value)}
                        maxLength={20}
                        placeholder="Contoh: 08123456789"
                        autoComplete="tel"
                      />
                    </div>
                    <div>
                      <label htmlFor="profile-address" className="mb-1.5 block text-sm font-semibold text-gray-700">
                        Alamat
                      </label>
                      <textarea
                        id="profile-address"
                        className="input-field min-h-[92px] resize-y"
                        value={form.address}
                        onChange={(event) => updateForm('address', event.target.value)}
                        maxLength={500}
                        placeholder="Alamat tempat tinggal atau lahan"
                        autoComplete="street-address"
                      />
                    </div>
                  </>
                )}

                {profile.role === 'petugas' && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="profile-position" className="mb-1.5 block text-sm font-semibold text-gray-700">
                        Jabatan
                      </label>
                      <input
                        id="profile-position"
                        className="input-field"
                        value={form.position}
                        onChange={(event) => updateForm('position', event.target.value)}
                        maxLength={50}
                        placeholder="Contoh: Penyuluh Pertanian"
                      />
                    </div>
                    <div>
                      <label htmlFor="profile-unit" className="mb-1.5 block text-sm font-semibold text-gray-700">
                        Unit kerja
                      </label>
                      <input
                        id="profile-unit"
                        className="input-field"
                        value={form.unit}
                        onChange={(event) => updateForm('unit', event.target.value)}
                        maxLength={100}
                        placeholder="Contoh: Dinas Pertanian"
                      />
                    </div>
                  </div>
                )}

                {profileError && (
                  <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{profileError}</span>
                  </div>
                )}
                {profileSuccess && (
                  <div role="status" className="flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 px-3.5 py-2.5 text-xs text-green-800">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{profileSuccess}</span>
                  </div>
                )}

                <div className="flex justify-end border-t border-gray-100 pt-4">
                  <button type="submit" className="btn-primary" disabled={profileSaving}>
                    {profileSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {profileSaving ? 'Menyimpan...' : 'Simpan Profil'}
                  </button>
                </div>
              </form>
            </section>

            <section className="card p-6">
              <div className="flex items-start gap-3">
                <div className="icon-tile h-10 w-10 shrink-0 bg-amber-100 text-amber-700">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Ubah Password</h2>
                  <p className="mt-0.5 text-sm text-gray-500">
                    Gunakan minimal 6 karakter. Password lama tetap berlaku hingga perubahan disimpan.
                  </p>
                </div>
              </div>

              <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-4">
                <PasswordInput
                  id="current-password"
                  label="Password saat ini"
                  value={passwordForm.current_password}
                  onChange={(event) => updatePasswordForm('current_password', event.target.value)}
                  visible={passwordVisible.current}
                  onToggle={() => togglePassword('current')}
                  autoComplete="current-password"
                />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <PasswordInput
                    id="new-password"
                    label="Password baru"
                    value={passwordForm.new_password}
                    onChange={(event) => updatePasswordForm('new_password', event.target.value)}
                    visible={passwordVisible.next}
                    onToggle={() => togglePassword('next')}
                    autoComplete="new-password"
                  />
                  <PasswordInput
                    id="confirm-password"
                    label="Konfirmasi password baru"
                    value={passwordForm.confirm_password}
                    onChange={(event) => updatePasswordForm('confirm_password', event.target.value)}
                    visible={passwordVisible.confirm}
                    onToggle={() => togglePassword('confirm')}
                    autoComplete="new-password"
                  />
                </div>

                {passwordError && (
                  <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}
                {passwordSuccess && (
                  <div role="status" className="flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 px-3.5 py-2.5 text-xs text-green-800">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{passwordSuccess}</span>
                  </div>
                )}

                <div className="flex justify-end border-t border-gray-100 pt-4">
                  <button type="submit" className="btn-primary" disabled={passwordSaving}>
                    {passwordSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <KeyRound className="h-4 w-4" />
                    )}
                    {passwordSaving ? 'Menyimpan...' : 'Ubah Password'}
                  </button>
                </div>
              </form>
            </section>
          </div>
        </div>
      ) : null}
    </div>
  );
}
