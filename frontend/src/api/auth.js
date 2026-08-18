import client from "./client.js";

// POST /api/auth/register -> { success, message, user }  (no token returned)
export async function registerRequest(payload) {
  const res = await client.post("/auth/register", payload);
  return res.data;
}

// POST /api/auth/login -> { success, message, token, user }
export async function loginRequest(payload) {
  const res = await client.post("/auth/login", payload);
  return res.data;
}
