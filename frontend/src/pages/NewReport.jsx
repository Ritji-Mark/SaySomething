import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createReport } from "../api/reports.js";
import { listCategories } from "../api/categories.js";

export default function NewReport() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const [error, setError] = useState("");
  const [geoError, setGeoError] = useState("");
  const [geoLoading, setGeoLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    listCategories()
      .then((data) => {
        if (active) setCategories(data.categories || []);
      })
      .catch(() => {
        if (active) setError("Failed to load categories.");
      });
    return () => {
      active = false;
    };
  }, []);

  const useMyLocation = () => {
    setGeoError("");
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser.");
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        setGeoLoading(false);
      },
      (err) => {
        setGeoError(err.message || "Unable to retrieve your location.");
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (!categoryId) {
      setError("Please choose a category.");
      return;
    }
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      setError(
        "A location is required. Use “Use my location” or enter coordinates."
      );
      return;
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setError("Coordinates are out of range.");
      return;
    }

    setSubmitting(true);
    try {
      const data = await createReport({
        category_id: Number(categoryId),
        title: title.trim(),
        description: description.trim(),
        latitude: lat,
        longitude: lng,
        address: address.trim() || undefined,
      });
      navigate(`/reports/${data.report.id}`);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to submit the report."
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Report an Issue</h1>
        <Link to="/reports" className="text-sm text-indigo-600 hover:underline">
          ← Back to my reports
        </Link>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-xl bg-white p-6 shadow"
      >
        {error && (
          <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Category
          </label>
          <select
            required
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">Select a category…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Title
          </label>
          <input
            type="text"
            required
            maxLength={150}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="e.g. Broken streetlight on Main St"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Description
          </label>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="Describe the issue in detail…"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Address <span className="text-slate-400">(optional)</span>
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="Nearest street address or landmark"
          />
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Location</span>
            <button
              type="button"
              onClick={useMyLocation}
              disabled={geoLoading}
              className="rounded-md bg-indigo-100 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-200 disabled:opacity-60"
            >
              {geoLoading ? "Locating…" : "📍 Use my location"}
            </button>
          </div>

          {geoError && (
            <p className="mb-3 text-sm text-red-600">{geoError}</p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Latitude
              </label>
              <input
                type="number"
                step="any"
                required
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="-1.286389"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Longitude
              </label>
              <input
                type="number"
                step="any"
                required
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="36.817223"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {submitting ? "Submitting…" : "Submit Report"}
        </button>
      </form>
    </div>
  );
}
