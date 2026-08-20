import client from "./client.js";

// GET /api/categories -> { success, count, categories }
export async function listCategories() {
  const res = await client.get("/categories");
  return res.data;
}

// PUT /api/categories/:id/routing -> { success, message, category }
// Pass null for authority_id/department_id to clear the routing.
export async function updateCategoryRouting(id, { authority_id, department_id }) {
  const res = await client.put(`/categories/${id}/routing`, {
    authority_id,
    department_id,
  });
  return res.data;
}
