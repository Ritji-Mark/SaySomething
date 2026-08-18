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
        setError(
          err.response?.data?.message || "Failed to load notifications."
        )
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
        <h1 className="text-2xl font-bold">Notifications</h1>
        {hasUnread && (
          <button
            onClick={handleMarkAll}
            className="rounded-md border border-indigo-200 bg-white px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
          >
            Mark all as read
          </button>
        )}
      </div>

      {loading && <p className="text-slate-500">Loading…</p>}

      {error && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && notifications.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">
          You have no notifications.
        </div>
      )}

      {!loading && !error && notifications.length > 0 && (
        <ul className="space-y-3">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`rounded-xl border p-4 shadow-sm ${
                n.is_read
                  ? "border-slate-200 bg-white"
                  : "border-indigo-200 bg-indigo-50"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    {!n.is_read && (
                      <span className="h-2 w-2 rounded-full bg-indigo-500" />
                    )}
                    <h2 className="font-semibold text-slate-900">{n.title}</h2>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{n.message}</p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
                    <span>{formatDateTime(n.created_at)}</span>
                    {n.report_id && (
                      <Link
                        to={`/reports/${n.report_id}`}
                        className="font-medium text-indigo-600 hover:underline"
                      >
                        View report
                      </Link>
                    )}
                  </div>
                </div>
                {!n.is_read && (
                  <button
                    onClick={() => handleMarkRead(n.id)}
                    className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-100"
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
