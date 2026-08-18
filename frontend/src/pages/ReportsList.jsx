import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listReports } from "../api/reports.js";
import StatusBadge from "../components/StatusBadge.jsx";
import { formatDate } from "../utils/format.js";

export default function ReportsList() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    listReports()
      .then((data) => {
        if (active) setReports(data.reports || []);
      })
      .catch((err) => {
        if (active)
          setError(
            err.response?.data?.message || "Failed to load your reports."
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Reports</h1>
          <p className="text-sm text-slate-500">
            Issues you have reported and their current status.
          </p>
        </div>
        <Link
          to="/reports/new"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + New Report
        </Link>
      </div>

      {loading && <p className="text-slate-500">Loading…</p>}

      {error && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && reports.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-slate-600">You haven&apos;t reported anything yet.</p>
          <Link
            to="/reports/new"
            className="mt-3 inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Report your first issue
          </Link>
        </div>
      )}

      {!loading && !error && reports.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {reports.map((r) => (
            <Link
              key={r.id}
              to={`/reports/${r.id}`}
              className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="mb-2 flex items-start justify-between gap-3">
                <span className="text-xs font-mono text-slate-400">
                  {r.report_number}
                </span>
                <StatusBadge status={r.status} />
              </div>
              <h2 className="mb-1 font-semibold text-slate-900">{r.title}</h2>
              <p className="mb-3 line-clamp-2 text-sm text-slate-600">
                {r.description}
              </p>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="rounded bg-slate-100 px-2 py-0.5">
                  {r.category || "Uncategorized"}
                </span>
                <span>{formatDate(r.created_at)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
