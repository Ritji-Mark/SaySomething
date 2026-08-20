import { useState } from "react";
import { Link } from "react-router-dom";
import { requestPasswordReset } from "../api/auth.js";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setSubmitted(true);
    } catch (err) {
      setError(
        err.response?.data?.message || "Something went wrong. Please try again."
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
          <p className="mt-1 text-sm text-mint">Reset your password.</p>
        </div>

        <div className="rounded-xl border border-forest-line bg-forest-surface p-6 shadow-lg shadow-black/20">
          {submitted ? (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white">
                Check your email
              </h2>
              <p className="text-sm text-white/80">
                If an account exists for{" "}
                <span className="text-white">{email}</span>, we&apos;ve sent a
                link to reset your password. The link expires in 1 hour.
              </p>
              <Link
                to="/login"
                className="inline-block text-sm font-medium text-mint hover:text-white hover:underline"
              >
                ← Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="text-lg font-semibold text-white">
                Forgot password
              </h2>
              <p className="text-sm text-white/70">
                Enter your email and we&apos;ll send you a link to reset your
                password.
              </p>

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

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md bg-mint px-4 py-2 text-sm font-semibold text-forest transition hover:bg-white disabled:opacity-60"
              >
                {loading ? "Sending…" : "Send reset link"}
              </button>

              <p className="text-center text-sm text-mint">
                Remembered it?{" "}
                <Link
                  to="/login"
                  className="font-medium text-white hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
