import axios from "axios";

// Base origin of the backend. The API lives under /api and uploaded files
// are served from /uploads (outside /api), so we expose the origin too.
export const API_ORIGIN = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

const client = axios.create({
  baseURL: `${API_ORIGIN}/api`,
});

// Attach the stored JWT to every request.
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On an expired/invalid token, clear auth and send the user back to login.
// (Guarded so a failed login on /login doesn't cause a redirect loop.)
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      const path = window.location.pathname;
      if (path !== "/login" && path !== "/register") {
        window.location.assign("/login");
      }
    }
    return Promise.reject(error);
  }
);

export default client;
