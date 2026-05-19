# Criterios de aceptación — SIVU

Consolidado de los criterios de aceptación por historia, en formato de **checklist verificable**. Sirve como guía para el equipo de QA y como evidencia de cumplimiento en cada review de sprint.

> Para los escenarios completos en notación Gherkin ver [`historias-usuario.md`](./historias-usuario.md).

---

## EP-01 · Autenticación y autorización

### US-001 — Registro de usuario

- [x] El endpoint `POST /api/v1/auth/register` retorna 201 con `{id, email, rol}`.
- [x] El password se almacena hasheado con BCrypt (cost ≥ 10).
- [x] No se permite registrar emails duplicados (HTTP 409).
- [x] La validación de password aplica: mínimo 8 caracteres, una mayúscula, un número y un símbolo (HTTP 400 si falla).
- [x] Existe un test unitario y un test web (`@WebMvcTest`) que cubre cada rama.

### US-002 — Login con JWT

- [x] `POST /api/v1/auth/login` devuelve `accessToken` (HS256, 1 h) y `refreshToken` (7 d).
- [x] El claim `role` corresponde al rol persistido.
- [x] Credenciales inválidas devuelven 401 sin filtrar si el usuario existe.
- [x] Se loguea el intento fallido sin imprimir el password.

### US-003 — Refresh token

- [x] `POST /api/v1/auth/refresh` acepta refresh válido y devuelve nuevo access token.
- [x] Refresh expirado devuelve 401.
- [x] Refresh ya usado (rotación) queda invalidado.

### US-004 — Control de acceso por rol

- [x] `SecurityConfig` define una cadena con `JwtAuthenticationFilter` antes de `UsernamePasswordAuthenticationFilter`.
- [x] Cada controlador usa `@PreAuthorize` con el rol correspondiente.
- [x] Tests `@WithMockUser(roles="X")` cubren al menos un caso 200 y un caso 403 por endpoint.
- [x] Petición sin JWT a `/api/v1/**` (excepto `/auth/**` y `/v3/api-docs/**`) responde 401.

---

## EP-02 · CRUDs base

### US-005 — CRUD Estudiantes

- [x] `POST /api/v1/estudiantes` valida documento único, nombre, programa, semestre, promedio (0–5).
- [x] `GET /api/v1/estudiantes?page=&size=` retorna paginación Spring (`content`, `totalElements`, `totalPages`).
- [x] `PUT /api/v1/estudiantes/{id}` con id inexistente retorna 404.
- [x] `DELETE /api/v1/estudiantes/{id}` retorna 204; un segundo DELETE retorna 404.
- [x] Mapper MapStruct entre `Estudiante` (entidad) y `EstudianteDTO`.

### US-006 — CRUD Empresas

- [x] CRUD completo en `/api/v1/empresas` con campos NIT (único), razón social, contacto, sector.
- [x] No se permite eliminar una empresa con vacantes activas (HTTP 409).

### US-007 — CRUD Vacantes

- [x] `POST /api/v1/vacantes` requiere rol EMPRESA y `empresaId` coincidente con el del JWT.
- [x] Filtros soportados: `?estado=ACTIVA`, `?empresaId=`, `?programa=`.
- [x] Transición de estado válida: `ACTIVA → CERRADA` mediante `PATCH /api/v1/vacantes/{id}/estado`.

### US-008 — CRUD Postulaciones

- [x] `POST /api/v1/postulaciones` valida vacante en estado `ACTIVA` y cupos > 0.
- [x] No se permite duplicar postulación del mismo estudiante a la misma vacante salvo que la anterior esté `RECHAZADA`.
- [x] Estados válidos: `CREADA`, `DOCUMENTOS_VALIDADOS`, `EN_REVISION`, `APROBADA`, `RECHAZADA`, `FORMALIZADA`.
- [x] `GET /api/v1/postulaciones/me` devuelve sólo las postulaciones del estudiante autenticado.

### US-009 — CRUD Documentos

