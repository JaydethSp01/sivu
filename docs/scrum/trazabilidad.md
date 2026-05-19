# Matriz de trazabilidad — SIVU

Documento que evidencia, según lo exige el enunciado, la trazabilidad entre los cuatro eslabones:

> **Requerimiento → Desarrollo → Pruebas → Despliegue**

Cada historia del Product Backlog está mapeada al componente que la implementa, al endpoint expuesto, a los tests que la validan y al stage del pipeline que la ejecuta y despliega.

---

## 1. Matriz principal

| HU | Épica | Componente / Módulo | Endpoint(s) / Artefacto | Tests que la cubren | Pipeline stage |
|---|---|---|---|---|---|
| US-001 | EP-01 | `infrastructure.web.auth.AuthController` · `application.auth.RegisterService` | `POST /api/v1/auth/register` | JUnit `AuthRegisterServiceTest`, `AuthControllerWebMvcTest` · Newman `auth/register.json` | `ci.yml → unit-tests`, `ci.yml → api-tests` |
| US-002 | EP-01 | `AuthController` · `JwtService` | `POST /api/v1/auth/login` | JUnit `JwtServiceTest`, `LoginIT` (Testcontainers) · Newman `auth/login.json` · k6 `tests/k6/login.js` | `ci.yml → unit-tests`, `ci.yml → api-tests`, `cd.yml → load-tests` |
| US-003 | EP-01 | `AuthController` · `RefreshTokenService` | `POST /api/v1/auth/refresh` | JUnit `RefreshTokenServiceTest` · Newman `auth/refresh.json` | `ci.yml → unit-tests`, `ci.yml → api-tests` |
| US-004 | EP-01 | `infrastructure.security.SecurityConfig` · `JwtAuthenticationFilter` | Todos los endpoints `/api/v1/**` | JUnit `SecurityConfigTest` con `@WithMockUser` por rol · Newman `auth/role-matrix.json` | `ci.yml → unit-tests`, `ci.yml → api-tests` |
| US-005 | EP-02 | `EstudianteController` · `EstudianteService` · `EstudianteRepository` (Postgres) | `GET/POST/PUT/DELETE /api/v1/estudiantes` | JUnit `EstudianteServiceTest`, `EstudianteControllerWebMvcTest` · Newman `crud/estudiantes.json` · Cypress `coordinador.cy.ts` | `ci.yml → unit-tests`, `ci.yml → api-tests`, `cd.yml → e2e-tests` |
| US-006 | EP-02 | `EmpresaController` · `EmpresaService` | `/api/v1/empresas` | JUnit `EmpresaServiceTest` · Newman `crud/empresas.json` | `ci.yml → unit-tests`, `ci.yml → api-tests` |
| US-007 | EP-02 | `VacanteController` · `VacanteService` | `/api/v1/vacantes` | JUnit `VacanteServiceTest`, `VacanteAuthIT` · Newman `crud/vacantes.json` · Cypress `flujo-vinculacion.cy.ts` | `ci.yml → unit-tests`, `ci.yml → api-tests`, `cd.yml → e2e-tests` |
| US-008 | EP-02 | `PostulacionController` · `PostulacionService` | `POST/GET /api/v1/postulaciones`, `GET /api/v1/postulaciones/me`, `PATCH /api/v1/postulaciones/{id}/estado` | JUnit `PostulacionServiceTest` (incluye reglas vacante activa y duplicados) · Newman `crud/postulaciones.json` · k6 `tests/k6/postulaciones.js` · Cypress `flujo-vinculacion.cy.ts` | `ci.yml → unit-tests`, `ci.yml → api-tests`, `cd.yml → load-tests`, `cd.yml → e2e-tests` |
| US-009 | EP-02 | `DocumentoController` · `DocumentStorageService` | `POST/GET /api/v1/documentos` | JUnit `DocumentoServiceTest`, `DocumentStorageTest` · Newman `crud/documentos.json` | `ci.yml → unit-tests`, `ci.yml → api-tests` |
| US-010 | EP-02 | `ConvenioController` · `ConvenioService` | `/api/v1/convenios` | JUnit `ConvenioServiceTest` · Newman `crud/convenios.json` | `ci.yml → unit-tests`, `ci.yml → api-tests` |
| US-011 | EP-03 | `automatizacion.DocumentValidationService` | `POST /api/v1/automatizacion/validar-documentos/{estudianteId}` | JUnit `DocumentValidationServiceTest` (reglas) · Newman `automatizacion/validar-docs.json` · Cypress `coordinador.cy.ts` | `ci.yml → unit-tests`, `ci.yml → api-tests`, `cd.yml → e2e-tests` |
| US-012 | EP-03 | `automatizacion.AcademicVerificationService` · `infrastructure.client.AcademicApiClient` (WireMock) | `POST /api/v1/automatizacion/validar-academico/{estudianteId}` | JUnit `AcademicVerificationServiceTest`, `AcademicApiClientIT` (WireMock) · Newman `automatizacion/validar-academico.json` | `ci.yml → unit-tests`, `ci.yml → api-tests` |
| US-013 | EP-03 | `automatizacion.MatchingService` | `POST /api/v1/automatizacion/matching/{vacanteId}` | JUnit `MatchingServiceTest` (parametrizado) · Newman `automatizacion/matching.json` · Cypress `coordinador.cy.ts` | `ci.yml → unit-tests`, `ci.yml → api-tests`, `cd.yml → e2e-tests` |
| US-014 | EP-03 | `automatizacion.FormalizacionPdfService` (iText) | `POST /api/v1/automatizacion/formalizar/{postulacionId}` | JUnit `FormalizacionPdfServiceTest` (verifica metadata PDF) · Newman `automatizacion/formalizar.json` · Cypress `coordinador.cy.ts` (descarga PDF) | `ci.yml → unit-tests`, `ci.yml → api-tests`, `cd.yml → e2e-tests` |
| US-015 | EP-03 | `notificaciones.NotificationService` · Spring Mail + Thymeleaf | Listener interno; verificable vía MailHog UI | JUnit `NotificationServiceTest` (renderiza plantillas) · Cypress `flujo-vinculacion.cy.ts` (verifica email vía API MailHog `GET /api/v2/messages`) | `ci.yml → unit-tests`, `cd.yml → e2e-tests` |
| US-016 | EP-04 | Frontend `features/proceso/MiProcesoPage.tsx` · backend `PostulacionController.getMine` | `GET /api/v1/postulaciones/me` · ruta SPA `/mi-proceso` | Cypress `flujo-vinculacion.cy.ts` (verifica timeline) · Newman `consultas/postulacion-me.json` | `ci.yml → api-tests`, `cd.yml → e2e-tests` |
| US-017 | EP-04 | `ReportesController` · `ReportesService` · Frontend `pages/ReportesPage.tsx` | `GET /api/v1/reportes/pipeline` · ruta SPA `/reportes` | JUnit `ReportesServiceTest` · Newman `consultas/reportes.json` · Cypress `coordinador.cy.ts` | `ci.yml → unit-tests`, `ci.yml → api-tests`, `cd.yml → e2e-tests` |
| US-018 | EP-05 | `mcp-server/src/tools/listarPendientes.ts` | MCP tool `listar_estudiantes_pendientes_validacion` → consume `GET /api/v1/estudiantes?estadoDocs=PENDIENTE` | Test Jest `listarPendientes.test.ts` (mock fetch) · Newman valida endpoint subyacente | `ci.yml → mcp-tests`, `ci.yml → api-tests` |
| US-019 | EP-05 | `mcp-server/src/tools/estadoPostulacion.ts` | MCP tool `consultar_estado_postulacion` → consume `GET /api/v1/postulaciones?estudianteId=` | Jest `estadoPostulacion.test.ts` · Newman `consultas/postulacion-por-estudiante.json` | `ci.yml → mcp-tests`, `ci.yml → api-tests` |
| US-020 | EP-05 | `mcp-server/src/tools/listarVacantesActivas.ts` | MCP tool `listar_vacantes_activas` → consume `GET /api/v1/vacantes?estado=ACTIVA` | Jest `listarVacantesActivas.test.ts` · Newman `crud/vacantes.json` (filtro) | `ci.yml → mcp-tests`, `ci.yml → api-tests` |
| US-021 | EP-05 | `mcp-server/src/tools/revisarLogsPipeline.ts` | MCP tool `revisar_logs_pipeline` → consume GitHub Actions API | Jest `revisarLogsPipeline.test.ts` (mock `@octokit/rest`) | `ci.yml → mcp-tests` |
| US-022 | EP-08 | `infrastructure.web.OpenApiConfig` (springdoc-openapi 2.x) | `/swagger-ui.html`, `/v3/api-docs` | JUnit `OpenApiContractTest` (valida JSON contra OpenAPI 3 schema) | `ci.yml → build-backend`, `ci.yml → contract-check` |
| US-023 | EP-06 | Configuración `pom.xml` plugin `jacoco-maven-plugin` con regla `LINE >= 0.70` | Reporte `target/site/jacoco/index.html` | Toda la suite JUnit | `ci.yml → unit-tests` (rompe build si cobertura < 70 %) |
| US-024 | EP-06 | `tests/postman/SIVU.postman_collection.json` + `tests/postman/ci.environment.json` | — | Newman ejecuta toda la colección | `ci.yml → api-tests` |
| US-025 | EP-06 | `tests/cypress/e2e/*.cy.ts` | — | Cypress headless contra `docker compose up` | `cd.yml → e2e-tests` |
| US-026 | EP-06 | `tests/k6/login.js`, `tests/k6/postulaciones.js` | — | k6 con umbrales `http_req_duration p(95) < 500` | `cd.yml → load-tests` |
| US-027 | EP-06 | `sonar-project.properties` + status check obligatorio | — | SonarCloud analyzer | `ci.yml → sonar` (con `sonar.qualitygate.wait=true`) |
| US-028 | EP-07 | `.github/workflows/ci.yml` | — | El workflow es el artefacto y se prueba con `act` localmente | `ci.yml` completo |
| US-029 | EP-07 | `.github/workflows/cd.yml` · `docker-compose.yml` · Dockerfiles | — | Smoke `curl /actuator/health` post-deploy | `cd.yml → build-images`, `cd.yml → deploy-demo`, `cd.yml → smoke` |
| US-030 | EP-07 | `Makefile` · `docker-compose.dev.yml` · `.env.example` | — | Manual: `make up && make seed` (documentado en README) · Cypress como smoke E2E | `ci.yml → docker-compose-validate` |
| US-031 | EP-02 | `TutorController` · `TutorService` · `TutorRepository` | `GET/POST/PUT/DELETE /api/v1/tutores` | JUnit pendiente (validaciones tipo/empresa requeridas) · Newman `crud/tutores.json` | `ci.yml → unit-tests`, `ci.yml → api-tests` |
| US-032 | EP-03 | `ConvenioService.asignarTutores` + `ConvenioController` | `PATCH /api/v1/convenios/{id}/tutores` | Validación tipo correcto del tutor por slot | `ci.yml → unit-tests`, `ci.yml → api-tests` |
| US-033 | EP-03 | `BitacoraController` · `BitacoraService` · `BitacoraRepository` | `GET/POST/PUT/DELETE /api/v1/bitacoras`, `PATCH /enviar`, `PATCH /revisar` | JUnit `BitacoraServiceTest` (5 casos: estados/transiciones) · Newman `crud/bitacoras.json` · Cypress `flujo-vinculacion.cy.ts` (registra+envía+revisa) | `ci.yml → unit-tests`, `ci.yml → api-tests`, `cd.yml → e2e-tests` |
| US-034 | EP-03 | `EvaluacionController` · `EvaluacionService` · `EvaluacionRepository` | `POST/PUT/GET /api/v1/evaluaciones`, `GET /resumen/{convenioId}` | JUnit `EvaluacionServiceTest` (4 casos: crear, duplicada, resumen con sugerida, resumen vacío) · Newman `crud/evaluaciones.json` | `ci.yml → unit-tests`, `ci.yml → api-tests` |
| US-035 | EP-03 | `ConvenioService.finalizar` | `PATCH /api/v1/convenios/{id}/finalizar` | Validación calificación 0-5 + estado ACTIVO | `ci.yml → unit-tests`, `ci.yml → api-tests` |
| US-036 | EP-03 | `automatizacion.CertificadoService` · `CertificadoPdfGenerator` (OpenPDF horizontal) | `POST /api/v1/automatizacion/certificado/{convenioId}`, `GET /convenios/{id}/certificado` | Validación: solo FINALIZADO + calificación · Newman `automatizacion/certificado.json` · Cypress `flujo-vinculacion.cy.ts` (descarga PDF) | `ci.yml → unit-tests`, `ci.yml → api-tests`, `cd.yml → e2e-tests` |

