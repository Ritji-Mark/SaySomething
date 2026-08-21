import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listReports } from "../api/reports.js";
import { listStatuses } from "../api/reference.js";
import { useAuth } from "../context/AuthContext.jsx";
import { ROLES } from "../utils/roles.js";
import StatusBadge from "../components/StatusBadge.jsx";
import { formatDate } from "../utils/format.js";

export default function StaffDashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === ROLES.ADMINISTRATOR;

  const [reports, setReports] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([listReports(), listStatuses()])
      .then(([reportData, statusData]) => {
        if (!active) return;
        setReports(reportData.reports || []);
        setStatuses(statusData.statuses || []);
      })
      .catch((err) => {
        if (active)
          setError(err.response?.data?.message || "Failed to load reports.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filtered =
    statusFilter === "all"
      ? reports
      : reports.filter((r) => String(r.status_id) === String(statusFilter));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">
          {isAdmin ? "All Reports" : "Assigned Reports"}
        </h1>
        <p className="text-sm text-mint">
          {isAdmin
            ? "Every report across all authorities. Open one to change its status or assign it."
            : "Reports routed to your authority. Open one to update its status."}
        </p>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <label className="text-sm text-mint">Filter by status</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-forest-line bg-forest px-3 py-1.5 text-sm text-white focus:border-mint focus:outline-none focus:ring-1 focus:ring-mint"
        >
          <option value="all">All statuses</option>
          {statuses.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <span className="text-sm text-mint">
          {filtered.length} of {reports.length}
        </span>
      </div>

      {loading && <p className="text-mint">Loading…</p>}

      {error && (
        <div className="rounded-md bg-red-500/15 px-4 py-3 text-sm text-red-200 ring-1 ring-red-400/20">
          {error}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-forest-line p-10 text-center text-mint">
          No reports to show.
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-forest-line">
          <table className="w-full min-w-170 text-sm">
            <thead className="bg-white/5 text-left text-xs uppercase tracking-wide text-mint">
              <tr>
                <th className="px-4 py-3 font-semibold">Report</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                {isAdmin && (
                  <th className="px-4 py-3 font-semibold">Authority</th>
                )}
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Reported</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-forest-line">
              {filtered.map((r) => (
                <tr key={r.id} className="transition-colors hover:bg-white/5">
                  <td className="px-4 py-3">
                    <Link to={`/reports/${r.id}`} className="block">
                      <span className="block font-mono text-xs text-mint">
                        {r.report_number}
                      </span>
                      <span className="font-medium text-white">{r.title}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-mint">{r.category || "—"}</td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-mint">
                      {r.authority || "Unassigned"}
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-4 py-3 text-mint">
                    {formatDate(r.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
