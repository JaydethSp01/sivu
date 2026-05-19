# Product Backlog — SIVU

Backlog priorizado del producto **SIVU — Sistema de Vinculación Universitaria**, mantenido por la Product Owner Kellyn Johanna Delgado Jaimes.

- **Priorización:** MoSCoW (`Must`, `Should`, `Could`, `Won't`) complementado con `Valor de negocio` 1–5.
- **Estimación:** Planning Poker, escala Fibonacci (1, 2, 3, 5, 8, 13).
- **Estado del backlog:** vivo; se refina cada miércoles a las 16:00.

---

## Épicas

| ID | Épica | Descripción |
|---|---|---|
| EP-01 | Autenticación y autorización | Login, registro, refresh, control de acceso por rol. |
| EP-02 | Gestión de entidades (CRUD) | CRUDs base del dominio (estudiantes, empresas, vacantes, postulaciones, documentos, convenios). |
| EP-03 | Automatización del proceso | Validación documental, verificación académica, matching, formalización, notificaciones. |
| EP-04 | Visibilidad y seguimiento | Dashboard "tipo pedido" para el estudiante y reportes para coordinador. |
| EP-05 | Integración MCP | Agente MCP con herramientas para consultar el sistema en lenguaje natural. |
| EP-06 | Calidad | Pruebas unitarias, contractuales (Newman), E2E (Cypress), carga (k6) y SonarCloud. |
| EP-07 | DevOps y despliegue continuo | Pipeline GitHub Actions, dockerización y despliegue local con docker-compose. |
| EP-08 | Documentación | Swagger, README, documentación Scrum y arquitectura. |

---

## Backlog priorizado

