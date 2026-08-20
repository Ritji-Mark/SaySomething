import client from "./client.js";

// GET /api/authorities -> { success, count, authorities }
export async function listAuthorities() {
  const res = await client.get("/authorities");
  return res.data;
}

// GET /api/departments -> { success, count, departments }
// Pass an authorityId to only fetch that authority's departments.
export async function listDepartments(authorityId) {
  const res = await client.get("/departments", {
    params: authorityId ? { authority_id: authorityId } : {},
  });
  return res.data;
}

// GET /api/report-statuses -> { success, count, statuses }
export async function listStatuses() {
  const res = await client.get("/report-statuses");
  return res.data;
}

// POST /api/authorities -> { success, message, authority }
export async function createAuthority(payload) {
  const res = await client.post("/authorities", payload);
  return res.data;
}

// PUT /api/authorities/:id -> { success, message, authority }
export async function updateAuthority(id, payload) {
  const res = await client.put(`/authorities/${id}`, payload);
  return res.data;
}

// POST /api/departments -> { success, message, department }
export async function createDepartment(payload) {
  const res = await client.post("/departments", payload);
  return res.data;
}
