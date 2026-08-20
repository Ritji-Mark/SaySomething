import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../api/notifications.js";
import { formatDateTime } from "../utils/format.js";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    listNotifications()
      .then((data) => setNotifications(data.notifications || []))
      .catch((err) =>
        setError(err.response?.data?.message || "Failed to load notifications.")
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch {
      // ignore; the list will resync on next load
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      // ignore
    }
  };

  const hasUnread = notifications.some((n) => !n.is_read);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Notifications</h1>
        {hasUnread && (
          <button
            onClick={handleMarkAll}
            className="rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10"
          >
            Mark all as read
          </button>
        )}
      </div>

      {loading && <p className="text-mint">Loading…</p>}

      {error && (
        <div className="rounded-md bg-red-500/15 px-4 py-3 text-sm text-red-200 ring-1 ring-red-400/20">
          {error}
        </div>
      )}

      {!loading && !error && notifications.length === 0 && (
        <div className="rounded-xl border border-dashed border-forest-line p-10 text-center text-mint">
          You have no notifications.
        </div>
      )}

      {!loading && !error && notifications.length > 0 && (
        <ul className="space-y-3">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`rounded-xl border p-4 ${
                n.is_read
                  ? "border-forest-line bg-forest-surface"
                  : "border-mint/40 bg-white/5"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    {!n.is_read && (
                      <span className="h-2 w-2 rounded-full bg-mint" />
                    )}
                    <h2 className="font-semibold text-white">{n.title}</h2>
                  </div>
                  <p className="mt-1 text-sm text-mint">{n.message}</p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-white/50">
                    <span>{formatDateTime(n.created_at)}</span>
                    {n.report_id && (
                      <Link
                        to={`/reports/${n.report_id}`}
                        className="font-medium text-mint hover:text-white hover:underline"
                      >
                        View report
                      </Link>
                    )}
                  </div>
                </div>
                {!n.is_read && (
                  <button
                    onClick={() => handleMarkRead(n.id)}
                    className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-mint hover:bg-white/10 hover:text-white"
                  >
                    Mark read
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
