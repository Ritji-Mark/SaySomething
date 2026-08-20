import { useEffect, useState } from "react";
import {
  listAuthorities,
  listDepartments,
  createAuthority,
  updateAuthority,
  createDepartment,
} from "../api/reference.js";

const EMPTY_AUTHORITY = {
  id: null,
  name: "",
  description: "",
  contact_email: "",
  contact_phone: "",
  address: "",
};

const EMPTY_DEPARTMENT = {
  authority_id: "",
  name: "",
  description: "",
};

export default function AdminAuthorities() {
  const [authorities, setAuthorities] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Authority create/edit form (edit mode when authForm.id is set)
  const [authForm, setAuthForm] = useState(EMPTY_AUTHORITY);
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [authSaving, setAuthSaving] = useState(false);

  // Department create form
  const [deptForm, setDeptForm] = useState(EMPTY_DEPARTMENT);
  const [deptError, setDeptError] = useState("");
  const [deptSuccess, setDeptSuccess] = useState("");
  const [deptSaving, setDeptSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([listAuthorities(), listDepartments()])
      .then(([authData, deptData]) => {
        setAuthorities(authData.authorities || []);
        setDepartments(deptData.departments || []);
      })
      .catch((err) =>
        setError(err.response?.data?.message || "Failed to load authorities.")
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const updateAuth = (field) => (e) =>
    setAuthForm((prev) => ({ ...prev, [field]: e.target.value }));
  const updateDept = (field) => (e) =>
    setDeptForm((prev) => ({ ...prev, [field]: e.target.value }));

  const editing = authForm.id !== null;

  const startEdit = (a) => {
    setAuthError("");
    setAuthSuccess("");
    setAuthForm({
      id: a.id,
      name: a.name || "",
      description: a.description || "",
      contact_email: a.contact_email || "",
      contact_phone: a.contact_phone || "",
      address: a.address || "",
    });
  };

  const cancelEdit = () => {
    setAuthForm(EMPTY_AUTHORITY);
    setAuthError("");
    setAuthSuccess("");
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");
    if (!authForm.name.trim()) {
      setAuthError("Authority name is required.");
      return;
    }
    const payload = {
      name: authForm.name.trim(),
      description: authForm.description.trim() || undefined,
      contact_email: authForm.contact_email.trim() || undefined,
      contact_phone: authForm.contact_phone.trim() || undefined,
      address: authForm.address.trim() || undefined,
    };
    setAuthSaving(true);
    try {
      if (editing) {
        await updateAuthority(authForm.id, payload);
        setAuthSuccess("Authority updated.");
      } else {
        await createAuthority(payload);
        setAuthSuccess("Authority created.");
      }
      setAuthForm(EMPTY_AUTHORITY);
      load();
    } catch (err) {
      setAuthError(
        err.response?.data?.message || "Failed to save the authority."
      );
    } finally {
      setAuthSaving(false);
    }
  };

  const handleDeptSubmit = async (e) => {
    e.preventDefault();
    setDeptError("");
    setDeptSuccess("");
    if (!deptForm.authority_id) {
      setDeptError("Choose the parent authority.");
      return;
    }
    if (!deptForm.name.trim()) {
      setDeptError("Department name is required.");
      return;
    }
    setDeptSaving(true);
    try {
      await createDepartment({
        authority_id: Number(deptForm.authority_id),
        name: deptForm.name.trim(),
        description: deptForm.description.trim() || undefined,
      });
      setDeptSuccess("Department created.");
      setDeptForm(EMPTY_DEPARTMENT);
      load();
    } catch (err) {
      setDeptError(
        err.response?.data?.message || "Failed to create the department."
      );
    } finally {
      setDeptSaving(false);
    }
  };

  const inputClass =
    "w-full rounded-md border border-forest-line bg-forest px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-mint focus:outline-none focus:ring-1 focus:ring-mint";
  const labelClass = "mb-1 block text-sm font-medium text-mint";
  const primaryBtn =
    "rounded-md bg-mint px-4 py-2 text-sm font-semibold text-forest transition hover:bg-white disabled:opacity-60";

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-white">Authorities</h1>
      <p className="mb-6 text-sm text-mint">
        Create the organizations that handle reports and the departments within
        them. Assign categories to authorities on the{" "}
        <span className="text-white">Routing</span> page.
      </p>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Forms */}
        <div className="space-y-6 lg:col-span-2">
          {/* Authority create/edit */}
          <form
            onSubmit={handleAuthSubmit}
            className="space-y-4 rounded-xl border border-forest-line bg-forest-surface p-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">
                {editing ? "Edit authority" : "Add an authority"}
              </h2>
              {editing && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="text-xs text-mint hover:text-white hover:underline"
                >
                  Cancel
                </button>
              )}
            </div>

            {authError && (
              <div className="rounded-md bg-red-500/15 px-3 py-2 text-sm text-red-200 ring-1 ring-red-400/20">
                {authError}
              </div>
            )}
            {authSuccess && (
              <div className="rounded-md bg-emerald-400/15 px-3 py-2 text-sm text-emerald-200 ring-1 ring-emerald-300/30">
                {authSuccess}
              </div>
            )}

            <div>
              <label className={labelClass}>Name</label>
              <input
                type="text"
                required
                value={authForm.name}
                onChange={updateAuth("name")}
                className={inputClass}
                placeholder="Organization name"
              />
            </div>
            <div>
              <label className={labelClass}>
                Description <span className="text-white/40">(optional)</span>
              </label>
              <textarea
                rows={2}
                value={authForm.description}
                onChange={updateAuth("description")}
                className={inputClass}
                placeholder="What this authority is responsible for"
              />
            </div>
            <div>
              <label className={labelClass}>
                Contact email <span className="text-white/40">(optional)</span>
              </label>
              <input
                type="email"
                value={authForm.contact_email}
                onChange={updateAuth("contact_email")}
                className={inputClass}
                placeholder="Contact email"
              />
            </div>
            <div>
              <label className={labelClass}>
                Contact phone <span className="text-white/40">(optional)</span>
              </label>
              <input
                type="tel"
                value={authForm.contact_phone}
                onChange={updateAuth("contact_phone")}
                className={inputClass}
                placeholder="Contact phone"
              />
            </div>
            <div>
              <label className={labelClass}>
                Address <span className="text-white/40">(optional)</span>
              </label>
              <input
                type="text"
                value={authForm.address}
                onChange={updateAuth("address")}
                className={inputClass}
                placeholder="Address"
              />
            </div>
            <button type="submit" disabled={authSaving} className={primaryBtn}>
              {authSaving
                ? "Saving…"
                : editing
                ? "Save changes"
                : "Create authority"}
            </button>
          </form>

          {/* Department create */}
          <form
            onSubmit={handleDeptSubmit}
            className="space-y-4 rounded-xl border border-forest-line bg-forest-surface p-6"
          >
            <h2 className="text-lg font-semibold text-white">Add a department</h2>

            {deptError && (
              <div className="rounded-md bg-red-500/15 px-3 py-2 text-sm text-red-200 ring-1 ring-red-400/20">
                {deptError}
              </div>
            )}
            {deptSuccess && (
              <div className="rounded-md bg-emerald-400/15 px-3 py-2 text-sm text-emerald-200 ring-1 ring-emerald-300/30">
                {deptSuccess}
              </div>
            )}

            <div>
              <label className={labelClass}>Authority</label>
              <select
                value={deptForm.authority_id}
                onChange={updateDept("authority_id")}
                className={inputClass}
              >
                <option value="">Select an authority…</option>
                {authorities.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Department name</label>
              <input
                type="text"
                value={deptForm.name}
                onChange={updateDept("name")}
                className={inputClass}
                placeholder="e.g. Roads and Infrastructure"
              />
            </div>
            <div>
              <label className={labelClass}>
                Description <span className="text-white/40">(optional)</span>
              </label>
              <textarea
                rows={2}
                value={deptForm.description}
                onChange={updateDept("description")}
                className={inputClass}
                placeholder="What this department handles"
              />
            </div>
            <button type="submit" disabled={deptSaving} className={primaryBtn}>
              {deptSaving ? "Saving…" : "Create department"}
            </button>
          </form>
        </div>

        {/* Authority list */}
        <div className="lg:col-span-3">
          {loading && <p className="text-mint">Loading…</p>}

          {error && (
            <div className="rounded-md bg-red-500/15 px-4 py-3 text-sm text-red-200 ring-1 ring-red-400/20">
              {error}
            </div>
          )}

          {!loading && !error && authorities.length === 0 && (
            <p className="text-sm text-mint">
              No authorities yet. Create one to get started.
            </p>
          )}

          {!loading && !error && authorities.length > 0 && (
            <div className="space-y-4">
              {authorities.map((a) => {
                const depts = departments.filter(
                  (d) => Number(d.authority_id) === Number(a.id)
                );
                return (
                  <div
                    key={a.id}
                    className="rounded-xl border border-forest-line bg-forest-surface p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-white">{a.name}</h3>
                        {a.description && (
                          <p className="mt-1 text-sm text-white/70">
                            {a.description}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => startEdit(a)}
                        className="shrink-0 rounded-md border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/10"
                      >
                        Edit
                      </button>
                    </div>

                    {(a.contact_email || a.contact_phone || a.address) && (
                      <div className="mt-3 space-y-0.5 text-xs text-mint">
                        {a.contact_email && <p>{a.contact_email}</p>}
                        {a.contact_phone && <p>{a.contact_phone}</p>}
                        {a.address && <p>{a.address}</p>}
                      </div>
                    )}

                    <div className="mt-3 border-t border-forest-line pt-3">
                      <p className="mb-1.5 text-xs uppercase tracking-wide text-mint">
                        Departments
                      </p>
                      {depts.length === 0 ? (
                        <p className="text-xs text-white/40">None yet.</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {depts.map((d) => (
                            <span
                              key={d.id}
                              className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-white"
                            >
                              {d.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
