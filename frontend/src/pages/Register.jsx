import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { homePathForRole } from "../utils/roles.js";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await register({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        password: form.password,
      });
      navigate(homePathForRole(user.role), { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message || "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-md border border-forest-line bg-forest px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-mint focus:outline-none focus:ring-1 focus:ring-mint";
  const labelClass = "mb-1 block text-sm font-medium text-mint";

  return (
    <div className="flex min-h-screen items-center justify-center bg-forest px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <img src="/logo.png" alt="SaySomething" className="mb-3 h-14 w-14" />
          <h1 className="text-2xl font-bold text-white">SaySomething</h1>
          <p className="mt-1 text-sm text-mint">
            Create an account to start reporting issues.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-forest-line bg-forest-surface p-6 shadow-lg shadow-black/20"
        >
          <h2 className="text-lg font-semibold text-white">Create your account</h2>

          {error && (
            <div className="rounded-md bg-red-500/15 px-3 py-2 text-sm text-red-200 ring-1 ring-red-400/20">
              {error}
            </div>
          )}

          <div>
            <label className={labelClass}>Full name</label>
            <input
              type="text"
              required
              value={form.full_name}
              onChange={update("full_name")}
              className={inputClass}
              placeholder="Full name"
            />
          </div>

          <div>
            <label className={labelClass}>Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={update("email")}
              className={inputClass}
              placeholder="Email"
            />
          </div>

          <div>
            <label className={labelClass}>
              Phone <span className="text-white/40">(optional)</span>
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={update("phone")}
              className={inputClass}
              placeholder="Phone number"
            />
          </div>

          <div>
            <label className={labelClass}>Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={update("password")}
              className={inputClass}
              placeholder="Password (min 6 characters)"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-mint px-4 py-2 text-sm font-semibold text-forest transition hover:bg-white disabled:opacity-60"
          >
            {loading ? "Creating account…" : "Create account"}
          </button>

          <p className="text-center text-sm text-mint">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-white hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
