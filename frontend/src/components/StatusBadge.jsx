// Status pills tuned for the deep-forest (dark) UI: translucent color fills
// with light text so they read clearly on the green background.
const STATUS_STYLES = {
  Submitted: "bg-white/10 text-white/80 ring-white/20",
  "Under Review": "bg-amber-400/15 text-amber-200 ring-amber-300/30",
  Assigned: "bg-sky-400/15 text-sky-200 ring-sky-300/30",
  "In Progress": "bg-blue-400/15 text-blue-200 ring-blue-300/30",
  Resolved: "bg-emerald-400/20 text-emerald-200 ring-emerald-300/40",
};

export default function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || "bg-white/10 text-white/80 ring-white/20";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${style}`}
    >
      {status || "Unknown"}
    </span>
  );
}
