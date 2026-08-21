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
      setGeoError("Geolocation isn't supported by your browser.");
      return;
    }
    // Geolocation only works over HTTPS (or localhost). On a plain-HTTP page —
    // e.g. opening the dev server via a LAN IP — the browser blocks it, which
    // otherwise surfaces as a confusing generic "unavailable" failure.
    if (!window.isSecureContext) {
      setGeoError(
        "Location needs a secure (HTTPS) connection. Open the site over HTTPS and try again."
      );
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
        // Map the browser's error code to something actionable.
        let message;
        switch (err.code) {
          case err.PERMISSION_DENIED:
            message =
              "Location permission was denied. Allow location access for this site in your browser settings, then try again.";
            break;
          case err.POSITION_UNAVAILABLE:
            message =
              "Your location is currently unavailable. Check that your device's location services are turned on, then try again.";
            break;
          case err.TIMEOUT:
            message = "Getting your location took too long. Please try again.";
            break;
          default:
            message = "Unable to retrieve your location. Please try again.";
        }
        setGeoError(message);
        setGeoLoading(false);
      },
      // enableHighAccuracy is intentionally off: on desktops without GPS it
      // often times out or reports the position as unavailable, whereas coarse
      // (WiFi / IP) location resolves quickly. maximumAge accepts a recent fix.
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
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
        "A location is required. Tap “Use my location” to attach your current position."
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
      setError(err.response?.data?.message || "Failed to submit the report.");
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-md border border-forest-line bg-forest px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-mint focus:outline-none focus:ring-1 focus:ring-mint";
  const labelClass = "mb-1 block text-sm font-medium text-mint";

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-white">Report an Issue</h1>
        <Link to="/reports" className="shrink-0 text-sm text-mint hover:text-white hover:underline">
          ← Back to my reports
        </Link>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-xl border border-forest-line bg-forest-surface p-6"
      >
        {error && (
          <div className="rounded-md bg-red-500/15 px-3 py-2 text-sm text-red-200 ring-1 ring-red-400/20">
            {error}
          </div>
        )}

        <div>
          <label className={labelClass}>Category</label>
          <select
            required
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={inputClass}
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
          <label className={labelClass}>Title</label>
          <input
            type="text"
            required
            maxLength={150}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
            placeholder="Title"
          />
        </div>

        <div>
          <label className={labelClass}>Description</label>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputClass}
            placeholder="Description"
          />
        </div>

        <div>
          <label className={labelClass}>
            Address <span className="text-white/40">(optional)</span>
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className={inputClass}
            placeholder="Address"
          />
        </div>

        <div className="rounded-lg border border-forest-line bg-forest p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-white">Location</span>
            <button
              type="button"
              onClick={useMyLocation}
              disabled={geoLoading}
              className="rounded-md border border-white/15 bg-white/5 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-60"
            >
              {geoLoading ? "Locating…" : "Use my location"}
            </button>
          </div>

          {geoError && <p className="mb-3 text-sm text-red-300">{geoError}</p>}

          {latitude && longitude ? (
            <div className="flex items-center gap-2 rounded-md border border-mint/30 bg-mint/10 px-3 py-2 text-sm text-white">
              <span aria-hidden="true">📍</span>
              <span>
                Location captured
                <span className="ml-1 font-mono text-xs text-mint">
                  ({latitude}, {longitude})
                </span>
              </span>
            </div>
          ) : (
            <p className="text-sm text-white/60">
              Tap <span className="font-medium text-white">Use my location</span>{" "}
              to attach your current position — required to submit a report.
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-mint px-4 py-2 text-sm font-semibold text-forest transition hover:bg-white disabled:opacity-60"
        >
          {submitting ? "Submitting…" : "Submit Report"}
        </button>
      </form>
    </div>
  );
}
