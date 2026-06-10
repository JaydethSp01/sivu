const KEY = "sivu-theme";

export type Theme = "light" | "dark";

export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const v = window.localStorage.getItem(KEY);
  if (v === "dark" || v === "light") return v;
  // Default consistente: SIEMPRE claro si el usuario no eligió tema.
  // (Antes seguía prefers-color-scheme del SO → se veía distinto en cada PC.)
  return "light";
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  if (theme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
  window.localStorage.setItem(KEY, theme);
}
