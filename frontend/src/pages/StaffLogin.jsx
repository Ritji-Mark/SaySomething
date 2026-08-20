import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { homePathForRole, isStaff } from "../utils/roles.js";

// Dedicated sign-in for Authority / Administrator accounts (reachable at
// /admin/login). Same credentials endpoint as the citizen login, but without
// Google or self-registration, which don't apply to staff.
export default function StaffLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(email, password);
      // Staff land on the dashboard; a citizen who used this page is sent to
      // their own home rather than a dead end.
      const dest =
        location.state?.from?.pathname ||
        (isStaff(user.role) ? "/dashboard" : homePathForRole(user.role));
      navigate(dest, { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message || "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-md border border-forest-line bg-forest px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-mint focus:outline-none focus:ring-1 focus:ring-mint";
  const labelClass = "mb-1 block text-sm font-medium text-mint";

  return (
    <div className="flex min-h-screen items-center justify-center bg-forest px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <img src="/logo.png" alt="SaySomething" className="mb-3 h-14 w-14" />
          <h1 className="text-2xl font-bold text-white">SaySomething</h1>
          <p className="mt-1 text-sm text-mint">Staff &amp; administrator portal.</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-forest-line bg-forest-surface p-6 shadow-lg shadow-black/20"
        >
          <h2 className="text-lg font-semibold text-white">Staff sign in</h2>

          {error && (
            <div className="rounded-md bg-red-500/15 px-3 py-2 text-sm text-red-200 ring-1 ring-red-400/20">
              {error}
            </div>
          )}

          <div>
            <label className={labelClass}>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              placeholder="Email"
            />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-sm font-medium text-mint">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs text-mint hover:text-white hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              placeholder="Password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-mint px-4 py-2 text-sm font-semibold text-forest transition hover:bg-white disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>

          <p className="text-center text-sm text-mint">
            Are you a resident?{" "}
            <Link to="/login" className="font-medium text-white hover:underline">
              Sign in here
            </Link>
          </p>
        </form>

        <p className="mt-4 text-center text-xs text-white/40">
          Staff accounts are created by an administrator.
        </p>
      </div>
    </div>
  );
}
