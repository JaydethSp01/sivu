/**
 * Recuperación automática ante "chunks obsoletos".
 *
 * En una SPA con carga perezosa (code-splitting), tras un nuevo despliegue los
 * archivos JS cambian de hash. Una pestaña abierta con la versión anterior sigue
 * pidiendo los hashes viejos; al navegar a una ruta nueva, ese import falla y la
 * pantalla se rompe. La solución estándar es recargar la página para traer el
 * index.html y los chunks nuevos.
 */

/** ¿El error corresponde a un chunk/módulo dinámico que no se pudo cargar? */
export function isChunkLoadError(err: unknown): boolean {
  const msg = (err instanceof Error ? err.message : String(err ?? "")).toLowerCase();
  return (
    msg.includes("dynamically imported module") ||
    msg.includes("module script failed") ||
    msg.includes("importing a module script failed") ||
    msg.includes("loading chunk") ||
    msg.includes("chunkloaderror") ||
    msg.includes("failed to fetch")
  );
}

/**
 * Recarga la página una sola vez ante un chunk obsoleto. Usa un sello de tiempo
 * en sessionStorage para no entrar en un bucle si el recurso realmente no existe.
 */
export function reloadOnStaleChunk(): void {
  try {
    const KEY = "sivu-chunk-reload-ts";
    const last = Number(sessionStorage.getItem(KEY) || 0);
    if (Date.now() - last < 10_000) return; // ya recargamos hace poco → evita loop
    sessionStorage.setItem(KEY, String(Date.now()));
  } catch {
    /* sessionStorage no disponible: recargamos igual */
  }
  window.location.reload();
}
