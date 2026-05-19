// vacantes-stress.js — Prueba de stress sobre el listado público de vacantes.
//
// 20 VUs constantes durante 2 minutos sobre GET /vacantes?estado=PUBLICADA.
// Thresholds:
//   - 95% de respuestas por debajo de 400ms
//   - tasa de errores HTTP por debajo de 1%
//
// Ejecutar (contenedor):
//   docker run --rm -i --network host -v $PWD:/scripts grafana/k6 run /scripts/vacantes-stress.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, SEED_USERS, login, jsonHeaders } from './helpers.js';

export const options = {
  scenarios: {
    vacantes_listing: {
      executor: 'constant-vus',
      vus: 20,
      duration: '2m',
      tags: { scenario: 'vacantes-stress' },
    },
  },
  thresholds: {
    'http_req_duration{name:GET /vacantes}': ['p(95)<400'],
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.99'],
  },
};

let token;

export function setup() {
  // Login una sola vez con coordinador (que tiene permisos para listar)
  const t = login(SEED_USERS.coord.email, SEED_USERS.coord.password, { scenario: 'setup' });
  return { token: t };
}

export default function (data) {
  const res = http.get(
    `${BASE_URL}/vacantes?estado=PUBLICADA&page=0&size=20`,
    { headers: jsonHeaders(data.token), tags: { name: 'GET /vacantes' } }
  );
  check(res, {
    'status 200': (r) => r.status === 200,
    'tiene content array': (r) => {
      try { return Array.isArray(r.json('content')); } catch (_) { return false; }
    },
  });
  sleep(0.5);
}