| ID | Título | Épica | Descripción corta | Prioridad MoSCoW | Valor | SP | Sprint sugerido |
|---|---|---|---|---|---|---|---|
| US-001 | Registro de usuario | EP-01 | Como visitante quiero registrarme con email y password para acceder a la plataforma. | Must | 5 | 3 | Sprint 1 |
| US-002 | Login con JWT | EP-01 | Como usuario quiero iniciar sesión y recibir un JWT para usar la API. | Must | 5 | 5 | Sprint 1 |
| US-003 | Refresh token | EP-01 | Como usuario quiero renovar mi token sin volver a iniciar sesión. | Must | 4 | 3 | Sprint 1 |
| US-004 | Control de acceso por rol | EP-01 | Como administrador quiero que cada endpoint exija un rol específico (ADMIN, COORDINADOR, ESTUDIANTE, EMPRESA, MCP_AGENT). | Must | 5 | 5 | Sprint 1 |
| US-005 | CRUD Estudiantes | EP-02 | Como coordinador quiero crear, listar, actualizar y eliminar estudiantes. | Must | 4 | 5 | Sprint 1 |
| US-006 | CRUD Empresas | EP-02 | Como coordinador quiero gestionar empresas con las que se firman convenios. | Must | 4 | 3 | Sprint 1 |
| US-007 | CRUD Vacantes | EP-02 | Como empresa quiero publicar vacantes de prácticas. | Must | 5 | 5 | Sprint 1 |
| US-008 | CRUD Postulaciones | EP-02 | Como estudiante quiero postularme a una vacante y consultar el estado de mi postulación. | Must | 5 | 5 | Sprint 1 |
| US-009 | CRUD Documentos | EP-02 | Como estudiante quiero subir documentos (hoja de vida, certificado, ARL) y que se asocien a mi perfil. | Must | 4 | 5 | Sprint 1 |
| US-010 | CRUD Convenios | EP-02 | Como coordinador quiero registrar y consultar convenios marco firmados con empresas. | Should | 3 | 3 | Sprint 2 |
| US-011 | Validación documental automática | EP-03 | Como coordinador quiero que el sistema valide automáticamente la completitud y formato de los documentos cargados. | Must | 5 | 8 | Sprint 2 |
| US-012 | Verificación académica vía API mock | EP-03 | Como coordinador quiero que el sistema consulte la API académica para validar promedio y créditos del estudiante. | Must | 5 | 5 | Sprint 2 |
| US-013 | Matching automático estudiante↔vacante | EP-03 | Como coordinador quiero un matching con score que priorice candidatos por perfil y promedio. | Must | 5 | 8 | Sprint 2 |
| US-014 | Generación PDF de formalización | EP-03 | Como coordinador quiero generar automáticamente el documento PDF de formalización a partir de los datos del estudiante, empresa y vacante. | Must | 5 | 5 | Sprint 2 |
| US-015 | Notificaciones por email | EP-03 | Como estudiante quiero recibir un email en cada cambio de estado de mi proceso. | Must | 4 | 3 | Sprint 2 |
| US-016 | Dashboard de seguimiento tipo pedido | EP-04 | Como estudiante quiero ver mi proceso como un "pedido" con pasos completados y pendientes. | Must | 5 | 5 | Sprint 2 |
| US-017 | Reporte de pipeline de vinculación | EP-04 | Como coordinador quiero ver métricas globales (postulaciones por estado, tiempo medio por etapa). | Should | 3 | 3 | Sprint 2 |
| US-018 | MCP server base + tool `listar_estudiantes_pendientes_validacion` | EP-05 | Como MCP_AGENT quiero consultar los estudiantes con documentos por validar. | Must | 4 | 5 | Sprint 2 |
| US-019 | MCP tool `consultar_estado_postulacion` | EP-05 | Como MCP_AGENT quiero consultar el estado de una postulación por id de estudiante. | Must | 4 | 3 | Sprint 2 |
| US-020 | MCP tool `listar_vacantes_activas` | EP-05 | Como MCP_AGENT quiero listar las vacantes activas con cupos disponibles. | Should | 3 | 2 | Sprint 2 |
| US-021 | MCP tool `revisar_logs_pipeline` | EP-05 | Como MCP_AGENT quiero consultar el estado del último workflow de GitHub Actions. | Should | 3 | 3 | Sprint 2 |
| US-022 | Swagger / OpenAPI publicado | EP-08 | Como desarrollador integrador quiero consultar Swagger UI con todos los endpoints documentados. | Must | 4 | 2 | Sprint 1 |
| US-023 | Tests unitarios con cobertura ≥ 70% | EP-06 | Como Scrum Master quiero JaCoCo midiendo cobertura y rompiendo build bajo 70 %. | Must | 4 | 3 | Sprint 1 |
| US-024 | Tests contractuales con Newman en CI | EP-06 | Como QA quiero correr la colección Postman en CI para validar contratos. | Must | 4 | 3 | Sprint 2 |
| US-025 | Tests E2E con Cypress | EP-06 | Como QA quiero un flujo E2E que registre, postule y formalice a un estudiante. | Must | 4 | 5 | Sprint 2 |
| US-026 | Tests de carga con k6 | EP-06 | Como QA quiero validar que `/api/v1/auth/login` y `/api/v1/postulaciones` sostienen 50 RPS. | Should | 3 | 3 | Sprint 2 |
| US-027 | Quality Gate SonarCloud bloqueante | EP-06 | Como tech lead quiero que el PR no se pueda mergear si SonarCloud falla. | Must | 4 | 2 | Sprint 2 |
| US-028 | Pipeline CI en GitHub Actions | EP-07 | Como DevOps quiero un workflow `ci.yml` que ejecute build, test, sonar en cada PR. | Must | 5 | 5 | Sprint 1 |
| US-029 | Pipeline CD con docker-compose | EP-07 | Como DevOps quiero que tras merge a `main` el pipeline construya imágenes y levante `docker-compose up` en el runner para demo. | Must | 5 | 5 | Sprint 2 |
| US-030 | Despliegue local reproducible | EP-07 | Como evaluador quiero clonar el repo y correr `make up` para tener todo levantado. | Must | 5 | 2 | Sprint 1 |

Total estimado: **120 SP**. Sprint 1 selecciona **50 SP** y Sprint 2 selecciona **70 SP** (ajustando por velocidad real medida en Sprint 1).

---

## Backlog futuro (post-Sprint 2)

| ID | Título | Notas |
|---|---|---|
| US-031 | Notificaciones push en frontend | Vía SSE o WebSocket. |
| US-032 | Firma electrónica del documento de formalización | Integración con proveedor externo. |
| US-033 | Panel del docente externo | Para evaluación de prácticas en curso. |
| US-034 | Reportes exportables a PDF/Excel | Para vicerrectoría. |
| US-035 | App móvil ligera | React Native — pendiente de evaluación. |

> Pasan al backlog `Won't (esta release)` pero se conservan para grooming futuro.
