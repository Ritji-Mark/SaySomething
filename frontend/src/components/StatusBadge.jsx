const STATUS_STYLES = {
  Submitted: "bg-slate-100 text-slate-700 ring-slate-200",
  "Under Review": "bg-amber-100 text-amber-800 ring-amber-200",
  Assigned: "bg-indigo-100 text-indigo-800 ring-indigo-200",
  "In Progress": "bg-blue-100 text-blue-800 ring-blue-200",
  Resolved: "bg-green-100 text-green-800 ring-green-200",
};

export default function StatusBadge({ status }) {
  const style =
    STATUS_STYLES[status] || "bg-slate-100 text-slate-700 ring-slate-200";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${style}`}
    >
      {status || "Unknown"}
    </span>
  );
}
