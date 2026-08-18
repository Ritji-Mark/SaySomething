import client from "./client.js";

// GET /api/reports -> { success, count, reports }
export async function listReports() {
  const res = await client.get("/reports");
  return res.data;
}

// GET /api/reports/:id -> { success, report }
export async function getReport(id) {
  const res = await client.get(`/reports/${id}`);
  return res.data;
}

// POST /api/reports -> { success, message, report }
export async function createReport(payload) {
  const res = await client.post("/reports", payload);
  return res.data;
}

// GET /api/reports/:id/history -> { success, count, history }
export async function getReportHistory(id) {
  const res = await client.get(`/reports/${id}/history`);
  return res.data;
}

// GET /api/reports/:id/comments -> { success, count, comments }
export async function listComments(reportId) {
  const res = await client.get(`/reports/${reportId}/comments`);
  return res.data;
}

// POST /api/reports/:id/comments -> { success, message, comment }
export async function addComment(reportId, comment) {
  const res = await client.post(`/reports/${reportId}/comments`, { comment });
  return res.data;
}

// GET /api/reports/:id/evidence -> { success, count, evidence }
export async function listEvidence(reportId) {
  const res = await client.get(`/reports/${reportId}/evidence`);
  return res.data;
}

// POST /api/reports/:id/evidence (multipart, field name "file") -> { success, message, evidence }
export async function uploadEvidence(reportId, file) {
  const form = new FormData();
  form.append("file", file);
  // Let the browser/axios set the multipart boundary automatically.
  const res = await client.post(`/reports/${reportId}/evidence`, form);
  return res.data;
}
