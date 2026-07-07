import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { ErrorBoundary } from "./components/error-boundary";
import { isChunkLoadError, reloadOnStaleChunk } from "./lib/stale-chunk";
import "./index.css";

// Recuperación automática ante chunks obsoletos tras un redeploy (SPA + code-split).
window.addEventListener("vite:preloadError", (e) => {
  e.preventDefault();
  reloadOnStaleChunk();
});
window.addEventListener("unhandledrejection", (e) => {
  if (isChunkLoadError(e.reason)) reloadOnStaleChunk();
});

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("No se encontró #root");

createRoot(rootEl).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);

// Registro de service worker para habilitar PWA (instalable + caché del shell).
// Solo se activa cuando se sirve el bundle de producción, no en `vite dev`.
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.warn("[PWA] No se pudo registrar el service worker:", err);
    });
  });
}