- [x] `POST /api/v1/documentos` acepta multipart (`file`, `tipo`).
- [x] Tipos válidos: `HOJA_VIDA`, `CERTIFICADO_NOTAS`, `ARL`, `EPS`.
- [x] Tamaño máximo 5 MB; formato PDF o JPG.
- [x] Archivos almacenados en volumen `./data/docs/{estudianteId}/{tipo}.{ext}`.

### US-010 — CRUD Convenios

- [x] `POST /api/v1/convenios` requiere rol COORDINADOR.
- [x] Campos: empresa, fecha firma, vigencia, archivo PDF del convenio.
- [x] Un convenio vencido no puede asociarse a una nueva formalización.

---

## EP-03 · Automatización

### US-011 — Validación documental automática

- [x] `POST /api/v1/automatizacion/validar-documentos/{estudianteId}` retorna `{resultado, causas[]}`.
- [x] Reglas implementadas: completitud (los 4 tipos), tamaño máximo 5 MB, formato PDF/JPG.
- [x] Resultado persistido en tabla `validacion_documento` con timestamp y causa.
- [x] La postulación asociada (si existe) cambia a `DOCUMENTOS_VALIDADOS` si pasa.

### US-012 — Verificación académica vía API mock

- [x] `POST /api/v1/automatizacion/validar-academico/{estudianteId}` consulta API académica.
- [x] WireMock configurado en perfiles `test` y `dev` con respuestas plausibles.
- [x] Reglas: promedio ≥ 3.5 y créditos cursados ≥ 70 % del plan.
- [x] Si la API académica está caída, el sistema responde 503 con causa clara y no marca la verificación como aprobada.

### US-013 — Matching automático

- [x] `POST /api/v1/automatizacion/matching/{vacanteId}` devuelve lista ordenada por `score` desc.
- [x] Fórmula: `score = 0.4*normalizado(promedio) + 0.4*coincidenciaPrograma + 0.2*disponibilidadHoraria`.
- [x] Test parametrizado cubre al menos 6 combinaciones.
- [x] Sin postulantes retorna lista vacía 200.

### US-014 — Generación PDF de formalización

- [x] `POST /api/v1/automatizacion/formalizar/{postulacionId}` retorna `application/pdf`.
- [x] PDF contiene datos del estudiante, empresa, vacante, convenio y bloque de firmas.
- [x] Copia persistida en `./data/formalizaciones/{postulacionId}.pdf`.
- [x] No se puede formalizar una postulación no `APROBADA` (HTTP 409).

### US-015 — Notificaciones por email

