// helpers.js — utilidades comunes para los scripts k6 de SIVU.
//
// Importable desde otros scripts con:
//   import { login, BASE_URL, jsonHeaders, expect2xx } from './helpers.js';
import http from 'k6/http';
import { check, fail } from 'k6';

export const BASE_URL = __ENV.SIVU_BASE_URL || 'http://localhost:8080/api/v1';

export const SEED_USERS = {
  admin: { email: 'admin@uempresarial.edu.co', password: 'Admin123*' },
  coord: { email: 'coord@uempresarial.edu.co', password: 'Coord123*' },
  estudiante: { email: 'kelly@est.uempresarial.edu.co', password: 'Estudiante123*' },
  empresa: { email: 'rrhh@coally.com', password: 'Empresa123*' },
};

export function jsonHeaders(token) {
  const h = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

/**
 * POST /auth/login y retorna el accessToken.
 * En carga preferimos `tags` para distinguir métricas por escenario.
 */
export function login(email, password, tags = {}) {
  const res = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email, password }),
    { headers: jsonHeaders(), tags: { name: 'POST /auth/login', ...tags } }
  );
  const ok = check(res, {
    'login status 200': (r) => r.status === 200,
    'login retorna accessToken': (r) => {
      try { return !!r.json('accessToken'); } catch (_) { return false; }
    },
  });
  if (!ok) {
    fail(`login fallido para ${email}: status=${res.status}`);
  }
  return res.json('accessToken');
}

/**
 * Check helper para respuestas 2xx con etiqueta legible.
 */
export function expect2xx(res, label) {
  return check(res, {
    [`${label} status 2xx`]: (r) => r.status >= 200 && r.status < 300,
  });
}

export const DEFAULT_THRESHOLDS_OK = {
  http_req_failed: ['rate<0.01'],
};
