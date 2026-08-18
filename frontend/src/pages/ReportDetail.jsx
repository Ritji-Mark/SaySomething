import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getReport,
  getReportHistory,
  listComments,
  addComment,
  listEvidence,
  uploadEvidence,
} from "../api/reports.js";
import { API_ORIGIN } from "../api/client.js";
import StatusBadge from "../components/StatusBadge.jsx";
import { formatDateTime } from "../utils/format.js";

export default function ReportDetail() {
  const { id } = useParams();

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
      })
      .catch((err) => {
        if (active)
          setError(
            err.response?.data?.message || "Failed to load this report."
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

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
      setCommentError(
        err.response?.data?.message || "Failed to add comment."
      );
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
      setUploadError(
        err.response?.data?.message || "Failed to upload the file."
      );
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <p className="text-slate-500">Loading…</p>;
  }

  if (error) {
    return (
      <div>
        <Link to="/reports" className="text-sm text-indigo-600 hover:underline">
          ← Back to my reports
        </Link>
        <div className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="space-y-6">
      <div>
        <Link to="/reports" className="text-sm text-indigo-600 hover:underline">
          ← Back to my reports
        </Link>
      </div>

      {/* Report header */}
      <div className="rounded-xl bg-white p-6 shadow">
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <span className="font-mono text-xs text-slate-400">
              {report.report_number}
            </span>
            <h1 className="text-2xl font-bold text-slate-900">{report.title}</h1>
          </div>
          <StatusBadge status={report.status} />
        </div>

        <p className="whitespace-pre-line text-slate-700">
          {report.description}
        </p>

        <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-slate-400">Category</dt>
            <dd className="font-medium text-slate-800">
              {report.category || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-slate-400">Address</dt>
            <dd className="font-medium text-slate-800">
              {report.address || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-slate-400">Assigned to</dt>
            <dd className="font-medium text-slate-800">
              {report.authority || "Unassigned"}
              {report.department ? ` · ${report.department}` : ""}
            </dd>
          </div>
          <div>
            <dt className="text-slate-400">Reported</dt>
            <dd className="font-medium text-slate-800">
              {formatDateTime(report.created_at)}
            </dd>
          </div>
          <div>
            <dt className="text-slate-400">Last updated</dt>
            <dd className="font-medium text-slate-800">
              {formatDateTime(report.updated_at)}
            </dd>
          </div>
          {report.resolved_at && (
            <div>
              <dt className="text-slate-400">Resolved</dt>
              <dd className="font-medium text-slate-800">
                {formatDateTime(report.resolved_at)}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* Status timeline */}
      <div className="rounded-xl bg-white p-6 shadow">
        <h2 className="mb-4 text-lg font-semibold">Status timeline</h2>
        {history.length === 0 ? (
          <p className="text-sm text-slate-500">No status changes yet.</p>
        ) : (
          <ol className="space-y-4">
            {history.map((h) => (
              <li key={h.id} className="flex gap-3">
                <div className="mt-1 flex flex-col items-center">
                  <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={h.status} />
                    <span className="text-xs text-slate-400">
                      {formatDateTime(h.created_at)}
                    </span>
                  </div>
                  {h.note && (
                    <p className="mt-1 text-sm text-slate-600">{h.note}</p>
                  )}
                  {h.changed_by_name && (
                    <p className="mt-0.5 text-xs text-slate-400">
                      by {h.changed_by_name}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Evidence */}
      <div className="rounded-xl bg-white p-6 shadow">
        <h2 className="mb-4 text-lg font-semibold">Evidence</h2>

        {evidence.length === 0 ? (
          <p className="text-sm text-slate-500">No files attached yet.</p>
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
                  className="block overflow-hidden rounded-lg border border-slate-200 hover:shadow"
                >
                  {isImage ? (
                    <img
                      src={url}
                      alt="evidence"
                      className="h-32 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-32 w-full flex-col items-center justify-center bg-slate-50 text-slate-500">
                      <span className="text-2xl">📄</span>
                      <span className="mt-1 text-xs">View file</span>
                    </div>
                  )}
                </a>
              );
            })}
          </div>
        )}

        <form onSubmit={handleUpload} className="mt-4 border-t border-slate-100 pt-4">
          {uploadError && (
            <p className="mb-2 text-sm text-red-600">{uploadError}</p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-indigo-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-200"
            />
            <button
              type="submit"
              disabled={uploading}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {uploading ? "Uploading…" : "Upload"}
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Images or PDF, up to 10&nbsp;MB.
          </p>
        </form>
      </div>

      {/* Comments */}
      <div className="rounded-xl bg-white p-6 shadow">
        <h2 className="mb-4 text-lg font-semibold">
          Comments{" "}
          <span className="text-sm font-normal text-slate-400">
            ({comments.length})
          </span>
        </h2>

        {comments.length === 0 ? (
          <p className="text-sm text-slate-500">No comments yet.</p>
        ) : (
          <ul className="space-y-4">
            {comments.map((c) => (
              <li key={c.id} className="border-b border-slate-100 pb-3 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-800">
                    {c.author || "User"}
                  </span>
                  <span className="text-xs text-slate-400">
                    {formatDateTime(c.created_at)}
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-line text-sm text-slate-700">
                  {c.comment}
                </p>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleAddComment} className="mt-4 border-t border-slate-100 pt-4">
          {commentError && (
            <p className="mb-2 text-sm text-red-600">{commentError}</p>
          )}
          <textarea
            rows={3}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add a comment…"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <div className="mt-2 flex justify-end">
            <button
              type="submit"
              disabled={postingComment || !commentText.trim()}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {postingComment ? "Posting…" : "Post comment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
