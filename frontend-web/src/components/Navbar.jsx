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
    <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-card/95 backdrop-blur border-b border-border shadow-xs">
      <div className="flex h-full items-center justify-between px-4 lg:px-6">
        {/* Kiri atas: branding Zero Burning */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onToggle}
            className="lg:hidden p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link to="/dashboard" className="flex items-center gap-2.5 sm:gap-3">
            <span className="grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-full bg-primary font-display text-lg text-primary-foreground shadow-sm">
              Z
            </span>
            <div className="leading-tight">
              <p className="font-display text-base sm:text-lg font-bold tracking-tight text-foreground">
                Zero Burning
              </p>
              <p className="text-[10px] sm:text-[11px] font-bold text-primary uppercase tracking-widest">
                {portalLabels[user?.role] || 'PORTAL INSENTIF'}
              </p>
            </div>
          </Link>
        </div>

        {/* Kanan: notifikasi + profil */}
        <div className="flex items-center gap-1 sm:gap-2 lg:gap-3">
          <div className="relative">
            <button
              onClick={() => setNotifOpen((prev) => !prev)}
              className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
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
                <div className="absolute right-0 top-12 z-50 w-72 rounded-2xl border border-border bg-card p-4 shadow-xl">
                  <p className="text-sm font-bold text-foreground">Notifikasi</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Belum ada notifikasi baru. Aktivitas verifikasi dan klaim akan muncul di sini.
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="w-px h-7 bg-border hidden sm:block"></div>

          <Link
            to="/profil"
            className="flex items-center gap-2.5 rounded-full px-2 py-1 transition-colors hover:bg-muted/80"
          >
            <div className="w-9 h-9 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-display text-sm font-bold shadow-xs">
              {initial}
            </div>
            <div className="hidden sm:block leading-tight">
              <p className="text-sm font-semibold text-foreground">{user?.nama || 'Pengguna'}</p>
              <p className="text-xs text-muted-foreground">{roleLabels[user?.role] || 'Belum masuk'}</p>
            </div>
            <span className="sr-only">Buka profil</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
