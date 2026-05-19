# Sprint Backlog — Sprint 1

| Campo | Valor |
|---|---|
| Sprint | 1 |
| Fechas | 2026-05-04 → 2026-05-17 (2 semanas) |
| Duración | 10 días hábiles |
| Capacidad declarada | 50 SP (8 devs × ~6 SP útiles + holguras) |
| Velocidad real medida | 47 SP (1 historia quedó parcial y pasa a Sprint 2) |
| Scrum Master | Jaydeth Sandoval |
| Product Owner | Kellyn Johanna Delgado Jaimes |

---

## Objetivo del Sprint

> **Tener autenticación funcional y CRUDs base operativos con Swagger, tests unitarios y pipeline CI configurado.**

Al final del sprint debemos poder: registrar usuarios, iniciar sesión con JWT, consumir los CRUDs principales del dominio, ver Swagger UI corriendo, ejecutar la suite de pruebas unitarias con cobertura ≥ 70 % y tener el workflow de CI verde en GitHub Actions.

---

## Sprint Backlog

| ID | Historia | Asignado | Estimación (SP) | Estado | Notas |
|---|---|---|---|---|---|
| US-001 | Registro de usuario | Andrés Ríos | 3 | Done | `POST /api/v1/auth/register` con persistencia en MongoDB (colección `users`). |
| US-002 | Login con JWT | Andrés Ríos | 5 | Done | `POST /api/v1/auth/login`. Token HS256 con expiración 1 h. |
| US-003 | Refresh token | Juan Pablo Caicedo | 3 | Done | `POST /api/v1/auth/refresh`. Refresh token con expiración 7 días. |
| US-004 | Control de acceso por rol | Andrés Ríos | 5 | Done | Anotaciones `@PreAuthorize` por endpoint. Roles: ADMIN, COORDINADOR, ESTUDIANTE, EMPRESA, MCP_AGENT. |
| US-005 | CRUD Estudiantes | Sergio Vargas | 5 | Done | `/api/v1/estudiantes`. Mapper con MapStruct. |
| US-006 | CRUD Empresas | Sergio Vargas | 3 | Done | `/api/v1/empresas`. |
| US-007 | CRUD Vacantes | Juan Pablo Caicedo | 5 | Done | `/api/v1/vacantes`. Incluye filtro por estado y empresa. |
| US-008 | CRUD Postulaciones | Juan Pablo Caicedo | 5 | InProgress | `/api/v1/postulaciones`. Falta validación cruzada de vacante activa; **pasa a Sprint 2 con 2 SP restantes**. |
| US-009 | CRUD Documentos | Sergio Vargas | 5 | Done | `/api/v1/documentos`. Upload multipart guardado en volumen `./data/docs`. |
| US-022 | Swagger / OpenAPI publicado | Andrés Ríos | 2 | Done | springdoc-openapi 2.x en `/swagger-ui.html` y `/v3/api-docs`. |
| US-023 | Tests unitarios + JaCoCo ≥ 70 % | Laura Camila Pinzón | 3 | Done | JUnit 5 + Mockito. Cobertura global 72.4 %. |
| US-028 | Pipeline CI en GitHub Actions | Sebastián Quintero | 5 | Done | `.github/workflows/ci.yml` con stages `build`, `test`, `sonar-preview`. |
| US-030 | Despliegue local reproducible | Sebastián Quintero | 2 | Done | `docker-compose.yml` + `docker-compose.dev.yml` + `Makefile` con `make up`, `make seed`, `make dev-deps`. |

**Total comprometido:** 51 SP · **Total entregado:** 49 SP · **Carry over:** US-008 (2 SP) → Sprint 2.

---

## Tareas técnicas (desglose por historia)

### US-001 Registro de usuario
- US-001.T1 — Esquema Mongo `users` (email único, password bcrypt, rol, fechas).
- US-001.T2 — Endpoint `POST /api/v1/auth/register` + DTO + validación bean.
- US-001.T3 — Test unitario `AuthRegisterServiceTest`.

