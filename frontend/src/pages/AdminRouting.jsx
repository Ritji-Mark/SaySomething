import { useEffect, useState } from "react";
import { listCategories, updateCategoryRouting } from "../api/categories.js";
import { listAuthorities, listDepartments } from "../api/reference.js";

const inputClass =
  "w-full rounded-md border border-forest-line bg-forest px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-mint focus:outline-none focus:ring-1 focus:ring-mint";

// One editable row: owns its own department list for the chosen authority,
// reusing the dependent-select mechanics from the report assignment panel.
function CategoryRoutingRow({ category, authorities, onSaved }) {
  const [authorityId, setAuthorityId] = useState(
    category.default_authority_id ? String(category.default_authority_id) : ""
  );
  const [deptId, setDeptId] = useState(
    category.default_department_id ? String(category.default_department_id) : ""
  );
  const [departments, setDepartments] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load departments whenever the chosen authority changes (incl. on mount,
  // so a pre-set department resolves to its name).
  useEffect(() => {
    if (!authorityId) {
      setDepartments([]);
      return;
    }
    let active = true;
    listDepartments(authorityId)
      .then((d) => active && setDepartments(d.departments || []))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [authorityId]);

  const handleSave = async () => {
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      await updateCategoryRouting(category.id, {
        authority_id: authorityId ? Number(authorityId) : null,
        department_id: deptId ? Number(deptId) : null,
      });
      setSuccess("Saved");
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <tr className="align-top hover:bg-white/5">
      <td className="px-4 py-3">
        <span className="block font-medium text-white">{category.name}</span>
        {category.description && (
          <span className="block text-xs text-mint">{category.description}</span>
        )}
      </td>
      <td className="px-4 py-3">
        <select
          value={authorityId}
          onChange={(e) => {
            setAuthorityId(e.target.value);
            setDeptId("");
            setSuccess("");
          }}
          className={inputClass}
        >
          <option value="">Unassigned (admin queue)</option>
          {authorities.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </td>
      <td className="px-4 py-3">
        <select
          value={deptId}
          onChange={(e) => {
            setDeptId(e.target.value);
            setSuccess("");
          }}
          disabled={!authorityId || departments.length === 0}
          className={`${inputClass} disabled:opacity-50`}
        >
          <option value="">
            {authorityId ? "No specific department" : "Choose an authority first"}
          </option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </td>
      <td className="px-4 py-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-mint px-4 py-2 text-sm font-semibold text-forest transition hover:bg-white disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        {error && <p className="mt-1 text-xs text-red-300">{error}</p>}
        {success && <p className="mt-1 text-xs text-emerald-300">{success}</p>}
      </td>
    </tr>
  );
}

export default function AdminRouting() {
  const [categories, setCategories] = useState([]);
  const [authorities, setAuthorities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    Promise.all([listCategories(), listAuthorities()])
      .then(([catData, authData]) => {
        setCategories(catData.categories || []);
        setAuthorities(authData.authorities || []);
      })
      .catch((err) =>
        setError(err.response?.data?.message || "Failed to load routing.")
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-white">Category routing</h1>
      <p className="mb-6 text-sm text-mint">
        Map each report category to the authority responsible for it. New
        reports in a mapped category are assigned automatically; unmapped
        categories go to the admin queue for manual assignment.
      </p>

      {loading && <p className="text-mint">Loading…</p>}

      {error && (
        <div className="rounded-md bg-red-500/15 px-4 py-3 text-sm text-red-200 ring-1 ring-red-400/20">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="overflow-x-auto rounded-xl border border-forest-line">
          <table className="w-full min-w-180 text-sm">
            <thead className="bg-white/5 text-left text-xs uppercase tracking-wide text-mint">
              <tr>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Route to authority</th>
                <th className="px-4 py-3 font-semibold">Department</th>
                <th className="px-4 py-3 font-semibold">&nbsp;</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-forest-line">
              {categories.map((c) => (
                <CategoryRoutingRow
                  key={c.id}
                  category={c}
                  authorities={authorities}
                  onSaved={load}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {authorities.length === 0 && !loading && !error && (
        <p className="mt-4 text-sm text-mint">
          No authorities exist yet. Create one on the Authorities page before
          setting up routing.
        </p>
      )}
    </div>
  );
}
