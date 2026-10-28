import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  Bell,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Check,
  Loader2,
  AlertCircle,
  Inbox,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

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

function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);

  if (diffSec < 60) return 'Baru saja';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} mnt lalu`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} jam lalu`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay} hari lalu`;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

function getNotificationIcon(type) {
  if (type?.includes('approved') || type?.includes('verified')) {
    return <CheckCircle2 className="w-4 h-4 text-primary" />;
  }
  if (type?.includes('rejected') || type?.includes('cancelled')) {
    return <XCircle className="w-4 h-4 text-destructive" />;
  }
  if (type?.includes('auto')) {
    return <Sparkles className="w-4 h-4 text-amber-500" />;
  }
  return <Bell className="w-4 h-4 text-muted-foreground" />;
}

export default function Navbar({ onToggle }) {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const dropdownRef = useRef(null);

  const initial = user?.nama?.trim()?.[0]?.toUpperCase() || '?';

  // 1. Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!token || !user) return;
    try {
      const res = await api.get('/notifications/unread-count');
      setUnreadCount(Number(res.data.count) || 0);
    } catch (_err) {
      // Abaikan error saat polling di background
    }
  }, [token, user]);

  // 2. Fetch notification list
  const fetchNotifications = useCallback(async () => {
    if (!token || !user) return;
    setLoadingList(true);
    try {
      const res = await api.get('/notifications?limit=20');
      setNotifications(res.data.data || []);
    } catch (_err) {
      // Silent fail
    } finally {
      setLoadingList(false);
    }
  }, [token, user]);

  // 3. Polling unread count dengan page visibility check
  useEffect(() => {
    if (!token || !user) return undefined;

    fetchUnreadCount();

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchUnreadCount();
      }
    }, 35000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchUnreadCount();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchUnreadCount, token, user]);

  // 4. Muat daftar saat dropdown dibuka
  useEffect(() => {
    if (notifOpen) {
      fetchNotifications();
    }
  }, [notifOpen, fetchNotifications]);

  // 5. Tutup dropdown dengan Escape atau click outside
  useEffect(() => {
    if (!notifOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setNotifOpen(false);
    };

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [notifOpen]);

  // 6. Action: Tandai satu notifikasi sebagai sudah dibaca
  const handleMarkAsRead = async (notif, e) => {
    if (e) e.stopPropagation();
    if (notif.read_at) return;

    try {
      await api.patch(`/notifications/${notif.id}/read`);
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notif.id ? { ...item, read_at: new Date().toISOString() } : item
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (_err) {
      // Error handling
    }
  };

  // 7. Action: Tandai semua sebagai sudah dibaca
  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0 || actionLoading) return;
    setActionLoading(true);
    try {
      await api.post('/notifications/read-all');
      setNotifications((prev) =>
        prev.map((item) => ({ ...item, read_at: item.read_at || new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (_err) {
      // Error handling
    } finally {
      setActionLoading(false);
    }
  };

  // 8. Klik notifikasi untuk navigasi cerdas
  const handleNotificationClick = async (notif) => {
    await handleMarkAsRead(notif);
    setNotifOpen(false);

    const type = notif.type || '';
    if (type.startsWith('claim.')) {
      if (user?.role === 'petani') {
        navigate('/klaim');
      } else {
        navigate('/distribusi');
      }
    } else if (type.startsWith('photo.')) {
      if (user?.role === 'petani') {
        navigate('/lahan');
      } else {
        navigate('/verifikasi');
      }
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-[var(--header-h,4rem)] bg-card/95 backdrop-blur border-b border-border shadow-xs">
      <div className="flex h-full items-center justify-between px-4 lg:px-6">
        {/* Kiri atas: branding Zero Burning */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onToggle}
            className="lg:hidden p-2 min-h-[40px] min-w-[40px] flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
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
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setNotifOpen((prev) => !prev)}
              className="relative p-2 min-h-[40px] min-w-[40px] flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
              aria-label={`Notifikasi${unreadCount > 0 ? ` (${unreadCount} belum dibaca)` : ''}`}
              aria-expanded={notifOpen}
              aria-haspopup="true"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white shadow-xs">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div
                role="region"
                aria-label="Daftar Notifikasi"
                className="absolute right-0 top-12 z-50 w-80 sm:w-96 rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-fade-down"
              >
                {/* Header panel */}
                <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-muted/30">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">Notifikasi</span>
                    {unreadCount > 0 && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                        {unreadCount} baru
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllAsRead}
                      disabled={actionLoading}
                      className="text-xs font-semibold text-primary hover:underline disabled:opacity-50"
                    >
                      Tandai semua dibaca
                    </button>
                  )}
                </div>

                {/* Notification list */}
                <div className="max-h-[65vh] overflow-y-auto divide-y divide-border">
                  {loadingList ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      <p className="mt-2 text-xs">Memuat notifikasi...</p>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                      <div className="icon-tile w-10 h-10 bg-muted text-muted-foreground mb-2">
                        <Inbox className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-semibold text-foreground">Belum ada notifikasi</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 max-w-[220px]">
                        Aktivitas verifikasi lahan dan distribusi klaim akan muncul di sini.
                      </p>
                    </div>
                  ) : (
                    notifications.map((notif) => {
                      const isUnread = !notif.read_at;

                      return (
                        <div
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          className={`flex items-start gap-3 p-3.5 transition-colors cursor-pointer hover:bg-muted/50 ${
                            isUnread ? 'bg-primary/5' : 'bg-transparent'
                          }`}
                        >
                          <div className="mt-0.5 shrink-0 rounded-full bg-card p-1.5 shadow-xs border border-border">
                            {getNotificationIcon(notif.type)}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <p
                                className={`text-xs truncate ${
                                  isUnread ? 'font-bold text-foreground' : 'font-medium text-foreground'
                                }`}
                              >
                                {notif.title}
                              </p>
                              <span className="text-[10px] text-muted-foreground shrink-0">
                                {formatRelativeTime(notif.created_at)}
                              </span>
                            </div>
                            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                              {notif.message}
                            </p>
                          </div>

                          {isUnread && (
                            <button
                              type="button"
                              onClick={(e) => handleMarkAsRead(notif, e)}
                              className="mt-1 shrink-0 p-1 rounded-full text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                              title="Tandai dibaca"
                              aria-label="Tandai dibaca"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="w-px h-7 bg-border hidden sm:block"></div>

          <Link
            to="/profil"
            className="flex items-center gap-2.5 min-h-[40px] rounded-full px-2 py-1 transition-colors hover:bg-muted/80"
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
