import axios, { AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "./auth-store";
import type { AuthResponse } from "./types";

const BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:8080/api/v1";

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface RetriableConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken, setSession, clear } = useAuthStore.getState();
  if (!refreshToken) return null;
  try {
    const { data } = await axios.post<AuthResponse>(`${BASE_URL}/auth/refresh`, { refreshToken });
    setSession(data);
    return data.accessToken;
  } catch {
    clear();
    return null;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    if (!original || !error.response) return Promise.reject(error);
    const status = error.response.status;
    const url = original.url ?? "";

    if (status === 401 && !original._retry && !url.includes("/auth/")) {
      original._retry = true;
      if (!refreshing) {
        refreshing = refreshAccessToken().finally(() => {
          refreshing = null;
        });
      }
      const newToken = await refreshing;
      if (newToken) {
        original.headers = { ...(original.headers ?? {}), Authorization: `Bearer ${newToken}` };
        return api.request(original);
      }
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

const STATUS_FRIENDLY: Record<number, string> = {
  400: "Los datos enviados no son válidos.",
  401: "Tu sesión expiró. Vuelve a iniciar sesión.",
  403: "No tienes permiso para esta acción.",
  404: "No encontramos lo que buscabas.",
  409: "Esta acción genera un conflicto con datos existentes.",
  413: "El archivo es demasiado grande.",
  415: "El formato de la solicitud no es válido.",
  422: "Algunos datos no pasaron las validaciones.",
  500: "Ocurrió un error en el servidor. Intenta de nuevo o avisa al equipo.",
  502: "El servidor está caído. Reintenta en unos segundos.",
  503: "Servicio no disponible. Reintenta en unos segundos.",
};

export function extractApiMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as
      | { message?: string; error?: string; errors?: { mensaje: string }[] }
      | undefined;
    const status = error.response?.status;

    if (data?.errors && data.errors.length > 0) {
      return data.errors.map((e) => e.mensaje).join(", ");
    }

    // Para 5xx, los mensajes técnicos del backend ("Internal Server Error")
    // no aportan al usuario. Preferir un fallback amigable.
    if (status && status >= 500) {
      return STATUS_FRIENDLY[status] ?? "Ocurrió un error en el servidor.";
    }

    if (data?.message && data.message !== data.error) return data.message;
    if (status && STATUS_FRIENDLY[status]) return STATUS_FRIENDLY[status];
    if (data?.message) return data.message;
    if (error.code === "ERR_NETWORK") return "Sin conexión con el servidor. Revisa tu red.";
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return "Error desconocido";
}

export { BASE_URL };
