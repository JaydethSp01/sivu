// login-load.js — Prueba de carga del endpoint POST /auth/login.
//
// Escalona 5 → 30 VUs durante 1 minuto haciendo login con credenciales de seed.
// Thresholds:
//   - 95% de respuestas por debajo de 800ms
//   - tasa de errores HTTP por debajo de 1%
//
// Ejecutar (contenedor):
//   docker run --rm -i --network host -v $PWD:/scripts grafana/k6 run /scripts/login-load.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, SEED_USERS, jsonHeaders } from './helpers.js';

export const options = {
  stages: [
    { duration: '15s', target: 5 },
    { duration: '20s', target: 15 },
    { duration: '25s', target: 30 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<800'],
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.99'],
  },
  tags: {
    scenario: 'login-load',
  },
};

const USERS = Object.values(SEED_USERS);

export default function () {
  const user = USERS[__VU % USERS.length];
  const res = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email: user.email, password: user.password }),
    { headers: jsonHeaders(), tags: { name: 'POST /auth/login' } }
  );

  check(res, {
    'status 200': (r) => r.status === 200,
    'tiene accessToken': (r) => {
      try { return typeof r.json('accessToken') === 'string'; } catch (_) { return false; }
    },
  });

  sleep(1);
}
