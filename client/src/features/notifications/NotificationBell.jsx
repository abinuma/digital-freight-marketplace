import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Spinner } from '../../shared/components/index.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { listNotifications, markAllNotificationsRead, markNotificationRead } from './notifications.api.js';

const recentKey = ['notifications', 'recent'];
const unreadKey = ['notifications', 'unread'];
const destinationFor = (role, notification) => {
  if (notification.type === 'NEW_MESSAGE') return role === 'SHIPPER' ? `/shipper/messages?conversationId=${notification.referenceId}` : `/transporter/messages?conversationId=${notification.referenceId}`;
  if (notification.type === 'BID_RECEIVED') return '/shipper/shipments';
  if (notification.type === 'BID_ACCEPTED' || notification.type === 'BID_DECLINED') return '/transporter/bids';
  if (notification.type === 'SHIPMENT_COMPLETED') return `/transporter/shipments/${notification.referenceId}`;
  if (notification.type === 'SHIPMENT_REMOVED') return '/transporter/bids';
  return role === 'SHIPPER' ? '/shipper' : '/transporter';
};

export function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const cache = useQueryClient();
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [working, setWorking] = useState(false);
  const [actionError, setActionError] = useState('');
  const recent = useQuery({ queryKey: recentKey, queryFn: () => listNotifications({ limit: 12 }), refetchInterval: 60_000 });
  const unread = useQuery({ queryKey: unreadKey, queryFn: () => listNotifications({ limit: 1, unreadOnly: true }), refetchInterval: 60_000 });
  const unreadCount = unread.data?.pagination?.total || 0;

  useEffect(() => {
    function closeOutside(event) { if (!rootRef.current?.contains(event.target)) setOpen(false); }
    function closeEscape(event) { if (event.key === 'Escape') setOpen(false); }
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', closeEscape);
    };
  }, []);

  async function updateNotification(notification) {
    setActionError('');
    try {
      if (!notification.read) {
        await markNotificationRead(notification.id);
        cache.setQueryData(recentKey, (current) => current ? { ...current, notifications: current.notifications.map((item) => item.id === notification.id ? { ...item, read: true } : item) } : current);
        await cache.invalidateQueries({ queryKey: unreadKey });
      }
      setOpen(false);
      navigate(destinationFor(user.role, notification));
    } catch (error) { setActionError(error.message); }
  }

  async function markAllRead() {
    setWorking(true);
    setActionError('');
    try {
      await markAllNotificationsRead();
      cache.setQueryData(recentKey, (current) => current ? { ...current, notifications: current.notifications.map((item) => ({ ...item, read: true })) } : current);
      await cache.invalidateQueries({ queryKey: unreadKey });
    } catch (error) { setActionError(error.message); }
    finally { setWorking(false); }
  }

  return (
    <div className="notification-bell" ref={rootRef}>
      <button type="button" className="notification-bell__button" aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`} aria-expanded={open} onClick={() => { setOpen((current) => !current); setActionError(''); }}><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg>{unreadCount > 0 && <span className="notification-bell__count">{unreadCount > 99 ? '99+' : unreadCount}</span>}</button>
      {open && <section className="notification-popover" aria-label="Notifications"><header><div><h2>Notifications</h2><p>{unreadCount ? `${unreadCount} unread` : 'You’re all caught up'}</p></div><Button variant="ghost" size="sm" onClick={markAllRead} disabled={working || !unreadCount}>{working ? <Spinner /> : 'Mark all read'}</Button></header>{actionError && <Alert tone="danger">{actionError}</Alert>}{recent.isError && <Alert tone="danger">{recent.error.message}</Alert>}{recent.isPending ? <div className="notification-loading"><Spinner /> Loading notifications…</div> : recent.data?.notifications?.length ? <div className="notification-list">{recent.data.notifications.map((notification) => <button type="button" className={`notification-item ${notification.read ? '' : 'is-unread'}`} onClick={() => updateNotification(notification)} key={notification.id}><span className="notification-item__dot" aria-hidden="true">{notification.read ? '○' : '●'}</span><span className="notification-item__content"><strong>{notification.title}</strong><small>{notification.message}</small><time>{new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(notification.createdAt))}</time></span><span className="notification-item__arrow" aria-hidden="true">→</span></button>)}</div> : <div className="notification-empty">You don’t have any notifications yet.</div>}</section>}
    </div>
  );
}