- [x] Notificación enviada en cada transición de estado de la postulación.
- [x] Plantillas Thymeleaf por tipo: `creada`, `validada`, `rechazada`, `aprobada`, `formalizada`.
- [x] Asunto y cuerpo en español.
- [x] Emails visibles en MailHog UI (http://localhost:8025) durante la demo.

---

## EP-04 · Visibilidad y seguimiento

### US-016 — Dashboard "tipo pedido"

- [x] Página `/mi-proceso` consume `GET /api/v1/postulaciones/me`.
- [x] Renderiza un componente `Timeline` con pasos: Registro, Documentos cargados, Validación documental, Verificación académica, Matching, Formalización.
- [x] Pasos completados marcados; paso actual resaltado.
- [x] Estado vacío con CTA "Explorar vacantes" si no hay postulación.

### US-017 — Reporte de pipeline de vinculación

- [x] `GET /api/v1/reportes/pipeline` devuelve totales por estado y tiempo medio por etapa.
- [x] Página `/reportes` para COORDINADOR muestra los datos con gráficos.
- [x] No accesible para ESTUDIANTE ni EMPRESA (HTTP 403).

---

## EP-05 · Integración MCP

### US-018 — MCP `listar_estudiantes_pendientes_validacion`

- [x] Tool registrada con JSON Schema.
- [x] La tool autentica como rol `MCP_AGENT`.
- [x] Consulta `GET /api/v1/estudiantes?estadoDocs=PENDIENTE` y devuelve `{id, nombre, programa, fechaCargaDocs}`.
- [x] Error controlado si el backend devuelve 5xx.

### US-019 — MCP `consultar_estado_postulacion`

- [x] Parámetro `estudianteId` validado por el JSON Schema.
- [x] Devuelve último estado y timestamps por transición.

### US-020 — MCP `listar_vacantes_activas`

- [x] Devuelve listado paginado de vacantes con cupos disponibles.

### US-021 — MCP `revisar_logs_pipeline`

- [x] Consulta GitHub Actions API con token de lectura (`GH_READONLY_TOKEN`).
- [x] Devuelve `{workflow, status, conclusion, run_url, failing_job?}`.
- [x] Manejo de rate limit con backoff.

---

## EP-06 · Calidad

### US-022 — Swagger UI publicado

- [x] `/swagger-ui.html` accesible sin autenticación en perfil `dev`.
- [x] Todos los controladores anotados con `@Tag` y operaciones con `@Operation`.
- [x] `/v3/api-docs` exporta JSON válido OpenAPI 3.0.

### US-023 — Cobertura ≥ 70 %

- [x] JaCoCo configurado en `pom.xml` con regla `BUNDLE` `LINE >= 0.70`.
- [x] El job `unit-tests` en `ci.yml` falla si la regla no se cumple.
- [x] Reporte HTML disponible en `backend/target/site/jacoco/`.

### US-024 — Newman en CI

- [x] Colección `tests/postman/SIVU.postman_collection.json` cubre auth, CRUDs y automatizaciones.
- [x] Stage `api-tests` en `ci.yml` corre `newman run` con environment `ci`.
- [x] El stage falla si hay al menos un fallo de aserción.

### US-025 — Cypress E2E

- [x] Spec `tests/cypress/e2e/flujo-vinculacion.cy.ts` cubre: login estudiante → ver vacantes → postular → ver dashboard.
- [x] Spec `tests/cypress/e2e/coordinador.cy.ts` cubre: login coord → validar documentos → matching → formalizar → descargar PDF.
- [x] Stage `e2e-tests` ejecuta en modo headless.

### US-026 — k6

- [x] Script `tests/k6/login.js` con 50 VUs, 5 min, umbral `p(95) < 500 ms`.
- [x] Script `tests/k6/postulaciones.js` con 30 VUs, 5 min, mismo umbral.
- [x] Stage `load-tests` (opcional, sólo en `main`) falla si rompe umbrales.

### US-027 — SonarCloud Quality Gate

- [x] Configurado `sonar.qualitygate.wait=true`.
- [x] Quality Gate del proyecto exige: cobertura ≥ 70 % en código nuevo, 0 vulnerabilidades, 0 bugs críticos, duplicación ≤ 3 %.
- [x] El status check `SonarCloud Code Analysis` es obligatorio para mergear.

---

## EP-07 · DevOps y despliegue

### US-028 — Pipeline CI

- [x] `.github/workflows/ci.yml` se ejecuta en `pull_request` y `push: main`.
- [x] Jobs: `build-backend`, `build-frontend`, `unit-tests`, `api-tests`, `sonar`.
- [x] Tiempo total < 12 min en runner por defecto.

### US-029 — Pipeline CD

- [x] `.github/workflows/cd.yml` se dispara con `push: main` o `workflow_dispatch`.
- [x] Construye imágenes Docker y publica en GHCR.
- [x] Job `deploy-demo` corre `docker compose pull && docker compose up -d` en self-hosted runner.
- [x] Smoke test `curl /actuator/health` debe devolver `200 UP`.

### US-030 — Despliegue local reproducible

- [x] `make up` levanta backend + frontend + postgres + mongo + mailhog.
- [x] `make seed` carga 5 estudiantes, 3 empresas, 4 vacantes de demo.
- [x] README documenta usuarios demo por rol.

---

## Plantilla para nuevas historias

```
- [ ] Endpoint <verbo> <ruta> retorna <código> con <payload>.
- [ ] Validaciones bean cubren <campos>.
- [ ] Tests unitarios para casos válido / inválido / borde.
- [ ] Documentación Swagger actualizada.
- [ ] Cobertura del módulo ≥ 70 %.
- [ ] Demo aprobada por la PO.
```
