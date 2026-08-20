import { useEffect, useRef, useState } from "react";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GIS_SRC = "https://accounts.google.com/gsi/client";

// Load the Google Identity Services script once and resolve when ready.
let gisPromise = null;
function loadGis() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (gisPromise) return gisPromise;

  gisPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${GIS_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Failed to load Google Identity Services"))
      );
      return;
    }
    const script = document.createElement("script");
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Failed to load Google Identity Services"));
    document.head.appendChild(script);
  });

  return gisPromise;
}

/**
 * Renders the official "Sign in with Google" button. Hidden entirely when
 * VITE_GOOGLE_CLIENT_ID is not configured, so the app works without Google set up.
 * Calls `onCredential(idToken)` when the user completes Google sign-in.
 */
export default function GoogleSignInButton({
  onCredential,
  text = "continue_with",
}) {
  const containerRef = useRef(null);
  const onCredentialRef = useRef(onCredential);
  const [error, setError] = useState("");

  // Keep the latest callback without re-initializing GIS.
  useEffect(() => {
    onCredentialRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    let cancelled = false;

    loadGis()
      .then(() => {
        if (cancelled || !containerRef.current || !window.google?.accounts?.id)
          return;

        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => {
            if (response?.credential) {
              onCredentialRef.current?.(response.credential);
            }
          },
        });

        const width = Math.min(
          400,
          Math.max(240, containerRef.current.offsetWidth || 320)
        );

        window.google.accounts.id.renderButton(containerRef.current, {
          theme: "filled_black",
          size: "large",
          shape: "rectangular",
          text,
          width,
          logo_alignment: "center",
        });
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load Google sign-in.");
      });

    return () => {
      cancelled = true;
    };
  }, [text]);

  if (!GOOGLE_CLIENT_ID) return null;

  return (
    <div>
      <div ref={containerRef} className="flex justify-center" />
      {error && (
        <p className="mt-2 text-center text-xs text-red-300">{error}</p>
      )}
    </div>
  );
}
