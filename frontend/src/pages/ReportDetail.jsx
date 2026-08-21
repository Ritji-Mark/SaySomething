import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getReport,
  getReportHistory,
  listComments,
  addComment,
  listEvidence,
  uploadEvidence,
  updateReportStatus,
  assignReport,
} from "../api/reports.js";
import { listStatuses, listAuthorities, listDepartments } from "../api/reference.js";
import { API_ORIGIN } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { ROLES, homePathForRole } from "../utils/roles.js";
import StatusBadge from "../components/StatusBadge.jsx";
import ReportMap from "../components/ReportMap.jsx";
import { formatDateTime } from "../utils/format.js";

export default function ReportDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const isStaff =
    user?.role === ROLES.AUTHORITY || user?.role === ROLES.ADMINISTRATOR;
  const isAdmin = user?.role === ROLES.ADMINISTRATOR;

  const [report, setReport] = useState(null);
  const [history, setHistory] = useState([]);
  const [comments, setComments] = useState([]);
  const [evidence, setEvidence] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Comment form
  const [commentText, setCommentText] = useState("");
  const [commentError, setCommentError] = useState("");
  const [postingComment, setPostingComment] = useState(false);

  // Evidence upload
  const [file, setFile] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);

  // Staff: status change
  const [statuses, setStatuses] = useState([]);
  const [newStatusId, setNewStatusId] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [statusError, setStatusError] = useState("");
  const [statusSaving, setStatusSaving] = useState(false);

  // Admin: assignment
  const [authorities, setAuthorities] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [assignAuthorityId, setAssignAuthorityId] = useState("");
  const [assignDeptId, setAssignDeptId] = useState("");
  const [assignNote, setAssignNote] = useState("");
  const [assignError, setAssignError] = useState("");
  const [assignSaving, setAssignSaving] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    Promise.all([
      getReport(id),
      getReportHistory(id),
      listComments(id),
      listEvidence(id),
    ])
      .then(([reportData, historyData, commentsData, evidenceData]) => {
        if (!active) return;
        setReport(reportData.report);
        setHistory(historyData.history || []);
        setComments(commentsData.comments || []);
        setEvidence(evidenceData.evidence || []);
        setNewStatusId(String(reportData.report?.status_id || ""));
        setAssignAuthorityId(
          reportData.report?.authority_id
            ? String(reportData.report.authority_id)
            : ""
        );
      })
      .catch((err) => {
        if (active)
          setError(err.response?.data?.message || "Failed to load this report.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  // Reference data for the staff/admin action panels.
  useEffect(() => {
    if (!isStaff) return;
    let active = true;
    listStatuses()
      .then((d) => active && setStatuses(d.statuses || []))
      .catch(() => {});
    if (isAdmin) {
      listAuthorities()
        .then((d) => active && setAuthorities(d.authorities || []))
        .catch(() => {});
    }
    return () => {
      active = false;
    };
  }, [isStaff, isAdmin]);

  // Admin: load departments for the chosen authority.
  useEffect(() => {
    if (!isAdmin || !assignAuthorityId) {
      setDepartments([]);
      return;
    }
    let active = true;
    listDepartments(assignAuthorityId)
      .then((d) => active && setDepartments(d.departments || []))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [isAdmin, assignAuthorityId]);

  const refreshReportAndHistory = async () => {
    const [r, h] = await Promise.all([getReport(id), getReportHistory(id)]);
    setReport(r.report);
    setHistory(h.history || []);
  };

  const refreshComments = async () => {
    const data = await listComments(id);
    setComments(data.comments || []);
  };

  const refreshEvidence = async () => {
    const data = await listEvidence(id);
    setEvidence(data.evidence || []);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    setCommentError("");
    if (!commentText.trim()) return;
    setPostingComment(true);
    try {
      await addComment(id, commentText.trim());
      setCommentText("");
      await refreshComments();
    } catch (err) {
      setCommentError(err.response?.data?.message || "Failed to add comment.");
    } finally {
      setPostingComment(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setUploadError("");
    if (!file) {
      setUploadError("Please choose a file first.");
      return;
    }
    setUploading(true);
    try {
      await uploadEvidence(id, file);
      setFile(null);
      e.target.reset();
      await refreshEvidence();
    } catch (err) {
      setUploadError(err.response?.data?.message || "Failed to upload the file.");
    } finally {
      setUploading(false);
    }
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    setStatusError("");
    if (!newStatusId) {
      setStatusError("Choose a status.");
      return;
    }
    setStatusSaving(true);
    try {
      await updateReportStatus(id, {
        status_id: Number(newStatusId),
        note: statusNote.trim() || undefined,
      });
      setStatusNote("");
      await refreshReportAndHistory();
    } catch (err) {
      setStatusError(err.response?.data?.message || "Failed to update status.");
    } finally {
      setStatusSaving(false);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    setAssignError("");
    if (!assignAuthorityId) {
      setAssignError("Choose an authority.");
      return;
    }
    setAssignSaving(true);
    try {
      await assignReport(id, {
        authority_id: Number(assignAuthorityId),
        department_id: assignDeptId ? Number(assignDeptId) : undefined,
        note: assignNote.trim() || undefined,
      });
      setAssignNote("");
      await refreshReportAndHistory();
    } catch (err) {
      setAssignError(err.response?.data?.message || "Failed to assign report.");
    } finally {
      setAssignSaving(false);
    }
  };

  const backTo = homePathForRole(user?.role);

  const inputClass =
    "w-full rounded-md border border-forest-line bg-forest px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-mint focus:outline-none focus:ring-1 focus:ring-mint";
  const labelClass = "mb-1 block text-sm font-medium text-mint";
  const primaryBtn =
    "rounded-md bg-mint px-4 py-2 text-sm font-semibold text-forest transition hover:bg-white disabled:opacity-60";

  if (loading) {
    return <p className="text-mint">Loading…</p>;
  }

  if (error) {
    return (
      <div>
        <Link to={backTo} className="text-sm text-mint hover:text-white hover:underline">
          ← Back
        </Link>
        <div className="mt-4 rounded-md bg-red-500/15 px-4 py-3 text-sm text-red-200 ring-1 ring-red-400/20">
          {error}
        </div>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="space-y-6">
      <div>
        <Link to={backTo} className="text-sm text-mint hover:text-white hover:underline">
          ← Back
        </Link>
      </div>

      {/* Report header */}
      <div className="rounded-xl border border-forest-line bg-forest-surface p-6">
        <div className="mb-3 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <span className="font-mono text-xs text-mint">
              {report.report_number}
            </span>
            <h1 className="text-2xl font-bold text-white">{report.title}</h1>
          </div>
          <div className="shrink-0">
            <StatusBadge status={report.status} />
          </div>
        </div>

        <p className="whitespace-pre-line text-white/90">{report.description}</p>

        <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-forest-line pt-4 text-sm sm:grid-cols-3 [&>div]:min-w-0">
          <div>
            <dt className="text-mint">Category</dt>
            <dd className="font-medium text-white">{report.category || "—"}</dd>
          </div>
          <div>
            <dt className="text-mint">Address</dt>
            <dd className="font-medium text-white">{report.address || "—"}</dd>
          </div>
          <div>
            <dt className="text-mint">Assigned to</dt>
            <dd className="font-medium text-white">
              {report.authority || "Unassigned"}
              {report.department ? ` · ${report.department}` : ""}
            </dd>
          </div>
          {isStaff && (
            <div>
              <dt className="text-mint">Reported by</dt>
              <dd className="font-medium text-white">
                {report.reporter_name || "—"}
              </dd>
            </div>
          )}
          <div>
            <dt className="text-mint">Reported</dt>
            <dd className="font-medium text-white">
              {formatDateTime(report.created_at)}
            </dd>
          </div>
          <div>
            <dt className="text-mint">Last updated</dt>
            <dd className="font-medium text-white">
              {formatDateTime(report.updated_at)}
            </dd>
          </div>
          {report.resolved_at && (
            <div>
              <dt className="text-mint">Resolved</dt>
              <dd className="font-medium text-white">
                {formatDateTime(report.resolved_at)}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* Location map — visible to staff only */}
      {isStaff && report.latitude != null && report.longitude != null && (
        <div className="rounded-xl border border-forest-line bg-forest-surface p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Location</h2>
          <ReportMap latitude={report.latitude} longitude={report.longitude} />
          <p className="mt-3 font-mono text-xs text-mint">
            {Number(report.latitude).toFixed(6)},{" "}
            {Number(report.longitude).toFixed(6)}
          </p>
        </div>
      )}

      {/* Staff / Admin actions */}
      {isStaff && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Change status (Authority + Admin) */}
          <form
            onSubmit={handleStatusUpdate}
            className="space-y-3 rounded-xl border border-forest-line bg-forest-surface p-6"
          >
            <h2 className="text-lg font-semibold text-white">Update status</h2>
            {statusError && (
              <div className="rounded-md bg-red-500/15 px-3 py-2 text-sm text-red-200 ring-1 ring-red-400/20">
                {statusError}
              </div>
            )}
            <div>
              <label className={labelClass}>Status</label>
              <select
                value={newStatusId}
                onChange={(e) => setNewStatusId(e.target.value)}
                className={inputClass}
              >
                {statuses.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>
                Note <span className="text-white/40">(optional)</span>
              </label>
              <textarea
                rows={2}
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                className={inputClass}
                placeholder="Add a note for the timeline"
              />
            </div>
            <button type="submit" disabled={statusSaving} className={primaryBtn}>
              {statusSaving ? "Saving…" : "Update status"}
            </button>
          </form>

          {/* Assign (Admin only) */}
          {isAdmin && (
            <form
              onSubmit={handleAssign}
              className="space-y-3 rounded-xl border border-forest-line bg-forest-surface p-6"
            >
              <h2 className="text-lg font-semibold text-white">
                Assign to authority
              </h2>
              {assignError && (
                <div className="rounded-md bg-red-500/15 px-3 py-2 text-sm text-red-200 ring-1 ring-red-400/20">
                  {assignError}
                </div>
              )}
              <div>
                <label className={labelClass}>Authority</label>
                <select
                  value={assignAuthorityId}
                  onChange={(e) => {
                    setAssignAuthorityId(e.target.value);
                    setAssignDeptId("");
                  }}
                  className={inputClass}
                >
                  <option value="">Select an authority…</option>
                  {authorities.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>
                  Department <span className="text-white/40">(optional)</span>
                </label>
                <select
                  value={assignDeptId}
                  onChange={(e) => setAssignDeptId(e.target.value)}
                  disabled={!assignAuthorityId || departments.length === 0}
                  className={`${inputClass} disabled:opacity-50`}
                >
                  <option value="">
                    {assignAuthorityId
                      ? "No specific department"
                      : "Choose an authority first"}
                  </option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>
                  Note <span className="text-white/40">(optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={assignNote}
                  onChange={(e) => setAssignNote(e.target.value)}
                  className={inputClass}
                  placeholder="Add a note for the timeline"
                />
              </div>
              <button type="submit" disabled={assignSaving} className={primaryBtn}>
                {assignSaving ? "Assigning…" : "Assign report"}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Status timeline */}
      <div className="rounded-xl border border-forest-line bg-forest-surface p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Status timeline</h2>
        {history.length === 0 ? (
          <p className="text-sm text-mint">No status changes yet.</p>
        ) : (
          <ol className="space-y-4">
            {history.map((h) => (
              <li key={h.id} className="flex gap-3">
                <div className="mt-1 flex flex-col items-center">
                  <span className="h-2.5 w-2.5 rounded-full bg-mint" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={h.status} />
                    <span className="text-xs text-white/50">
                      {formatDateTime(h.created_at)}
                    </span>
                  </div>
                  {h.note && <p className="mt-1 text-sm text-white/90">{h.note}</p>}
                  <p className="mt-0.5 text-xs text-mint">
                    by {h.changed_by_name || "System"}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Evidence */}
      <div className="rounded-xl border border-forest-line bg-forest-surface p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Evidence</h2>

        {evidence.length === 0 ? (
          <p className="text-sm text-mint">No files attached yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {evidence.map((ev) => {
              const url = `${API_ORIGIN}${ev.file_url}`;
              const isImage = (ev.file_type || "").startsWith("image/");
              return (
                <a
                  key={ev.id}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="block overflow-hidden rounded-lg border border-forest-line hover:border-mint/50"
                >
                  {isImage ? (
                    <img
                      src={url}
                      alt="evidence"
                      className="h-32 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-32 w-full flex-col items-center justify-center bg-forest text-mint">
                      <span className="text-2xl">📄</span>
                      <span className="mt-1 text-xs">View file</span>
                    </div>
                  )}
                </a>
              );
            })}
          </div>
        )}

        <form onSubmit={handleUpload} className="mt-4 border-t border-forest-line pt-4">
          {uploadError && (
            <p className="mb-2 text-sm text-red-300">{uploadError}</p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="max-w-full text-sm text-mint file:mr-3 file:rounded-md file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-white/20"
            />
            <button type="submit" disabled={uploading} className={primaryBtn}>
              {uploading ? "Uploading…" : "Upload"}
            </button>
          </div>
          <p className="mt-2 text-xs text-white/50">
            Images or PDF, up to 10&nbsp;MB.
          </p>
        </form>
      </div>

      {/* Comments */}
      <div className="rounded-xl border border-forest-line bg-forest-surface p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">
          Comments{" "}
          <span className="text-sm font-normal text-mint">
            ({comments.length})
          </span>
        </h2>

        {comments.length === 0 ? (
          <p className="text-sm text-mint">No comments yet.</p>
        ) : (
          <ul className="space-y-4">
            {comments.map((c) => (
              <li
                key={c.id}
                className="border-b border-forest-line pb-3 last:border-0"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-white">
                    {c.author || "User"}
                  </span>
                  <span className="text-xs text-white/50">
                    {formatDateTime(c.created_at)}
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-line text-sm text-white/90">
                  {c.comment}
                </p>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleAddComment} className="mt-4 border-t border-forest-line pt-4">
          {commentError && (
            <p className="mb-2 text-sm text-red-300">{commentError}</p>
          )}
          <textarea
            rows={3}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add a comment…"
            className={inputClass}
          />
          <div className="mt-2 flex justify-end">
            <button
              type="submit"
              disabled={postingComment || !commentText.trim()}
              className={primaryBtn}
            >
              {postingComment ? "Posting…" : "Post comment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
