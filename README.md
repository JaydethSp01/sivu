# SIVU — Sistema de Vinculación Universitaria

> Plataforma para automatizar el proceso de vinculación de estudiantes a prácticas profesionales de pregrado (3 prácticas de 6 meses) en la Universidad Empresarial.

Proyecto final de **Despliegue Continuo** que demuestra la integración entre desarrollo de software, calidad, automatización y despliegue continuo aplicando prácticas profesionales de ingeniería de software, DevOps e integración del Model Context Protocol (MCP).

---

## Tabla de contenido

- [Resumen del proyecto](#resumen-del-proyecto)
- [Stack tecnológico](#stack-tecnológico)
- [Arquitectura](#arquitectura)
- [Estructura del monorepo](#estructura-del-monorepo)
- [Cómo ejecutar en local](#cómo-ejecutar-en-local)
- [Endpoints y documentación](#endpoints-y-documentación)
- [Pruebas](#pruebas)
- [Calidad de código](#calidad-de-código)
- [CI/CD](#cicd)
- [Integración MCP](#integración-mcp)
- [Trazabilidad Scrum](#trazabilidad-scrum)
- [Equipo](#equipo)

---

## Resumen del proyecto

**Problema (AS-IS):** El proceso actual de vinculación a prácticas en la universidad presenta cuellos de botella como carga manual de documentos por correo, verificación humana repetitiva de condiciones académicas, correos de seguimiento redactados a mano, correcciones del documento de formalización por errores de captura y nula visibilidad para el estudiante sobre el estado de su trámite.

**Solución (TO-BE — SIVU):** Un sistema empresarial que automatiza la carga y validación de documentos, la verificación académica vía API, el matching entre estudiantes y vacantes, la generación del documento de formalización y la notificación en cada cambio de estado, con un dashboard de seguimiento "tipo pedido" para el estudiante y un agente MCP que permite hacer consultas en lenguaje natural sobre el estado del proceso.

---

## Stack tecnológico

| Capa | Tecnología | Justificación |
|---|---|---|
| **Backend** | Spring Boot 3 · Java 21 · Maven · package-by-feature en capas (`domain` JPA / `persistence` / `service` / `web`) | API REST robusta, JPA limpio, Spring Security madura. Ver ADR-003. |
| **API docs** | springdoc-openapi (Swagger UI 3) | Estándar OpenAPI 3, generación automática |
| **Core DB** | PostgreSQL 16 | Relacional para el dominio (estudiantes, vacantes, postulaciones, convenios) |
| **Users DB** | MongoDB 7 | Otra tecnología (requisito); flexible para perfil, sesiones y roles |
| **Frontend** | React 18 · Vite · TypeScript · TailwindCSS · shadcn/ui | Look empresarial moderno, dev experience óptima |
| **Estado FE** | TanStack Query · Zustand · react-hook-form · zod | Cache server-state, store ligero, validación end-to-end |
| **Email local** | MailHog (SMTP + UI 8025) | Visualizar emails de notificación en demo |
| **IA / MCP** | Node.js · TypeScript · `@modelcontextprotocol/sdk` | Punto 8 del enunciado: agente que consulta DB/API/logs |
| **Tests unit** | JUnit 5 · Mockito · Spring Boot Test | Cobertura ≥ 70% |
| **Tests API** | Postman · Newman | Contract testing en CI |
| **Tests E2E** | Cypress | Flujo completo en navegador real |
| **Tests carga** | k6 | Liviano, corre headless en CI |
| **Calidad** | SonarCloud · JaCoCo | Quality gate bloqueante en PR |
| **CI/CD** | GitHub Actions · Docker · docker-compose | Pipeline build→test→quality→package |
| **Contenedores** | Docker · docker-compose | Reproducible en local |

---

## Arquitectura

Ver [`docs/arquitectura/README.md`](./docs/arquitectura/README.md) para diagramas C4 y descripción detallada.

Diagrama de alto nivel:

```
┌──────────────┐     HTTPS/JWT     ┌─────────────────────────┐
│  Frontend    │ ─────────────────▶│  Backend Spring Boot    │
│  React+Vite  │                   │  - REST API             │
└──────┬───────┘                   │  - Auth (JWT)           │
       │                           │  - Automatizaciones     │
       │                           │  - Notif Email          │
       │                           └────┬──────────┬─────────┘
       │                                │          │
       │                          JPA   │          │  Spring Data Mongo
       │                                ▼          ▼
       │                       ┌─────────────┐ ┌──────────┐
       │                       │ PostgreSQL  │ │ MongoDB  │
       │                       │  (dominio)  │ │ (users)  │
       │                       └─────────────┘ └──────────┘
       │
       │                                ┌──────────┐
       │   Consulta vía MCP            │ MailHog  │
       │  ┌────────────────────────┐    │ SMTP/UI  │
       └─▶│ MCP Server (Node TS)   │    └──────────┘
          │  - listar_pendientes   │
          │  - estado_postulacion  │
          │  - estadisticas_proc   │
          │  - logs_pipeline       │
          └────────────┬───────────┘
                       │
                       ▼
                  Claude Desktop / cliente MCP
```

---

## Estructura del monorepo

```
sivu/
├── backend/                  Spring Boot 3 + Java 21 (arquitectura hexagonal)
│   ├── src/main/java/co/uempresarial/sivu/
│   │   ├── domain/           Entidades y reglas de negocio puras
│   │   ├── application/      Casos de uso (services)
│   │   ├── infrastructure/   Adaptadores: web, persistencia, mail, seguridad
│   │   └── SivuApplication.java
│   ├── src/main/resources/
│   ├── src/test/             Tests unitarios e integración
│   ├── pom.xml
│   └── Dockerfile
├── frontend/                 React + Vite + TS + Tailwind + shadcn/ui
│   ├── src/
│   │   ├── components/       shadcn/ui + componentes propios
│   │   ├── features/         Por dominio (estudiantes, vacantes, etc.)
│   │   ├── lib/              api client, auth, utils
│   │   └── pages/
│   ├── package.json
│   └── Dockerfile
├── mcp-server/               Servidor MCP en Node TypeScript
│   ├── src/index.ts
│   ├── src/tools/            Definición de herramientas MCP
│   └── package.json
├── tests/
│   ├── postman/              Colección + entorno
│   ├── newman/               Configuración para CI
│   ├── cypress/              E2E flujo completo
│   └── k6/                   Scripts de rendimiento
├── infra/
│   ├── docker/               Dockerfiles auxiliares
│   └── mailhog/              Config MailHog
├── docs/
│   ├── arquitectura/         Diagramas C4, decisiones técnicas
│   ├── scrum/                Product Backlog, Sprint Backlog, historias, DoD
│   └── diagramas/            BPMN AS-IS / TO-BE, ER, secuencia
├── .github/workflows/        Pipelines GitHub Actions
├── docker-compose.yml        Orquestación local completa
├── docker-compose.dev.yml    Solo BBDD + MailHog para desarrollo
├── .env.example
├── Makefile                  Atajos: make up, make test, make demo
├── sonar-project.properties
└── README.md
```

---

## Cómo ejecutar en local

### Prerrequisitos

- Docker ≥ 24 y docker-compose plugin
- Java 21 (sólo si quieres correr el backend fuera de Docker)
- Node.js ≥ 20 (sólo si quieres correr frontend/mcp fuera de Docker)
- `make` (opcional pero recomendado)

### Opción 1 — todo dockerizado (recomendado para demo)

```bash
cd /home/jaydethsp/sivu
cp .env.example .env
make up        # levanta postgres, mongo, mailhog, backend, frontend
make seed      # carga datos demo (estudiantes, empresas, vacantes)
```

Servicios disponibles:

| Servicio | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8080/api |
| Swagger UI | http://localhost:8080/swagger-ui.html |
| MailHog UI | http://localhost:8025 |
| PostgreSQL | localhost:5432 (user: `sivu` / pass en `.env`) |
| MongoDB | localhost:27017 |

Usuarios demo (creados por `make seed`):

| Rol | Email | Password |
|---|---|---|
| Admin | admin@uempresarial.edu.co | `Admin123*` |
| Coordinador | coord@uempresarial.edu.co | `Coord123*` |
| Estudiante | kelly@est.uempresarial.edu.co | `Estudiante123*` |
| Empresa | rrhh@coally.com | `Empresa123*` |

### Opción 2 — desarrollo (hot reload)

```bash
make dev-deps  # solo postgres, mongo, mailhog
# en otra terminal:
cd backend && ./mvnw spring-boot:run
# en otra terminal:
cd frontend && npm install && npm run dev
# (opcional) en otra terminal para el agente MCP:
cd mcp-server && npm install && npm run dev
```

### Apagar y limpiar

```bash
make down       # detiene contenedores conservando volúmenes
make clean      # elimina contenedores y volúmenes (reset total)
```

---

## Endpoints y documentación

La API expone Swagger UI en **http://localhost:8080/swagger-ui.html** y el contrato OpenAPI en `/v3/api-docs`. La colección Postman equivalente está en [`tests/postman/SIVU.postman_collection.json`](./tests/postman/SIVU.postman_collection.json).

Dominio principal:

| Etapa del flujo | Recurso | Endpoint base | CRUD |
|---|---|---|---|
| Pre-práctica | Estudiantes | `/api/v1/estudiantes` | C R U D |
| Pre-práctica | Empresas | `/api/v1/empresas` | C R U D |
| Pre-práctica | Vacantes | `/api/v1/vacantes` | C R U D |
| Pre-práctica | Postulaciones | `/api/v1/postulaciones` | C R U D (+`/historial`, `/estado`) |
| Pre-práctica | Documentos | `/api/v1/documentos` | C R U D (+`/validar`) |
| Formalización | Convenios | `/api/v1/convenios` | C R U D (+`/firmar/{parte}`, `/tutores`, `/finalizar`) |
| Durante | Tutores | `/api/v1/tutores` | C R U D |
| Durante | Bitácoras | `/api/v1/bitacoras` | C R U D (+`/enviar`, `/revisar`, `/por-convenio/{id}`) |
| Durante | Evaluaciones | `/api/v1/evaluaciones` | C R U D (+`/resumen/{convenioId}`) |
| Cierre | Certificado | `/api/v1/automatizacion/certificado/{convenioId}` + `/convenios/{id}/certificado` | POST + GET |
| Soporte | Auth | `/api/v1/auth/{login,register,refresh,me}` | — |
| Soporte | Automatización | `/api/v1/automatizacion/{matching,validar-academico,formalizar,info}` | — |

---

## Pruebas

| Tipo | Tecnología | Cómo correr |
|---|---|---|
| Unitarias | JUnit 5 + Mockito | `cd backend && ./mvnw test` |
| Integración | Spring Boot Test + Testcontainers | `cd backend && ./mvnw verify -P integration` |
| Contrato API | Newman | `make test-api` |
| E2E | Cypress | `make test-e2e` (cabezal) o `make test-e2e-ci` (headless) |
| Carga | k6 | `make test-load` |

Cobertura JaCoCo en `backend/target/site/jacoco/index.html` tras correr `./mvnw verify`.

---

## Calidad de código

SonarCloud bloquea PRs que rompan el Quality Gate. Configuración en [`sonar-project.properties`](./sonar-project.properties). Quality gate exige: cobertura ≥ 70 % en código nuevo, 0 vulnerabilidades, 0 bugs críticos, duplicación ≤ 3 %.

---

## CI/CD

Pipeline principal en [`.github/workflows/ci.yml`](./.github/workflows/ci.yml). Trazabilidad:

```
requerimientos (docs/scrum/)
        │
        ▼
desarrollo (PR → review)
        │
        ▼
pruebas (unit → newman → cypress → k6)
        │
        ▼
calidad (SonarCloud Quality Gate)
        │
        ▼
despliegue (build Docker → docker-compose up demo)
```

---

## Integración MCP

El servidor MCP (`mcp-server/`) expone herramientas que permiten a un agente (p. ej. Claude Desktop) consultar el sistema en lenguaje natural:

- `listar_estudiantes_pendientes_validacion`
- `consultar_estado_postulacion(estudianteId)`
- `listar_vacantes_activas`
- `estadisticas_proceso_vinculacion`
- `revisar_logs_pipeline(workflowRunId?)`
- `asistente_tecnico(query)`

Ejemplo de pregunta soportada: *"¿Qué estudiantes han tenido más rechazos en validación esta semana?"* → el agente invoca `estadisticas_proceso_vinculacion` y `listar_estudiantes_pendientes_validacion` y responde con datos reales del backend.

Configuración del cliente en [`mcp-server/README.md`](./mcp-server/README.md).

---

## Trazabilidad Scrum

Artefactos en [`docs/scrum/`](./docs/scrum/):

- Product Backlog ([`product-backlog.md`](./docs/scrum/product-backlog.md))
- Sprint Backlog Sprint 1 y Sprint 2
- Historias de usuario con criterios de aceptación
- Definition of Done
- Tablero de gestión: GitHub Projects ([enlace en el README de Scrum])

Mapa requerimiento → endpoint → test → pipeline en [`docs/scrum/trazabilidad.md`](./docs/scrum/trazabilidad.md).

---

## Equipo

Proyecto desarrollado por el equipo de la asignatura **Despliegue Continuo** de la Universidad Empresarial.

Documentación de soporte en `/home/jaydethsp/proyecto_kelly_doc/`.
