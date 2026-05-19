# Tests de rendimiento k6 — SIVU

Scripts de carga y stress sobre el backend SIVU (`http://localhost:8080/api/v1`).
Los scripts se ejecutan con el binario `k6` o, preferido para no instalar nada,
con el contenedor oficial `grafana/k6`.

## Pre-requisitos

- Backend SIVU corriendo en `http://localhost:8080`.
- Datos seed cargados:
  ```
  curl -X POST http://localhost:8080/api/v1/admin/seed
  ```
- Docker (si se usa el contenedor) o `k6` instalado nativamente.

## Variables de entorno opcionales

- `SIVU_BASE_URL` — sobreescribe la URL base. Por defecto:
  `http://localhost:8080/api/v1`.

## Scripts disponibles

| Script | Propósito | Endpoint(s) | Carga | Thresholds |
|---|---|---|---|---|
| `login-load.js` | Carga sobre login con varios usuarios seed | `POST /auth/login` | 5 → 30 VUs en 1 min | p(95) < 800 ms, error < 1% |
| `vacantes-stress.js` | Stress de lectura del listado público | `GET /vacantes?estado=PUBLICADA` | 20 VUs constantes 2 min | p(95) < 400 ms, error < 1% |
| `postulaciones-load.js` | Escenario combinado **destructivo** (crea/lista/transiciona postulaciones) | `POST /postulaciones`, `GET /postulaciones`, `PATCH /postulaciones/:id/estado`, `GET /estudiantes`, `GET /vacantes` | 5 → 10 VUs en 1 min | p(95) < 1200 ms, error < 5% |

> ⚠️ `postulaciones-load.js` **deja datos** (postulaciones nuevas y cambios de
> estado). Ejecutar solo contra entornos demo/efímeros. Los 422 por postulación
> duplicada NO cuentan como error (se marcan con `expected_fail:no`/`yes`).

## Cómo correrlos (Docker, recomendado)

Desde `tests/k6/`:

```bash
# Carga de login
docker run --rm -i --network host -v "$PWD":/scripts grafana/k6 run /scripts/login-load.js

# Stress de vacantes
docker run --rm -i --network host -v "$PWD":/scripts grafana/k6 run /scripts/vacantes-stress.js

# Escenario combinado de postulaciones (¡destructivo!)
docker run --rm -i --network host -v "$PWD":/scripts grafana/k6 run /scripts/postulaciones-load.js
```

En Mac/Windows reemplazar `--network host` por usar el hostname del backend
expuesto desde Docker Desktop (`host.docker.internal`):

```bash
docker run --rm -i \
  -e SIVU_BASE_URL=http://host.docker.internal:8080/api/v1 \
  -v "$PWD":/scripts grafana/k6 run /scripts/login-load.js
```

## Cómo correrlos (binario nativo)

```bash
k6 run login-load.js
k6 run vacantes-stress.js
k6 run postulaciones-load.js
```

## Helpers compartidos

`helpers.js` expone:

- `BASE_URL` — base configurable vía `SIVU_BASE_URL`.
- `SEED_USERS` — credenciales de los usuarios demo.
- `login(email, password, tags?)` — login con check + `fail()` en caso de error.
- `jsonHeaders(token?)` — headers JSON con Bearer opcional.
- `expect2xx(res, label)` — check rápido para respuestas 2xx.
