# Sprint Backlog — Sprint 2

| Campo | Valor |
|---|---|
| Sprint | 2 |
| Fechas | 2026-05-18 → 2026-05-31 (2 semanas) |
| Duración | 10 días hábiles |
| Capacidad declarada | 70 SP (ajustada con velocidad real Sprint 1 = 47 SP + crecimiento esperado del equipo ya rodado) |
| Estado al 17-may | Planificado y aprobado en refinement del 13-may. Inicia el lunes 18-may. |
| Scrum Master | Jaydeth Sandoval |
| Product Owner | Kellyn Johanna Delgado Jaimes |

---

## Objetivo del Sprint

> **Implementar las automatizaciones del flujo de vinculación (validación documental, verificación académica, matching, formalización, notificaciones), integrar el servidor MCP, completar la suite de pruebas E2E/carga/calidad y dejar el pipeline CI/CD completo desplegando en local con docker-compose.**

Al final del sprint el flujo extremo a extremo debe demostrarse en vivo: un estudiante se registra, sube documentos, el sistema valida automáticamente, hace matching contra vacantes activas, genera el PDF de formalización, dispara emails (visibles en MailHog) y el coordinador puede consultar el estado vía el agente MCP.

---

## Sprint Backlog

| ID | Historia | Asignado | Estimación (SP) | Estado | Notas |
|---|---|---|---|---|---|
| US-008 (carry over) | CRUD Postulaciones — cierre | Juan Pablo Caicedo | 2 | ToDo | Validar vacante activa + cupo disponible al postular. |
| US-010 | CRUD Convenios | Sergio Vargas | 3 | ToDo | `/api/v1/convenios`. |
| US-011 | Validación documental automática | Sergio Vargas + Laura Pinzón | 8 | ToDo | `POST /api/v1/automatizacion/validar-documentos/{estudianteId}`. Reglas: tipos requeridos, tamaño máximo, formato PDF/JPG. |
| US-012 | Verificación académica vía API mock | Andrés Ríos | 5 | ToDo | `POST /api/v1/automatizacion/validar-academico/{estudianteId}` contra mock WireMock. |
| US-013 | Matching automático estudiante↔vacante | Andrés Ríos + Juan Pablo Caicedo | 8 | ToDo | `POST /api/v1/automatizacion/matching/{vacanteId}` retorna ranking con score. |
| US-014 | Generación PDF de formalización | Sergio Vargas | 5 | ToDo | `POST /api/v1/automatizacion/formalizar/{postulacionId}`. iText 7. |
| US-015 | Notificaciones por email | Juan Pablo Caicedo | 3 | ToDo | Spring Mail + MailHog. Triggers en cada cambio de estado de postulación. |
| US-016 | Dashboard de seguimiento tipo pedido | María Fernanda López + Valentina Suárez | 5 | ToDo | Página `/mi-proceso` con timeline. Consume `GET /api/v1/postulaciones/me`. |
| US-017 | Reporte de pipeline de vinculación | Camilo Restrepo | 3 | ToDo | Página `/reportes` para coordinador. Consume `GET /api/v1/reportes/pipeline`. |
| US-018 | MCP server base + `listar_estudiantes_pendientes_validacion` | Daniela Mejía | 5 | ToDo | Servidor Node TS con `@modelcontextprotocol/sdk`. Login como MCP_AGENT. |
| US-019 | MCP tool `consultar_estado_postulacion` | Daniela Mejía | 3 | ToDo | Llama `GET /api/v1/postulaciones?estudianteId=X`. |
| US-020 | MCP tool `listar_vacantes_activas` | Daniela Mejía | 2 | ToDo | Llama `GET /api/v1/vacantes?estado=ACTIVA`. |
| US-021 | MCP tool `revisar_logs_pipeline` | Daniela Mejía + Sebastián Quintero | 3 | ToDo | Llama GitHub API con token de lectura. |
| US-024 | Tests contractuales con Newman en CI | Laura Pinzón | 3 | ToDo | Colección `tests/postman/SIVU.postman_collection.json` + `newman run` en stage `api-tests`. |
| US-025 | Tests E2E con Cypress | Laura Pinzón + Valentina Suárez | 5 | ToDo | Flujo registro → postulación → formalización. Headless en CI. |
| US-026 | Tests de carga con k6 | Laura Pinzón | 3 | ToDo | Scripts `login.js`, `postulaciones.js` (50 VUs, 5 min). |
| US-027 | Quality Gate SonarCloud bloqueante | Sebastián Quintero | 2 | ToDo | Configurar `sonar.qualitygate.wait=true` y status check obligatorio. |
| US-029 | Pipeline CD con docker-compose | Sebastián Quintero | 5 | ToDo | Workflow `cd.yml` que tras merge a `main` construye imágenes y corre `docker compose up -d` en el self-hosted runner de demo. |

**Total comprometido:** 73 SP (incluye los 2 SP de carry over).

---

## Tareas técnicas (desglose por historia)

### US-011 Validación documental automática
- US-011.T1 — Servicio `DocumentValidationService` con reglas configurables (tipo `HOJA_VIDA`, `CERTIFICADO_NOTAS`, `ARL`, `EPS`).
- US-011.T2 — Endpoint `POST /api/v1/automatizacion/validar-documentos/{estudianteId}`.
- US-011.T3 — Persistir resultado en tabla `validacion_documento` con causa de rechazo.
- US-011.T4 — Tests unitarios cubriendo cada regla.

