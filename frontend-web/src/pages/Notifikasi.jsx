import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  XCircle,
  Sparkles,
  Check,
  Loader2,
  Inbox,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import PageHeader from '../components/PageHeader';

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

function formatExactDateTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getNotificationGroup(dateString) {
  if (!dateString) return 'Lebih lama';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'Lebih lama';

  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();
  if (isToday) return 'Hari ini';

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();
  if (isYesterday) return 'Kemarin';

  return 'Lebih lama';
}

function getNotificationIcon(type) {
  if (type?.includes('approved') || type?.includes('verified')) {
    return <CheckCircle2 className="w-5 h-5 text-primary" />;
  }
  if (type?.includes('rejected') || type?.includes('cancelled')) {
    return <XCircle className="w-5 h-5 text-destructive" />;
  }
  if (type?.includes('auto')) {
    return <Sparkles className="w-5 h-5 text-amber-500" />;
  }
  return <Bell className="w-5 h-5 text-muted-foreground" />;
}

function parseNotification(notif) {
  let data = {};
  if (notif.data) {
    try {
      data = typeof notif.data === 'string' ? JSON.parse(notif.data) : notif.data;
    } catch (_) {
      data = {};
    }
  }

  let reason = data.reason || null;
  let cleanMessage = notif.message || '';

  if (!reason && cleanMessage.includes('Alasan: ')) {
    const parts = cleanMessage.split('Alasan: ');
    reason = parts[1]?.trim() || null;
  }

  if (reason && cleanMessage.includes('Alasan: ')) {
    cleanMessage = cleanMessage.split('. Alasan: ')[0].split('Alasan: ')[0].trim();
    if (cleanMessage.endsWith('.')) cleanMessage = cleanMessage.slice(0, -1);
  }

  return {
    ...notif,
    data,
    reason,
    cleanMessage,
    claimId: data.claim_id || null,
    photoId: data.photo_id || null,
  };
}

