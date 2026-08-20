import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { homePathForRole } from "../utils/roles.js";
import GoogleSignInButton from "../components/GoogleSignInButton.jsx";

export default function Login() {
  const { login, loginWithGoogle } = useAuth();
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
      const dest = location.state?.from?.pathname || homePathForRole(user.role);
      navigate(dest, { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message || "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async (credential) => {
    setError("");
    try {
      const user = await loginWithGoogle(credential);
      const dest = location.state?.from?.pathname || homePathForRole(user.role);
      navigate(dest, { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message || "Google sign-in failed. Please try again."
      );
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
          <p className="mt-1 text-sm text-mint">
            Report civic issues and track their progress.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-forest-line bg-forest-surface p-6 shadow-lg shadow-black/20"
        >
          <h2 className="text-lg font-semibold text-white">Sign in</h2>

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

          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-forest-line" />
            <span className="text-xs text-mint">or</span>
            <span className="h-px flex-1 bg-forest-line" />
          </div>

          <GoogleSignInButton onCredential={handleGoogle} text="signin_with" />

          <p className="text-center text-sm text-mint">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="font-medium text-white hover:underline">
              Register
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
