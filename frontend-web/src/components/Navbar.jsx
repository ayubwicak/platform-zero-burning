import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Bell, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const roleLabels = {
  petani: 'Petani',
  petugas: 'Petugas Lapangan',
  admin: 'Administrator',
};

const portalLabels = {
  petani: 'Portal Petani',
  petugas: 'Portal Petugas',
  admin: 'Admin Panel',
};

export default function Navbar({ onToggle }) {
  const { user } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const initial = user?.nama?.trim()?.[0]?.toUpperCase() || '?';

  useEffect(() => {
    if (!notifOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setNotifOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [notifOpen]);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex h-full items-center justify-between px-4 lg:px-6">
        {/* Kiri atas: icon + nama sistem */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onToggle}
            className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-700 shadow-md shadow-green-200 sm:h-11 sm:w-11">
              <ShieldCheck className="h-5 w-5 text-white sm:h-6 sm:w-6" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-extrabold text-gray-900 tracking-tight sm:text-base lg:text-lg">
                Zero Burning
              </p>
              <p className="text-[10px] lg:text-[11px] font-semibold text-green-700 uppercase tracking-widest">
                {portalLabels[user?.role] || 'Platform Insentif'}
              </p>
            </div>
          </div>
        </div>

        {/* Kanan: notifikasi + profil */}
        <div className="flex items-center gap-1 sm:gap-2 lg:gap-4">
          <div className="relative">
            <button
              onClick={() => setNotifOpen((prev) => !prev)}
              className="relative p-2 text-gray-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
              aria-label="Notifikasi"
              aria-expanded={notifOpen}
              aria-haspopup="true"
            >
              <Bell className="w-5 h-5" />
            </button>

            {notifOpen && (
              <>
                <div
                  aria-hidden="true"
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={() => setNotifOpen(false)}
                />
                <div className="absolute right-0 top-12 z-50 w-72 rounded-2xl border border-gray-100 bg-white p-4 shadow-xl">
                  <p className="text-sm font-bold text-gray-900">Notifikasi</p>
                  <p className="mt-1 text-xs leading-relaxed text-gray-500">
                    Belum ada notifikasi baru. Aktivitas verifikasi dan klaim akan muncul di sini.
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="w-px h-8 bg-gray-200 hidden sm:block"></div>

          <Link
            to="/profil"
            className="flex items-center gap-2 rounded-xl px-1.5 py-1 -m-1.5 transition-colors hover:bg-green-50"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-green-700 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm">
              {initial}
            </div>
            <div className="hidden sm:block leading-tight">
              <p className="text-sm font-semibold text-gray-900">{user?.nama || 'Pengguna'}</p>
              <p className="text-xs text-gray-500">{roleLabels[user?.role] || 'Belum masuk'}</p>
            </div>
            <span className="sr-only">Buka profil</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
