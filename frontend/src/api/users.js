import client from "./client.js";

// GET /api/users -> { success, count, users }  (Administrator only)
export async function listUsers() {
  const res = await client.get("/users");
  return res.data;
}

// POST /api/users -> { success, message, user }  (Administrator only)
export async function createUser(payload) {
  const res = await client.post("/users", payload);
  return res.data;
}