### US-012 Verificación académica
- US-012.T1 — `AcademicApiClient` (Feign o `RestClient`) apuntando a `${academic.api.url}`.
- US-012.T2 — Stub WireMock en perfil `test` y `dev`.
- US-012.T3 — Endpoint `POST /api/v1/automatizacion/validar-academico/{estudianteId}`.
- US-012.T4 — Reglas: promedio ≥ 3.5, créditos cursados ≥ 70 % del plan.

### US-013 Matching
- US-013.T1 — Algoritmo `MatchingService.score(estudiante, vacante)` con pesos `promedio (0.4)`, `programa (0.4)`, `disponibilidad horaria (0.2)`.
- US-013.T2 — Endpoint `POST /api/v1/automatizacion/matching/{vacanteId}`.
- US-013.T3 — Test unitario con casos tabulados.

### US-014 Generación PDF
- US-014.T1 — Plantilla iText con datos de estudiante, empresa, vacante, convenio.
- US-014.T2 — Endpoint `POST /api/v1/automatizacion/formalizar/{postulacionId}` que devuelve `application/pdf`.
- US-014.T3 — Almacenar copia en `./data/formalizaciones/{postulacionId}.pdf`.

### US-015 Notificaciones email
- US-015.T1 — `NotificationService` con plantillas Thymeleaf (`creada`, `validada`, `rechazada`, `aprobada`, `formalizada`).
- US-015.T2 — Listeners de evento de cambio de estado.
- US-015.T3 — Validar visualmente en MailHog UI (http://localhost:8025).

### US-018 a US-021 MCP
- Servidor Node 20 + TS con `@modelcontextprotocol/sdk`.
- Cliente HTTP autenticado al backend con usuario rol `MCP_AGENT`.
- Definir tools con sus JSON Schemas en `mcp-server/src/tools/`.
- README en `mcp-server/README.md` con instrucciones para Claude Desktop.

### US-024 / US-025 / US-026 Tests
- Newman: colección con folder por recurso, environment `local` y `ci`. Stage `api-tests` en `ci.yml`.
- Cypress: especificaciones en `tests/cypress/e2e/`. Stage `e2e-tests` (job opcional `if: github.event_name == 'pull_request'`).
- k6: scripts en `tests/k6/`. Stage `load-tests` con umbrales `http_req_duration p(95)<500`.

### US-029 Pipeline CD
- US-029.T1 — Workflow `cd.yml` con triggers `push: main` y `workflow_dispatch`.
- US-029.T2 — Build de imágenes Docker (`backend`, `frontend`, `mcp-server`) y push a GHCR.
- US-029.T3 — Job `deploy-demo` en self-hosted runner que ejecuta `docker compose pull && docker compose up -d`.
- US-029.T4 — Smoke test final con `curl /actuator/health`.

---

## Daily plan (proyectado)

| Día | Foco |
|---|---|
| L 18-may | Planning + kickoff. Cerrar US-008. Arrancar US-011, US-012, US-018 en paralelo. |
| M 19-may | Validación documental verde local. Stub WireMock listo. Skeleton MCP server. |
| X 20-may | Matching servicio + tests. MCP tool 1 conectada. |
| J 21-may | Generación PDF en progreso. Frontend dashboard "tipo pedido" en mockup. |
| V 22-may | Demo interna parcial. Notificaciones por email funcionando contra MailHog. |
| L 25-may | Cypress E2E inicial (login + postulación). MCP tools 2 y 3. |
| M 26-may | k6 scripts iniciales. SonarCloud Quality Gate configurado y bloqueando. |
| X 27-may | Pipeline CD escribiendo a GHCR. Refinement post Sprint 2. |
| J 28-may | Hardening + cierre de defectos. Documentación Swagger revisada. |
| V 29-may | Code freeze 12:00. Review + Retro 16:00. Cierre de release `v1.0.0`. |
| (S–D 30/31) | Buffer reservado únicamente para corrección de bloqueantes detectados en review. |

---

## Burndown chart proyectado (story points)

```
SP restantes
73 |█
   |██
65 |███
   |████
58 |█████
   |██████
50 |███████
   |████████
42 |█████████
   |██████████
35 |███████████
   |████████████
27 |█████████████
   |██████████████
18 |███████████████
   |████████████████
10 |█████████████████
   |██████████████████
 0 +────────────────────────────────────────
    L  M  X  J  V  L  M  X  J  V
    18 19 20 21 22 25 26 27 28 29

  ──── proyección ideal
```

| Día | SP restantes (proyección) |
|---|---|
| 18-may | 73 |
| 19-may | 65 |
| 20-may | 58 |
| 21-may | 50 |
| 22-may | 42 |
| 25-may | 35 |
| 26-may | 27 |
| 27-may | 18 |
| 28-may | 10 |
| 29-may | 0 |

---

## Riesgos identificados

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Integración MCP nueva para el equipo | Media | Alta | Spike de Daniela el día 1, README MCP claro. |
| iText con plantillas complejas se atrasa | Media | Media | Reducir alcance del PDF a una sola plantilla inicial. |
| Self-hosted runner no disponible para CD | Baja | Alta | Fallback: que `cd.yml` documente el `docker compose up` y se ejecute manualmente en demo. |
| Cobertura cae con código nuevo | Media | Media | TDD en historias de automatización; pair con QA. |

---

## Definition of Done aplicada al Sprint

Misma DoD que Sprint 1 ([`definition-of-done.md`](./definition-of-done.md)). Adicionalmente para esta release v1.0.0:

- Suite Newman verde end-to-end.
- Suite Cypress verde para el flujo crítico.
- k6 sin umbrales rotos.
- Pipeline CD ejecutado al menos una vez con éxito.
- Documentación Scrum actualizada (este documento + trazabilidad).
