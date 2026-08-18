import client from "./client.js";

// GET /api/categories -> { success, count, categories }
export async function listCategories() {
  const res = await client.get("/categories");
  return res.data;
}