> US-031 a US-036 cierran el flujo "durante la práctica" y "cierre". Mantienen el patrón hexagonal (domain/persistence/service/web) y la misma matriz de pruebas (JUnit → Newman → Cypress → CI/CD).

---

## 2. Pipeline `ci.yml` — vista por stage

| Stage | Qué ejecuta | Historias que valida |
|---|---|---|
| `build-backend` | `./mvnw -q -DskipTests package` | US-022 |
| `build-frontend` | `npm ci && npm run build` | US-016, US-017 (impacto UI) |
| `unit-tests` | `./mvnw verify` (JUnit + JaCoCo + regla 70 %) | US-001 → US-017, US-023 |
| `api-tests` | `newman run SIVU.postman_collection.json` | US-001 → US-021, US-024 |
| `mcp-tests` | `cd mcp-server && npm test` | US-018 → US-021 |
| `sonar` | `mvn sonar:sonar -Dsonar.qualitygate.wait=true` | US-027 |
| `docker-compose-validate` | `docker compose config` | US-030 |
| `contract-check` | Verifica que `/v3/api-docs` siga siendo válido OpenAPI 3 | US-022 |

## 3. Pipeline `cd.yml` — vista por stage

| Stage | Qué ejecuta | Historias que valida |
|---|---|---|
| `build-images` | `docker build` y `docker push` a GHCR para `backend`, `frontend`, `mcp-server` | US-029 |
| `deploy-demo` | En self-hosted runner: `docker compose pull && docker compose up -d` | US-029, US-030 |
| `e2e-tests` | `cypress run --headless` contra el demo recién desplegado | US-005, US-007, US-008, US-011, US-013, US-014, US-015, US-016, US-017, US-025 |
| `load-tests` | `k6 run tests/k6/login.js` y `postulaciones.js` | US-002, US-008, US-026 |
| `smoke` | `curl --fail http://localhost:8080/actuator/health` | US-029 |

---

## 4. Lectura sugerida (cómo usar esta matriz)

1. **Para el docente:** dada cualquier historia (ej. US-013), localícela en la sección 1. La fila indica componente exacto, endpoint, tests específicos y stages del pipeline que la ejecutan.
2. **Para el equipo:** al modificar un endpoint, revise la fila correspondiente para actualizar **todos** los tests y, si procede, la documentación Swagger y la trazabilidad.
3. **Para auditoría:** las secciones 2 y 3 invierten la perspectiva: dado un stage, qué historias se garantizan.

---

## 5. Mantenimiento

- Esta matriz se actualiza **en el mismo PR** que implementa la historia. Es parte de la DoD ([`definition-of-done.md`](./definition-of-done.md)).
- Si una historia no aparece aquí, **no** puede marcarse como `Done`.
- Cualquier endpoint nuevo no listado en una fila debe agregarse antes del merge.
