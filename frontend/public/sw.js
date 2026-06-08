// Service Worker mínimo para SIVU — convierte la app en PWA instalable.
// Estrategia:
//   - "App shell" (HTML + manifest + logo) → cache-first.
//   - API y assets versionados de Vite → network-first con fallback a cache.
// El objetivo de esta versión es habilitar el install banner + funcionamiento
// offline básico para la pantalla de login y el shell. No es un offline-first
// completo (los datos vienen del backend cuando hay red).

const CACHE_NAME = "sivu-shell-v1";
const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/brand/uniempresarial-logo.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Nunca cachear llamadas al backend — siempre red.
  if (url.pathname.startsWith("/api/")) return;

  // Para navegación HTML: network-first, fallback a app shell.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match("/index.html"))
    );
    return;
  }

  // Para assets estáticos: cache-first.
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((resp) => {
          // Solo cachear respuestas OK del mismo origen.
          if (resp.ok && url.origin === self.location.origin) {
            const copy = resp.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, copy));
          }
          return resp;
        })
        .catch(() => cached);
    })
  );
});