### US-002 Login con JWT
- US-002.T1 — `JwtService` (firma HS256, claims `sub`, `role`, `exp`).
- US-002.T2 — Endpoint `POST /api/v1/auth/login`.
- US-002.T3 — Filtro `JwtAuthenticationFilter`.
- US-002.T4 — Tests unitarios y test de integración con `MockMvc`.

### US-004 Control de acceso por rol
- US-004.T1 — `SecurityConfig` con `SecurityFilterChain`.
- US-004.T2 — Anotar controladores con `@PreAuthorize("hasRole('XXX')")`.
- US-004.T3 — Tests `@WithMockUser` por rol y endpoint.

### US-005 / US-006 / US-007 / US-009 CRUDs
- Repos JPA con `JpaRepository`, services, controladores REST, mappers MapStruct, validaciones bean.
- Tests unitarios de service y tests web con `@WebMvcTest`.

### US-028 Pipeline CI
- US-028.T1 — Workflow `ci.yml` con triggers `pull_request` y `push: main`.
- US-028.T2 — Jobs `build-backend` (Java 21), `build-frontend` (Node 20), `unit-tests` (JaCoCo report).
- US-028.T3 — Job `sonar-preview` corriendo `sonar-scanner` en modo PR.

---

## Daily highlights (resumen)

| Día | Hito |
|---|---|
| L 04-may | Planning. Configuración del repo monorepo. Skeleton Spring Boot. |
| M 05-may | Esqueleto MongoDB + esquema `users`. Skeleton React + shadcn/ui. |
| X 06-may | `JwtService` + filtro. Primer endpoint `/auth/register` verde. |
| J 07-may | Login funcional contra Mongo. Workflow CI básico verde. |
| V 08-may | CRUD Estudiantes terminado. Swagger UI publicado. |
| L 11-may | CRUD Empresas, Vacantes en progreso. Mapper MapStruct integrado. |
| M 12-may | Refresh token cerrado. Roles y `@PreAuthorize` aplicados. |
| X 13-may | Refinement Sprint 2. CRUD Documentos terminado. |
| J 14-may | CRUD Postulaciones bloqueado por discusión de modelo (estado vs sub-estado). |
| V 15-may | Cobertura JaCoCo a 72.4 %. Pipeline CI verde extremo a extremo. |
| L 18-may | (Review + Retro del viernes 15) — se decide cerrar Sprint 1 con US-008 parcial. |

---

## Burndown chart (story points)

```
SP restantes
51 |█
   |██
45 |███
   |████
40 |█████
   |██████
35 |███████
   |████████
30 |█████████
   |██████████
25 |███████████
   |████████████
20 |█████████████
   |██████████████
15 |███████████████
   |████████████████
10 |█████████████████
   |██████████████████
 5 |███████████████████  (parcial US-008)
   |████████████████████
 0 +────────────────────────────────────────
    L  M  X  J  V  L  M  X  J  V
    04 05 06 07 08 11 12 13 14 15

  ──── ideal     ▓▓▓▓ real
```

| Día | Ideal restante | Real restante |
|---|---|---|
| 04-may (L) | 51 | 51 |
| 05-may (M) | 46 | 49 |
| 06-may (X) | 41 | 46 |
| 07-may (J) | 35 | 42 |
| 08-may (V) | 30 | 35 |
| 11-may (L) | 25 | 30 |
| 12-may (M) | 20 | 22 |
| 13-may (X) | 15 | 17 |
| 14-may (J) | 10 | 11 |
| 15-may (V) | 0 | 2 (carry over US-008) |

---

## Definition of Done aplicada al Sprint

Todas las historias marcadas `Done` cumplen [`definition-of-done.md`](./definition-of-done.md). La US-008 no cumple el DoD (faltan tests de regla de negocio sobre vacante activa) y por eso no se marca como entregada.

---

## Review + Retro

- **Review (15-may 16:00):** PO aceptó el incremento. Demo realizada contra `docker-compose up` levantando backend + Mongo + Postgres + MailHog. Swagger UI mostrado en vivo.
- **Retro:** ver [`retrospectiva-sprint-1.md`](./retrospectiva-sprint-1.md).
