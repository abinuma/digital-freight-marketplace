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
    queryFn: () => listNotifications({ limit: 12 }),
    refetchInterval: 60_000,
  });
  const unread = useQuery({
    queryKey: unreadKey,
    queryFn: () => listNotifications({ limit: 1, unreadOnly: true }),
    refetchInterval: 60_000,
  });
  const unreadCount = unread.data?.pagination?.total || 0;

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
        await markNotificationRead(notification.id);
        cache.setQueryData(recentKey, (current) =>
          current
            ? {
                ...current,
                notifications: current.notifications.map((item) =>
                  item.id === notification.id ? { ...item, read: true } : item,
                ),
              }
            : current,
        );
        await cache.invalidateQueries({ queryKey: unreadKey });
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
      await markAllNotificationsRead();
      cache.setQueryData(recentKey, (current) =>
        current
          ? {
              ...current,
              notifications: current.notifications.map((item) => ({
                ...item,
                read: true,
              })),
            }
          : current,
      );
      await cache.invalidateQueries({ queryKey: unreadKey });
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
            <div className="flex min-h-24 items-center justify-center gap-2 p-4 text-sm text-slate-500">
              <Spinner /> Loading notifications…
            </div>
          ) : recent.data?.notifications?.length ? (
            <div className="max-h-96 overflow-y-auto">
              {recent.data.notifications.map((notification) => (
                <button
                  type="button"
                  className={`flex w-full items-start gap-3 border-0 border-b border-slate-100 px-4 py-3 text-left text-inherit ${notification.read ? "bg-white" : "bg-blue-50"} hover:bg-slate-50`}
                  onClick={() => updateNotification(notification)}
                  key={notification.id}
                >
                  <span
                    className={`mt-1 text-xs ${notification.read ? "text-slate-300" : "text-blue-700"}`}
                    aria-hidden="true"
                  >
                    ●
                  </span>
                  <span className="grid min-w-0 flex-1 gap-1">
                    <strong className="text-sm text-slate-800">
                      {notification.title}
                    </strong>
                    <small className="text-sm text-slate-600">
                      {notification.message}
                    </small>
                    <time className="text-xs text-slate-400">
                      {new Intl.DateTimeFormat(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(notification.createdAt))}
                    </time>
                  </span>
                  <span
                    className="self-center text-sm text-slate-400"
                    aria-hidden="true"
                  >
                    →
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex min-h-24 items-center justify-center p-4 text-sm text-slate-500">
              You don’t have any notifications yet.
            </div>
          )}
        </section>
      )}
    </div>
  );
}