export default function Notifikasi() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 15, total_pages: 1 });
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      setUnreadCount(Number(res.data.count) || 0);
    } catch (_) {}
  }, []);

  const loadNotifications = useCallback(async (targetPage = 1, unreadOnly = false) => {
    setLoading(true);
    try {
      const res = await api.get('/notifications', {
        params: {
          page: targetPage,
          limit: 15,
          unread: unreadOnly ? 'true' : undefined,
        },
      });
      setNotifications(res.data.data || []);
      if (res.data.pagination) {
        setPagination(res.data.pagination);
      }
    } catch (_) {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  useEffect(() => {
    loadNotifications(page, filterUnreadOnly);
  }, [page, filterUnreadOnly, loadNotifications]);

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
    } catch (_) {}
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0 || actionLoading) return;
    setActionLoading(true);
    try {
      await api.post('/notifications/read-all');
      setNotifications((prev) =>
        prev.map((item) => ({ ...item, read_at: item.read_at || new Date().toISOString() }))
      );
      setUnreadCount(0);
      if (filterUnreadOnly) {
        setPage(1);
        loadNotifications(1, true);
      }
    } catch (_) {
    } finally {
      setActionLoading(false);
    }
  };

  const handleNavigate = (notif) => {
    const type = notif.type || '';
    if (type.startsWith('claim.')) {
      if (user?.role === 'petani') {
        navigate('/klaim');
      } else {
        navigate('/distribusi');
      }
    } else if (type.startsWith('photo.')) {
      if (user?.role === 'petani') {
        navigate('/fields');
      } else {
        navigate('/verifikasi');
      }
    }
  };

  // Group notifications
  const groupedItems = {
    'Hari ini': [],
    'Kemarin': [],
    'Lebih lama': [],
  };

  for (const notif of notifications) {
    const group = getNotificationGroup(notif.created_at);
    if (groupedItems[group]) {
      groupedItems[group].push(notif);
    } else {
      groupedItems['Lebih lama'].push(notif);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Pusat Pemberitahuan"
        title="Notifikasi"
        subtitle="Pantau riwayat pembaruan status lahan, verifikasi warga, dan status distribusi insentif Anda."
      >
        <div className="flex flex-wrap items-center gap-2">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              disabled={actionLoading}
              className="btn-secondary text-xs"
            >
              <Check className="w-4 h-4" />
              <span>Tandai Semua Dibaca</span>
            </button>
          )}
        </div>
      </PageHeader>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setFilterUnreadOnly(false);
              setPage(1);
            }}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-colors ${
              !filterUnreadOnly
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            Semua
          </button>
          <button
            type="button"
            onClick={() => {
              setFilterUnreadOnly(true);
              setPage(1);
            }}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full transition-colors ${
              filterUnreadOnly
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <span>Belum dibaca</span>
            {unreadCount > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  filterUnreadOnly
                    ? 'bg-white text-primary'
                    : 'bg-primary/10 text-primary'
                }`}
              >
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        <span className="text-xs text-muted-foreground hidden sm:inline">
          Total: {pagination.total} notifikasi
        </span>
      </div>

      {/* Notification List */}
      {loading ? (
        <div className="card p-12 flex flex-col items-center justify-center text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="mt-3 text-sm">Memuat notifikasi...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="card p-12 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-3">
            <Inbox className="w-6 h-6" />
          </div>
          <p className="text-base font-semibold text-foreground">
            {filterUnreadOnly ? 'Tidak ada notifikasi belum dibaca' : 'Belum ada notifikasi'}
          </p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            {filterUnreadOnly
              ? 'Seluruh notifikasi Anda telah ditandai sudah dibaca.'
              : 'Aktivitas verifikasi lahan dan penyaluran klaim insentif akan muncul di sini.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {['Hari ini', 'Kemarin', 'Lebih lama'].map((groupName) => {
            const items = groupedItems[groupName];
            if (!items || items.length === 0) return null;

            return (
              <div key={groupName} className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {groupName}
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <div className="space-y-2.5">
                  {items.map((notif) => {
                    const parsed = parseNotification(notif);
                    const isUnread = !notif.read_at;

                    return (
                      <article
                        key={notif.id}
                        onClick={() => {
                          if (isUnread) handleMarkAsRead(notif);
                        }}
                        className={`card p-4 sm:p-5 transition-all cursor-pointer ${
                          isUnread
                            ? 'bg-primary/5 border-emerald-500/40 shadow-xs'
                            : 'bg-card hover:bg-muted/30 border-border'
                        }`}
                      >
                        <div className="flex items-start gap-3 sm:gap-4">
                          {/* Dot & Icon */}
                          <div className="flex items-center gap-2 pt-0.5">
                            {isUnread ? (
                              <span
                                className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0"
                                title="Belum dibaca"
                                aria-label="Belum dibaca"
                              />
                            ) : (
                              <span className="w-2.5 shrink-0" aria-hidden="true" />
                            )}
                            <div className="rounded-xl bg-card p-2 border border-border shadow-xs">
                              {getNotificationIcon(notif.type)}
                            </div>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <h3
                                  className={`text-sm ${
                                    isUnread
                                      ? 'font-semibold text-foreground'
                                      : 'font-medium text-muted-foreground'
                                  }`}
                                >
                                  {notif.title}
                                </h3>
                                {parsed.claimId && (
                                  <span className="text-[11px] font-mono rounded bg-muted px-1.5 py-0.5 text-muted-foreground">
                                    #{parsed.claimId}
                                  </span>
                                )}
                              </div>

                              <span
                                title={formatExactDateTime(notif.created_at)}
                                className="text-xs text-muted-foreground cursor-help"
                              >
                                {formatRelativeTime(notif.created_at)}
                              </span>
                            </div>

                            {/* Full Clean Message */}
                            <p
                              className={`mt-1.5 text-xs sm:text-sm leading-relaxed ${
                                isUnread ? 'text-foreground/90' : 'text-muted-foreground'
                              }`}
                            >
                              {parsed.cleanMessage}
                            </p>

                            {/* Rejection/Cancellation Reason Block */}
                            {parsed.reason && (
                              <div className="mt-2.5 rounded-lg bg-muted/60 p-3 text-xs sm:text-sm text-muted-foreground border-l-3 border-destructive/60">
                                <span className="font-semibold text-foreground/80">Alasan: </span>
                                <span>{parsed.reason}</span>
                              </div>
                            )}

                            {/* Action Link */}
                            <div className="mt-3 flex items-center justify-between pt-2 border-t border-border/50">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleNavigate(notif);
                                }}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                              >
                                <span>Buka halaman terkait</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>

                              {isUnread ? (
                                <button
                                  type="button"
                                  onClick={(e) => handleMarkAsRead(notif, e)}
                                  className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded hover:bg-primary/10"
                                  title="Tandai dibaca"
                                  aria-label="Tandai dibaca"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Tandai dibaca</span>
                                </button>
                              ) : (
                                <span className="text-[11px] font-medium text-muted-foreground/60 px-2 py-0.5 rounded bg-muted/60 select-none">
                                  Dibaca
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Pagination Controls */}
          {pagination.total_pages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <span className="text-xs text-muted-foreground">
                Halaman {pagination.page} dari {pagination.total_pages}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={pagination.page <= 1}
                  className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40"
                  aria-label="Halaman sebelumnya"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Sebelumnya</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(pagination.total_pages, p + 1))}
                  disabled={pagination.page >= pagination.total_pages}
                  className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40"
                  aria-label="Halaman selanjutnya"
                >
                  <span>Selanjutnya</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
