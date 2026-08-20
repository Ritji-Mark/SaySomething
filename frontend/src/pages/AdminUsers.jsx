import { useEffect, useState } from "react";
import { listUsers, createUser } from "../api/users.js";
import { listAuthorities } from "../api/reference.js";
import { formatDate } from "../utils/format.js";

const ROLE_OPTIONS = [
  { value: 2, label: "Authority" },
  { value: 3, label: "Administrator" },
];

const EMPTY_FORM = {
  full_name: "",
  email: "",
  phone: "",
  password: "",
  role_id: 2,
  authority_id: "",
};

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [authorities, setAuthorities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([listUsers(), listAuthorities()])
      .then(([userData, authData]) => {
        setUsers(userData.users || []);
        setAuthorities(authData.authorities || []);
      })
      .catch((err) =>
        setError(err.response?.data?.message || "Failed to load users.")
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const update = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const isAuthorityRole = Number(form.role_id) === 2;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (isAuthorityRole && !form.authority_id) {
      setFormError("Select an authority for an Authority account.");
      return;
    }

    setSubmitting(true);
    try {
      await createUser({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        password: form.password,
        role_id: Number(form.role_id),
        authority_id: isAuthorityRole ? Number(form.authority_id) : undefined,
      });
      setFormSuccess("Account created successfully.");
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      setFormError(
        err.response?.data?.message || "Failed to create the account."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-md border border-forest-line bg-forest px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-mint focus:outline-none focus:ring-1 focus:ring-mint";
  const labelClass = "mb-1 block text-sm font-medium text-mint";

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-white">Staff &amp; Users</h1>
      <p className="mb-6 text-sm text-mint">
        Create Authority and Administrator accounts and review existing users.
      </p>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Create account */}
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-forest-line bg-forest-surface p-6 lg:col-span-2"
        >
          <h2 className="text-lg font-semibold text-white">Add an account</h2>

          {formError && (
            <div className="rounded-md bg-red-500/15 px-3 py-2 text-sm text-red-200 ring-1 ring-red-400/20">
              {formError}
            </div>
          )}
          {formSuccess && (
            <div className="rounded-md bg-emerald-400/15 px-3 py-2 text-sm text-emerald-200 ring-1 ring-emerald-300/30">
              {formSuccess}
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

          <div>
            <label className={labelClass}>Role</label>
            <select
              value={form.role_id}
              onChange={update("role_id")}
              className={inputClass}
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {isAuthorityRole && (
            <div>
              <label className={labelClass}>Authority</label>
              <select
                required
                value={form.authority_id}
                onChange={update("authority_id")}
                className={inputClass}
              >
                <option value="">Select an authority…</option>
                {authorities.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-white/40">
                Authority staff only see reports routed to this organization.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-mint px-4 py-2 text-sm font-semibold text-forest transition hover:bg-white disabled:opacity-60"
          >
            {submitting ? "Creating…" : "Create account"}
          </button>
        </form>

        {/* Existing users */}
        <div className="lg:col-span-3">
          {loading && <p className="text-mint">Loading…</p>}

          {error && (
            <div className="rounded-md bg-red-500/15 px-4 py-3 text-sm text-red-200 ring-1 ring-red-400/20">
              {error}
            </div>
          )}

          {!loading && !error && (
            <div className="overflow-x-auto rounded-xl border border-forest-line">
              <table className="min-w-full text-sm">
                <thead className="bg-white/5 text-left text-xs uppercase tracking-wide text-mint">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Role</th>
                    <th className="px-4 py-3 font-semibold">Authority</th>
                    <th className="px-4 py-3 font-semibold">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-forest-line">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-white/5">
                      <td className="px-4 py-3">
                        <span className="block font-medium text-white">
                          {u.full_name}
                        </span>
                        <span className="block text-xs text-mint">
                          {u.email}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-mint">{u.role}</td>
                      <td className="px-4 py-3 text-mint">
                        {u.authority || "—"}
                      </td>
                      <td className="px-4 py-3 text-mint">
                        {formatDate(u.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
