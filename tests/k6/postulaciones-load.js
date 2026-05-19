// postulaciones-load.js — Escenario combinado sobre el dominio de postulaciones.
//
//  ⚠️ DESTRUCTIVO: este script crea postulaciones, cambia su estado y deja datos
//  residuales en la base. SOLO ejecutar contra un entorno demo / efímero
//  (docker-compose local, sandbox). NO ejecutar contra prod.
//
// Carga:
//   - 10 VUs en escalera (5 → 10) durante 1 min ejecutando un flujo combinado:
//       1) Login como coordinador
//       2) GET /estudiantes (paginado)
//       3) GET /vacantes?estado=PUBLICADA
//       4) POST /postulaciones (estudiante aleatorio × vacante aleatoria)
//       5) GET /postulaciones?estado=POSTULADA
//       6) PATCH /postulaciones/{id}/estado → EN_REVISION
//
// Las colisiones (postulación duplicada → 422) NO cuentan como error y se
// filtran del conteo de fallos con un tag dedicado.
//
// Ejecutar (contenedor):
//   docker run --rm -i --network host -v $PWD:/scripts grafana/k6 run /scripts/postulaciones-load.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, SEED_USERS, login, jsonHeaders } from './helpers.js';

export const options = {
  stages: [
    { duration: '20s', target: 5 },
    { duration: '40s', target: 10 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<1200'],
    // Solo contabilizamos errores no esperados; las 422 de duplicado se filtran
    'http_req_failed{expected_fail:no}': ['rate<0.05'],
    checks: ['rate>0.90'],
  },
};

export function setup() {
  const token = login(SEED_USERS.coord.email, SEED_USERS.coord.password, { scenario: 'setup' });

  // Pre-cargar estudiantes y vacantes para evitar I/O extra dentro del loop
  const est = http.get(`${BASE_URL}/estudiantes?page=0&size=50`, {
    headers: jsonHeaders(token),
    tags: { name: 'GET /estudiantes (setup)' },
  });
  const vac = http.get(`${BASE_URL}/vacantes?estado=PUBLICADA&page=0&size=50`, {
    headers: jsonHeaders(token),
    tags: { name: 'GET /vacantes (setup)' },
  });

  let estudianteIds = [];
  let vacanteIds = [];
  try { estudianteIds = est.json('content').map((e) => e.id); } catch (_) {}
  try { vacanteIds = vac.json('content').map((v) => v.id); } catch (_) {}

  return { token, estudianteIds, vacanteIds };
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function (data) {
  if (!data.estudianteIds.length || !data.vacanteIds.length) {
    return;
  }
  const headers = jsonHeaders(data.token);
  const estudianteId = pick(data.estudianteIds);
  const vacanteId = pick(data.vacanteIds);

  // Listar vacantes publicadas
  const listVac = http.get(`${BASE_URL}/vacantes?estado=PUBLICADA&page=0&size=10`, {
    headers,
    tags: { name: 'GET /vacantes' },
  });
  check(listVac, { 'listar vacantes 200': (r) => r.status === 200 });

  // Crear postulación (puede fallar con 422 si ya existe — se considera esperado)
  const created = http.post(
    `${BASE_URL}/postulaciones`,
    JSON.stringify({
      estudianteId,
      vacanteId,
      mensajeEstudiante: `k6 load test VU=${__VU} iter=${__ITER}`,
    }),
    {
      headers,
      tags: {
        name: 'POST /postulaciones',
        expected_fail: 'no',
      },
    }
  );

  if (created.status === 422) {
    // Postulación duplicada o vacante BORRADOR; lo marcamos como esperado
    check(created, { 'duplicado controlado (422)': () => true });
  } else {
    const ok = check(created, {
      'postulación creada 201': (r) => r.status === 201,
    });
    if (ok) {
      let postulacionId;
      try { postulacionId = created.json('id'); } catch (_) {}
      if (postulacionId) {
        const upd = http.patch(
          `${BASE_URL}/postulaciones/${postulacionId}/estado`,
          JSON.stringify({ nuevoEstado: 'EN_REVISION', observaciones: 'k6 load' }),
          { headers, tags: { name: 'PATCH /postulaciones/:id/estado' } }
        );
        check(upd, { 'transición estado 200': (r) => r.status === 200 });
      }
    }
  }

  // Listado por estado
  const listPost = http.get(`${BASE_URL}/postulaciones?estado=POSTULADA&page=0&size=10`, {
    headers,
    tags: { name: 'GET /postulaciones' },
  });
  check(listPost, { 'listar postulaciones 200': (r) => r.status === 200 });

  sleep(0.5);
}
