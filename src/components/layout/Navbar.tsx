'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import {
  clearAuthSession,
  getApiBaseUrl,
  getAuthToken,
  getAuthUser,
} from '../../lib/auth';
import { fetchApiJson } from '../../lib/api';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/symptoms', label: 'Symptoms' },
  { href: '/recommendations', label: 'Recommendations' },
  { href: '/scanner', label: 'Prescription Scanner' },
  { href: '/medical-history', label: 'Medical History' },
];

type NotificationPriority = 'critical' | 'important' | 'info';

type NotificationItem = {
  id: number;
  type: string;
  priority: NotificationPriority;
  title: string;
  message: string;
  deep_link?: string | null;
  is_read: number;
  created_at: string;
  delivered_at?: string | null;
};

type NotificationListPayload = {
  success?: boolean;
  data?: NotificationItem[];
  message?: string;
};

type NotificationUnreadPayload = {
  success?: boolean;
  data?: {
    unreadCount: number;
  };
  message?: string;
};

function formatRelativeTime(value: string) {
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return 'just now';
  const diffMs = Date.now() - dt.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const menuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const emergencyAudioRef = useRef<HTMLAudioElement | null>(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showEmergencyAlert, setShowEmergencyAlert] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState('Account');

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationFilter, setNotificationFilter] = useState<
    'all' | NotificationPriority
  >('all');
  const [notificationTypeFilter, setNotificationTypeFilter] = useState<
    'all' | 'scan_ready' | 'followup_check' | 'emergency_event' | 'profile_incomplete'
  >('all');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationLoading, setIsNotificationLoading] = useState(false);
  const [notificationError, setNotificationError] = useState('');

  const stopEmergencyAlertTone = () => {
    if (!emergencyAudioRef.current) return;
    emergencyAudioRef.current.pause();
    emergencyAudioRef.current.currentTime = 0;
  };

  const startEmergencyAlertTone = async () => {
    if (typeof window === 'undefined') return;
    if (!emergencyAudioRef.current) {
      emergencyAudioRef.current = new Audio('/audio/emergency-alarm.mp3');
      emergencyAudioRef.current.loop = true;
      emergencyAudioRef.current.preload = 'auto';
    }
    try {
      await emergencyAudioRef.current.play();
    } catch {
      // Browser autoplay policy can block this.
    }
  };

  const activeHref = useMemo(() => {
    if (pathname === '/') return '/';
    const matched = navItems.find(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
    );
    return matched?.href ?? '/';
  }, [pathname]);

  const orderedNotifications = useMemo(() => {
    const rank: Record<NotificationPriority, number> = {
      critical: 0,
      important: 1,
      info: 2,
    };
    return [...notifications].sort((a, b) => {
      if (rank[a.priority] !== rank[b.priority]) {
        return rank[a.priority] - rank[b.priority];
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [notifications]);

  useEffect(() => {
    const token = getAuthToken();
    const user = getAuthUser<{ name?: string }>();
    setIsAuthenticated(Boolean(token));
    setUserName(user?.name || 'Account');
  }, [pathname]);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      stopEmergencyAlertTone();
    };
  }, []);

  const loadUnreadCount = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setUnreadCount(0);
      return;
    }
    try {
      const result = await fetchApiJson<NotificationUnreadPayload>(
        '/notifications/unread-count',
        { token }
      );
      if (result.response.ok && result.payload?.success) {
        setUnreadCount(Number(result.payload.data?.unreadCount || 0));
      }
    } catch {
      // Keep UI non-blocking.
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setIsNotificationLoading(true);
    setNotificationError('');

    try {
      const queryParts = ['limit=30'];
      if (notificationFilter !== 'all') {
        queryParts.push(`priority=${notificationFilter}`);
      }
      if (notificationTypeFilter !== 'all') {
        queryParts.push(`type=${notificationTypeFilter}`);
      }
      const query = `?${queryParts.join('&')}`;
      const result = await fetchApiJson<NotificationListPayload>(
        `/notifications${query}`,
        { token }
      );

      if (!result.response.ok || !result.payload?.success) {
        throw new Error(result.payload?.message || 'Unable to load notifications');
      }

      setNotifications(Array.isArray(result.payload.data) ? result.payload.data : []);
      await loadUnreadCount();
    } catch (error) {
      setNotificationError(
        error instanceof Error ? error.message : 'Unable to load notifications'
      );
    } finally {
      setIsNotificationLoading(false);
    }
  }, [loadUnreadCount, notificationFilter, notificationTypeFilter]);

  useEffect(() => {
    if (!isAuthenticated) return;
    void loadUnreadCount();
  }, [isAuthenticated, pathname, loadUnreadCount]);

  useEffect(() => {
    if (!notificationsOpen) return;
    void loadNotifications();
  }, [notificationsOpen, loadNotifications]);

  const handleLogout = async () => {
    const token = getAuthToken();
    try {
      if (token) {
        await fetch(`${getApiBaseUrl()}/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
        });
      }
    } finally {
      clearAuthSession();
      setMenuOpen(false);
      setMobileNavOpen(false);
      setNotificationsOpen(false);
      setIsAuthenticated(false);
      router.push('/login');
    }
  };

  const handleMarkRead = async (id: number) => {
    const token = getAuthToken();
    if (!token) return;
    try {
      const result = await fetchApiJson('/notifications/' + id + '/read', {
        token,
        method: 'PATCH',
      });
      if (!result.response.ok) return;
      setNotifications((prev) =>
        prev.map((item) => (item.id === id ? { ...item, is_read: 1 } : item))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Silent fallback.
    }
  };

  const handleMarkAllRead = async () => {
    const token = getAuthToken();
    if (!token) return;
    try {
      const result = await fetchApiJson('/notifications/read-all', {
        token,
        method: 'PATCH',
      });
      if (!result.response.ok) return;
      setNotifications((prev) => prev.map((item) => ({ ...item, is_read: 1 })));
      setUnreadCount(0);
    } catch {
      // Silent fallback.
    }
  };

  const handleHide = async (item: NotificationItem) => {
    if (item.priority === 'critical') return;
    const token = getAuthToken();
    if (!token) return;
    try {
      const result = await fetchApiJson('/notifications/' + item.id + '/hide', {
        token,
        method: 'PATCH',
      });
      if (!result.response.ok) return;
      setNotifications((prev) => prev.filter((notification) => notification.id !== item.id));
    } catch {
      // Silent fallback.
    }
  };

  const handleOpenNotification = async (item: NotificationItem) => {
    if (!item.is_read) {
      await handleMarkRead(item.id);
    }
    setNotificationsOpen(false);
    if (item.deep_link) {
      router.push(item.deep_link);
      return;
    }
    if (item.type === 'scan_ready') {
      router.push('/scanner');
      return;
    }
    if (item.type === 'followup_check') {
      router.push('/symptoms');
      return;
    }
    router.push('/profile');
  };

  const triggerEmergencyNotifications = async () => {
    const token = getAuthToken();
    if (!token) return;

    const sendWithLocation = async (location: {
      lat: number | null;
      lng: number | null;
      accuracy: number | null;
    }) => {
      await fetchApiJson('/notifications/emergency-trigger', {
        token,
        method: 'POST',
        body: location,
      });
    };

    if (!navigator.geolocation) {
      await sendWithLocation({ lat: null, lng: null, accuracy: null });
      return;
    }

    await new Promise<void>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            await sendWithLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy,
            });
          } finally {
            resolve();
          }
        },
        async () => {
          try {
            await sendWithLocation({ lat: null, lng: null, accuracy: null });
          } finally {
            resolve();
          }
        },
        { enableHighAccuracy: true, timeout: 7000, maximumAge: 0 }
      );
    });
  };

  const getPriorityPill = (priority: NotificationPriority) => {
    if (priority === 'critical') {
      return 'bg-error/20 text-error border border-error/40';
    }
    if (priority === 'important') {
      return 'bg-amber-100 text-amber-800 border border-amber-300';
    }
    return 'bg-blue-100 text-blue-700 border border-blue-200';
  };

  return (
    <>
      <header className="fixed top-0 w-full z-50 bg-black backdrop-blur-xl shadow-ambient">
        <nav className="h-20 max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-full flex items-center gap-2 lg:gap-8">
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={() => setMobileNavOpen((prev) => !prev)}
                className="md:hidden inline-flex items-center justify-center p-2 rounded-xl hover:bg-surface-container-high transition-transform active:scale-95 shrink-0"
                aria-label="Open navigation menu"
              >
                <Icon name={mobileNavOpen ? 'close' : 'menu'} className="h-6 w-6 text-white" />
              </button>
              <Link
                href="/"
                className="inline-flex items-center text-xl font-black font-display tracking-wide shrink-0"
                style={{ color: '#FFFFFF' }}
              >
                SALVEXA
              </Link>
            </div>

            <div className="hidden md:flex flex-1 relative z-20 items-center justify-center gap-4 lg:gap-7 text-sm lg:text-base min-w-0">
              {navItems.map((item) => {
                const isActive = activeHref === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative pb-1 px-1 font-display tracking-tight font-semibold whitespace-nowrap shrink-0 transition-colors duration-300 ${
                      isActive ? 'text-white' : 'text-white/75 hover:text-white'
                    }`}
                  >
                    {item.label}
                    <span
                      aria-hidden="true"
                      className={`absolute left-0 -bottom-1 h-0.5 rounded-full bg-white transition-all duration-300 ease-out ${
                        isActive ? 'w-full opacity-100' : 'w-0 opacity-0'
                      }`}
                    />
                  </Link>
                );
              })}
            </div>

            <div className="relative z-10 flex items-center justify-end gap-2 sm:gap-3 flex-1 md:flex-none">
              <div className="hidden lg:block relative" ref={notificationRef}>
                <button
                  type="button"
                  onClick={() => setNotificationsOpen((prev) => !prev)}
                  className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl hover:bg-surface-container-high transition-transform active:scale-95 whitespace-nowrap"
                  aria-label="Open notifications"
                >
                  <Icon name="notifications" className="h-5 w-5 text-white" />
                  {unreadCount > 0 ? (
                    <span className="inline-flex min-w-5 h-5 px-1 items-center justify-center rounded-full bg-error text-white text-[11px] font-bold">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  ) : null}
                </button>

                {notificationsOpen ? (
                  <div className="absolute right-0 mt-2 w-[360px] rounded-2xl border border-outline-variant/25 bg-surface-container-lowest shadow-2xl overflow-hidden z-[90]">
                    <div className="px-4 py-3 border-b border-outline-variant/20 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-on-surface">Notifications</p>
                        <p className="text-xs text-on-surface-variant">
                          {unreadCount} unread
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        className="text-xs font-bold text-primary hover:underline"
                      >
                        Mark all read
                      </button>
                    </div>

                    <div className="px-3 py-2 border-b border-outline-variant/20 flex items-center gap-2">
                      {(['all', 'critical', 'important', 'info'] as const).map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setNotificationFilter(item)}
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                            notificationFilter === item
                              ? 'bg-primary text-white'
                              : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                          }`}
                        >
                          {item === 'all'
                            ? 'All'
                            : item[0].toUpperCase() + item.slice(1)}
                        </button>
                      ))}
                    </div>
                    <div className="px-3 py-2 border-b border-outline-variant/20">
                      <select
                        value={notificationTypeFilter}
                        onChange={(event) =>
                          setNotificationTypeFilter(
                            event.target.value as
                              | 'all'
                              | 'scan_ready'
                              | 'followup_check'
                              | 'emergency_event'
                              | 'profile_incomplete'
                          )
                        }
                        className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-low px-2.5 py-2 text-xs text-on-surface"
                      >
                        <option value="all">All Types</option>
                        <option value="scan_ready">Scan Results</option>
                        <option value="followup_check">Follow-up</option>
                        <option value="emergency_event">Emergency</option>
                        <option value="profile_incomplete">Profile Alerts</option>
                      </select>
                    </div>

                    <div className="max-h-[420px] overflow-y-auto">
                      {isNotificationLoading ? (
                        <div className="p-4 text-sm text-on-surface-variant">
                          Loading notifications...
                        </div>
                      ) : null}

                      {!isNotificationLoading && notificationError ? (
                        <div className="p-4 text-sm text-error">{notificationError}</div>
                      ) : null}

                      {!isNotificationLoading &&
                      !notificationError &&
                      orderedNotifications.length === 0 ? (
                        <div className="p-4 text-sm text-on-surface-variant">
                          No notifications yet.
                        </div>
                      ) : null}

                      {!isNotificationLoading &&
                        !notificationError &&
                        orderedNotifications.map((item) => (
                          <div
                            key={item.id}
                            className={`px-4 py-3 border-b border-outline-variant/10 ${
                              item.is_read ? 'bg-surface-container-lowest' : 'bg-primary/5'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <button
                                type="button"
                                onClick={() => void handleOpenNotification(item)}
                                className="flex-1 text-left"
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${getPriorityPill(
                                      item.priority
                                    )}`}
                                  >
                                    {item.priority}
                                  </span>
                                  <span className="text-[11px] text-on-surface-variant">
                                    {formatRelativeTime(item.delivered_at || item.created_at)}
                                  </span>
                                </div>
                                <p className="text-sm font-bold text-on-surface">{item.title}</p>
                                <p className="text-xs text-on-surface-variant mt-1">
                                  {item.message}
                                </p>
                              </button>

                              <div className="flex flex-col items-end gap-1">
                                {!item.is_read ? (
                                  <button
                                    type="button"
                                    onClick={() => void handleMarkRead(item.id)}
                                    className="text-[11px] font-semibold text-primary hover:underline"
                                  >
                                    Mark read
                                  </button>
                                ) : null}
                                {item.priority !== 'critical' ? (
                                  <button
                                    type="button"
                                    onClick={() => void handleHide(item)}
                                    className="text-[11px] font-semibold text-on-surface-variant hover:text-on-surface"
                                  >
                                    Hide
                                  </button>
                                ) : (
                                  <span className="text-[11px] text-error font-semibold">
                                    Critical
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ) : null}
              </div>

              {isAuthenticated ? (
                <div className="relative" ref={menuRef}>
                  <button
                    type="button"
                    onClick={() => setMenuOpen((prev) => !prev)}
                    className="flex items-center justify-center p-2 rounded-full hover:bg-surface-container-high transition-transform active:scale-95"
                  >
                    <Icon name="person" className="h-6 w-6 text-white" />
                  </button>
                  {menuOpen ? (
                    <div className="absolute right-0 mt-2 min-w-[220px] rounded-xl border border-outline-variant/20 bg-surface-container-lowest shadow-2xl overflow-hidden z-50">
                      <div className="px-4 py-3 border-b border-outline-variant/20">
                        <p className="text-sm font-bold text-on-surface truncate">{userName}</p>
                        <p className="text-xs text-on-surface-variant">Signed in</p>
                      </div>
                      <Link
                        href="/profile"
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-3 text-sm text-on-surface hover:bg-surface-container-low transition-colors"
                      >
                        Profile
                      </Link>
                      <Link
                        href="/settings"
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-3 text-sm text-on-surface hover:bg-surface-container-low transition-colors"
                      >
                        Settings
                      </Link>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-3 text-sm text-error hover:bg-error-container/30 transition-colors"
                      >
                        Logout
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center justify-center p-2 rounded-full hover:bg-surface-container-high transition-transform active:scale-95"
                >
                  <Icon name="person" className="h-6 w-6 text-white" />
                </Link>
              )}

              <Button
                variant="danger"
                className="uppercase tracking-wider whitespace-nowrap"
                type="button"
                onClick={() => {
                  void triggerEmergencyNotifications();
                  void loadUnreadCount();
                  startEmergencyAlertTone();
                  setMobileNavOpen(false);
                  setShowEmergencyAlert(true);
                }}
              >
                Emergency
              </Button>
            </div>
          </div>
        </nav>
      </header>

      {mobileNavOpen ? (
        <div className="md:hidden fixed inset-0 z-[100]">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-72 bg-surface-container-lowest shadow-2xl overflow-y-auto animate-slide-in-left">
            <div className="p-6 space-y-1">
              {navItems.map((item) => {
                const isActive = activeHref === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileNavOpen(false)}
                    className={`block px-4 py-3 rounded-xl text-sm font-bold transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-on-surface hover:bg-surface-container-low'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <hr className="my-3 border-outline-variant/20" />
              <Link
                href="/profile"
                onClick={() => setMobileNavOpen(false)}
                className="block px-4 py-3 rounded-xl text-sm font-bold text-on-surface hover:bg-surface-container-low transition-colors"
              >
                Profile
              </Link>
              <Link
                href="/settings"
                onClick={() => setMobileNavOpen(false)}
                className="block px-4 py-3 rounded-xl text-sm font-bold text-on-surface hover:bg-surface-container-low transition-colors"
              >
                Settings
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      {showEmergencyAlert ? (
        <div className="fixed inset-0 z-[120]">
          <div className="absolute inset-0 bg-red-950/65 backdrop-blur-lg" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,110,110,0.28),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(185,28,28,0.32),transparent_55%)]" />
          <div className="relative h-full w-full flex items-center justify-center px-4">
            <div className="w-full max-w-2xl rounded-[2rem] border border-red-200/35 bg-[linear-gradient(165deg,rgba(127,29,29,0.97),rgba(69,10,10,0.98))] text-white shadow-[0_30px_90px_-20px_rgba(127,29,29,0.9)] overflow-hidden">
              <div className="relative p-6 md:p-9">
                <div className="absolute -top-20 -right-12 h-52 w-52 rounded-full bg-red-400/20 blur-3xl" />
                <div className="absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-red-500/15 blur-3xl" />

                <div className="relative flex items-start justify-between gap-3 mb-5">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-white/12 border border-white/20 flex items-center justify-center">
                      <span className="relative flex h-3 w-3 mr-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-200 opacity-70"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-100"></span>
                      </span>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-red-100/90 font-black">
                        High Alert
                      </p>
                      <h3 className="text-3xl font-display font-black tracking-tight">
                        Emergency Assistance Active
                      </h3>
                    </div>
                  </div>
                  <span className="shrink-0 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-red-100/15 border border-red-100/35 text-red-100">
                    Live
                  </span>
                </div>

                <p className="relative text-red-50/95 text-lg leading-relaxed max-w-2xl">
                  The system is calling an ambulance. Please stay on this screen.
                  We are connecting you to a nearby hospital very shortly.
                </p>

                <div className="relative mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-white/8 border border-white/15 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-wider text-red-100/80 font-bold">
                      Dispatch
                    </p>
                    <p className="text-sm font-semibold">Ambulance request initiated</p>
                  </div>
                  <div className="rounded-2xl bg-white/8 border border-white/15 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-wider text-red-100/80 font-bold">
                      Safety Data
                    </p>
                    <p className="text-sm font-semibold">Sharing critical profile details</p>
                  </div>
                  <div className="rounded-2xl bg-white/8 border border-white/15 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-wider text-red-100/80 font-bold">
                      Location
                    </p>
                    <p className="text-sm font-semibold">Sending live location updates</p>
                  </div>
                </div>

                <div className="relative mt-7 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <a
                    href="tel:108"
                    className="inline-flex items-center justify-center rounded-2xl bg-white text-red-800 font-black text-lg px-5 py-3.5 hover:bg-red-50 transition-all"
                  >
                    Call 108 Ambulance
                  </a>
                  <a
                    href="tel:112"
                    className="inline-flex items-center justify-center rounded-2xl bg-red-900/50 border border-red-200/35 text-white font-extrabold text-lg px-5 py-3.5 hover:bg-red-900/70 transition-all"
                  >
                    Call 112 Emergency
                  </a>
                </div>

                <div className="relative mt-4 flex items-center justify-between gap-3 flex-wrap">
                  <p className="text-sm text-red-100/85">Stay calm. Help is being coordinated.</p>
                  <button
                    type="button"
                    onClick={() => {
                      stopEmergencyAlertTone();
                      setShowEmergencyAlert(false);
                    }}
                    className="inline-flex items-center justify-center rounded-xl bg-transparent border border-red-200/45 text-red-100 font-bold px-5 py-2.5 hover:bg-red-900/45 transition-colors"
                  >
                    Close Alert
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
