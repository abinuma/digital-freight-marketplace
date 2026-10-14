import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Alert, Button, Spinner } from "../../shared/components/index.js";
import { useAuth } from "../auth/AuthContext.jsx";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "./notifications.api.js";

const recentKey = ["notifications", "recent"];
const unreadKey = ["notifications", "unread"];
const destinationFor = (role, notification) => {
  if (notification.type === "NEW_MESSAGE")
    return role === "SHIPPER"
      ? `/shipper/messages?conversationId=${notification.referenceId}`
      : `/transporter/messages?conversationId=${notification.referenceId}`;
  if (notification.type === "BID_RECEIVED") return "/shipper/shipments";
  if (
    notification.type === "BID_ACCEPTED" ||
    notification.type === "BID_DECLINED"
  )
    return "/transporter/bids";
  if (notification.type === "SHIPMENT_COMPLETED")
    return `/transporter/shipments/${notification.referenceId}`;
  if (notification.type === "SHIPMENT_REMOVED") return "/transporter/bids";
  return role === "SHIPPER" ? "/shipper" : "/transporter";
};

export function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const cache = useQueryClient();
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [working, setWorking] = useState(false);
  const [actionError, setActionError] = useState("");
  const recent = useQuery({
    queryKey: recentKey,
    queryFn: () => listNotifications({ limit: 50, unreadOnly: true }),
    refetchInterval: 15_000,
  });
  const unread = useQuery({
    queryKey: unreadKey,
    queryFn: () => listNotifications({ limit: 1, unreadOnly: true }),
    refetchInterval: 15_000,
  });
  const unreadNotifications = (recent.data?.notifications || []).filter((item) => !item.read);
  const unreadCount = typeof unread.data?.pagination?.total === 'number'
    ? unread.data.pagination.total
    : unreadNotifications.length;

  useEffect(() => {
    function closeOutside(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    }
    function closeEscape(event) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeEscape);
    };
  }, []);

  async function updateNotification(notification) {
    setActionError("");
    try {
      if (!notification.read) {
        // Optimistically remove from list and decrement badge count
        cache.setQueryData(recentKey, (current) =>
          current
            ? {
                ...current,
                notifications: current.notifications.filter((item) => item.id !== notification.id),
              }
            : current,
        );
        cache.setQueryData(unreadKey, (current) => {
          if (!current?.pagination) return current;
          const newTotal = Math.max(0, (current.pagination.total || 0) - 1);
          return {
            ...current,
            pagination: { ...current.pagination, total: newTotal },
          };
        });

        await markNotificationRead(notification.id);
        await cache.invalidateQueries({ queryKey: ["notifications"] });
      }
      setOpen(false);
      navigate(destinationFor(user.role, notification));
    } catch (error) {
      setActionError(error.message);
    }
  }

  async function markAllRead() {
    setWorking(true);
    setActionError("");
    try {
      // Optimistically clear unread list and set badge number to 0
      cache.setQueryData(unreadKey, {
        notifications: [],
        pagination: { total: 0, page: 1, limit: 1, totalPages: 0 },
      });
      cache.setQueryData(recentKey, {
        notifications: [],
        pagination: { total: 0, page: 1, limit: 50, totalPages: 0 },
      });

      await markAllNotificationsRead();
      await cache.invalidateQueries({ queryKey: ["notifications"] });
    } catch (error) {
      setActionError(error.message);
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="relative inline-flex items-center" ref={rootRef}>
      <button
        type="button"
        className="relative grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-blue-700 hover:border-blue-200 hover:bg-blue-50"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={open}
        onClick={() => {
          setOpen((current) => !current);
          setActionError("");
        }}
      >
        <svg
          className="h-5 w-5"
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full border-2 border-white bg-red-600 px-1 text-xs font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <section
          className="absolute right-0 top-full z-50 mt-2 grid w-80 overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-800 shadow-xl sm:w-96 max-sm:fixed max-sm:left-4 max-sm:right-4 max-sm:top-16 max-sm:mt-0 max-sm:w-auto"
          aria-label="Notifications"
        >
          <header className="flex items-start justify-between gap-3 border-b border-slate-100 p-4">
            <div>
              <h2 className="m-0 text-base font-bold text-slate-900">
                Notifications
              </h2>
              <p className="mb-0 mt-1 text-sm text-slate-500">
                {unreadCount ? `${unreadCount} unread` : "You’re all caught up"}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllRead}
              disabled={working || !unreadCount}
            >
              {working ? <Spinner /> : "Mark all read"}
            </Button>
          </header>
          {actionError && (
            <div className="p-3">
              <Alert tone="danger">{actionError}</Alert>
            </div>
          )}
          {recent.isError && (
            <div className="p-3">
              <Alert tone="danger">{recent.error.message}</Alert>
            </div>
          )}
          {recent.isPending ? (
            <div className="flex h-[124px] items-center justify-center gap-2 p-4 text-sm text-slate-500">
              <Spinner /> Loading unread messages…
            </div>
          ) : unreadNotifications.length > 0 ? (
            <div className="max-h-[124px] overflow-y-auto divide-y divide-slate-100">
              {unreadNotifications.map((notification) => (
                <button
                  type="button"
                  className="flex h-[62px] w-full items-center gap-3 px-4 py-2 text-left text-inherit bg-blue-50/70 hover:bg-blue-100/70 transition-colors"
                  onClick={() => updateNotification(notification)}
                  key={notification.id}
                >
                  <span
                    className="text-xs text-blue-700 shrink-0"
                    aria-hidden="true"
                  >
                    ●
                  </span>
                  <span className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <strong className="truncate text-sm font-semibold text-slate-900">
                        {notification.title}
                      </strong>
                      <time className="shrink-0 text-[11px] text-slate-400">
                        {new Intl.DateTimeFormat(undefined, {
                          hour: "numeric",
                          minute: "2-digit",
                        }).format(new Date(notification.createdAt))}
                      </time>
                    </div>
                    <p className="m-0 truncate text-xs text-slate-600">
                      {notification.message}
                    </p>
                  </span>
                  <span
                    className="shrink-0 text-xs text-slate-400"
                    aria-hidden="true"
                  >
                    →
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex h-[124px] items-center justify-center p-4 text-sm text-slate-500">
              No unread messages.
            </div>
          )}
        </section>
      )}
    </div>
  );
}
