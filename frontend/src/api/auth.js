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

// POST /api/auth/google -> { success, message, token, user }
// `credential` is the Google ID token from the "Sign in with Google" button.
export async function googleSignIn(credential) {
  const res = await client.post("/auth/google", { credential });
  return res.data;
}

// POST /api/auth/forgot-password -> { success, message }  (always generic)
export async function requestPasswordReset(email) {
  const res = await client.post("/auth/forgot-password", { email });
  return res.data;
}

// POST /api/auth/reset-password -> { success, message }
export async function resetPassword({ token, password }) {
  const res = await client.post("/auth/reset-password", { token, password });
  return res.data;
}
