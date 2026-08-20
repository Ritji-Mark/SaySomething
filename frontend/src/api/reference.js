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
