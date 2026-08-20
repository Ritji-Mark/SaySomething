import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { resetPassword } from "../api/auth.js";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword({ token, password });
      setDone(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "This reset link is invalid or has expired."
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
          <p className="mt-1 text-sm text-mint">Choose a new password.</p>
        </div>

        <div className="rounded-xl border border-forest-line bg-forest-surface p-6 shadow-lg shadow-black/20">
          {!token ? (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white">Invalid link</h2>
              <p className="text-sm text-white/80">
                This password-reset link is missing or malformed. Please request
                a new one.
              </p>
              <Link
                to="/forgot-password"
                className="inline-block text-sm font-medium text-mint hover:text-white hover:underline"
              >
                Request a new link
              </Link>
            </div>
          ) : done ? (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white">
                Password reset
              </h2>
              <p className="text-sm text-white/80">
                Your password has been updated. You can now sign in with your
                new password.
              </p>
              <Link
                to="/login"
                className="inline-block rounded-md bg-mint px-4 py-2 text-sm font-semibold text-forest transition hover:bg-white"
              >
                Go to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="text-lg font-semibold text-white">
                Reset password
              </h2>

              {error && (
                <div className="rounded-md bg-red-500/15 px-3 py-2 text-sm text-red-200 ring-1 ring-red-400/20">
                  {error}
                </div>
              )}

              <div>
                <label className={labelClass}>New password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                  placeholder="New password"
                />
              </div>

              <div>
                <label className={labelClass}>Confirm new password</label>
                <input
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className={inputClass}
                  placeholder="Confirm new password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md bg-mint px-4 py-2 text-sm font-semibold text-forest transition hover:bg-white disabled:opacity-60"
              >
                {loading ? "Resetting…" : "Reset password"}
              </button>

              <p className="text-center text-sm text-mint">
                <Link
                  to="/login"
                  className="font-medium text-white hover:underline"
                >
                  Back to sign in
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
