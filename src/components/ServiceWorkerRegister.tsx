"use client";

import { useEffect } from "react";

// Registers the app-shell service worker. Production-only: in dev the SW would
// cache Turbopack/HMR chunks and serve stale code. Renders nothing.
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // registration failure is non-fatal — app still works online
      });
    };

    if (document.readyState === "complete") register();
    else {
      window.addEventListener("load", register);
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
