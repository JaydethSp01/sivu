# SIVU — Guía de presentación del equipo

> **Proyecto final · Despliegue Continuo · Promoción 15B**  
> **Equipo:** Jaydeth Innacio Simarra Polo (Backend) · Bryam Stevens Villalba Culma (Frontend) · Daniel Arturo Bolívar Verano (BD y modelo de datos)  
> **Demo en vivo:** https://sivu-platform.vercel.app  
> **Repositorio:** https://github.com/JaydethSp01/sivu

Este documento está pensado como guion para la exposición. Cada integrante tiene su bloque numerado. Al final hay una **matriz de cumplimiento** contra el enunciado de la materia y el documento de requerimientos de Coformación v2.

---

## 1. ¿Qué es nuestra solución? *(todos — apertura, ~3 min)*

### El problema (AS-IS)

En Uniempresarial, el proceso de **Coformación Empresarial** (prácticas de 6 meses) todavía depende en gran medida de:

- Formularios en **Excel y Word** (GAC-FM-10, GAC-FM-11, GAC-FM-1, GAC-FM-9, GTC-FM-16).
- Envío de documentos por **correo** y seguimiento manual.
- Poca visibilidad para el **estudiante** sobre el estado de su trámite.
- Coordinación de reuniones por **WhatsApp** u otros canales externos.

### Nuestra solución (SIVU)

**SIVU** (*Sistema de Vinculación Universitaria*) es una **plataforma web** que digitaliza y automatiza el ciclo completo de Coformación:

| Qué hace | Cómo lo resuelve |
|---|---|
| Formularios institucionales | Los 5 formatos oficiales se diligencian **dentro de la plataforma** y se generan como **PDF** con logo, firmas y sello de tiempo |
| Interacción entre actores | **Estudiante**, **Docente Acompañante**, **Tutor Empresarial** y **Oficina de Coformación** trabajan en el mismo sistema, cada uno con su rol |
| Tres cortes del trimestre | Corte 1 (25 %) + Corte 2 (25 %) + Corte 3 (50 %) con evaluaciones, actas y nota final calculada |
| Agendamiento | Calendario colaborativo para proponer, aceptar o rechazar reuniones de acompañamiento (GAC-FM-11) |
| Expediente digital | Vista única con documentos, estados, notas y PDFs descargables |
| Asistencia inteligente | Agente **MCP** para consultar el sistema en lenguaje natural + revisión con **IA** del Informe Final |

### Actores del proceso

```
Estudiante          → diligencia plan, actas, informe final; propone reuniones
Docente Acompañante → evalúa cortes 1 y 2, gestiona agenda, firma actas
Tutor Empresarial   → evalúa corte 3 (acceso externo por token)
Oficina Coformación → supervisión, analítica, validación institucional
```

### Los 5 documentos que digitalizamos

| Código | Documento | Corte |
|---|---|---|
| GAC-FM-10 | Plan de Actividades | Corte 1 |
| GAC-FM-11 | Acta de Acompañamiento | Los 3 cortes |
| GAC-FM-1 | Evaluación del Profesor (2 cortes en columnas) | Cortes 1 y 2 |
| GAC-FM-9 / GAC-FM-007 | Evaluación del Tutor Empresarial | Corte 3 |
| GTC-FM-16 | Informe Final del Plan de Mejora | Corte 3 |

---

## 2. Stack tecnológico *(todos — ~2 min)*

| Capa | Tecnología | Responsable principal |
|---|---|---|
| **Frontend** | React 18 · Vite · TypeScript · TailwindCSS · shadcn/ui · PWA | Bryam |
| **Backend** | Spring Boot 3 · Java 21 · Maven · Spring Security · JWT | Jaydeth |
| **Core DB** | PostgreSQL 16 · Flyway (33 migraciones) · Supabase en prod | Daniel |
| **Users DB** | MongoDB 7 (auth, roles, perfiles) · Mongo Atlas en prod | Daniel |
| **PDFs** | OpenPDF (server-side) | Jaydeth |
| **IA** | Sidecar Node + `@anthropic-ai/claude-agent-sdk` (plan Claude Code) | Jaydeth |
| **MCP** | Node · TypeScript · `@modelcontextprotocol/sdk` (9 tools) | Jaydeth |
| **Contenedores** | Docker · docker-compose · imágenes en GHCR | Jaydeth / CI |
| **CI/CD** | GitHub Actions (7 jobs + deploy automático) | Jaydeth |
| **Despliegue** | Render (backend + IA sidecar) · Vercel (frontend) | Equipo |
| **Calidad** | JUnit · Newman · Cypress · k6 · SonarCloud · JaCoCo | Equipo |

---

## 3. Flujo general — cómo se habla todo el stack *(todos — ~3 min)*

### Diagrama de arquitectura

```
                         ┌─────────────────────────────────────┐
                         │  Usuario (navegador / móvil)        │
                         └──────────────────┬──────────────────┘
                                            │ HTTPS
                                            ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  FRONTEND — React SPA (Vercel)                                           │
│  https://sivu-platform.vercel.app                                        │
│  · Login JWT · formularios · expediente · agendamiento · PWA              │
└──────────────────────────────┬───────────────────────────────────────────┘
                               │ REST /api/v1  (JSON + JWT Bearer)
                               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  BACKEND — Spring Boot (Render, Docker)                                  │
│  https://sivu-backend.onrender.com                                       │
│  · Auth JWT · lógica de negocio · generación PDF · notificaciones        │
│  · Swagger UI · Flyway migrations al arrancar                            │
└───────┬──────────────────────────────┬───────────────────────────────────┘
        │ JDBC (sslmode=require)       │ Spring Data Mongo
        ▼                              ▼
┌───────────────────┐          ┌───────────────────┐
│ PostgreSQL        │          │ MongoDB           │
│ (Supabase prod)   │          │ (Atlas prod)      │
│ dominio académico │          │ usuarios / auth   │
└───────────────────┘          └───────────────────┘

        Backend ──POST /ia/informe-final/{id}/feedback──► IA Sidecar (Render)
                                                              │
                                                              ▼
                                                    Claude Code (sin API key)

        Claude Desktop ──stdio MCP──► MCP Server (Node) ──HTTP──► Backend API
```

### Flujo de una acción típica (ejemplo: estudiante envía Plan de Actividades)

1. **Bryam (FE):** el estudiante llena el formulario GAC-FM-10 en React; TanStack Query envía `POST /api/v1/planes-actividades`.
2. **Jaydeth (BE):** Spring valida JWT + rol, persiste en PostgreSQL, notifica docente y tutor.
3. **Daniel (BD):** los datos viven en tablas `plan_actividades`, `plan_actividades_objetivo`, `plan_actividades_mes` (relacionadas al `trimestre` del `convenio`).
4. Cuando los tres actores aprueban, el backend genera el **PDF oficial** y lo guarda en el expediente.
5. **CI/CD:** cualquier cambio en `master` pasa tests y, si todo verde, despliega automáticamente a Render + Vercel.

### Pipeline CI/CD (lo que viste en GitHub — 7 checks)

Cada `push` a `master` dispara:

| # | Job | Qué valida |
|---|---|---|
| 1 | **Backend (build + test + sonar)** | Compila, 21+ tests unitarios JUnit, JaCoCo, SonarCloud |
| 2 | **Frontend (build)** | `npm run build` de la SPA |
| 3 | **MCP server (build)** | Compila el servidor MCP |
| 4 | **API contract (Newman)** | Colección Postman completa contra backend levantado |
| 5 | **E2E (Cypress)** | Flujos auth, estudiantes y coformación en Chrome headless |
| 6 | **Docker images** | Build + push a GHCR (`backend`, `frontend`, `mcp`) |
| 7 | **CD — Deploy (Render + Vercel)** | Solo si todo lo anterior pasa → producción |

> **Sí cumplimos despliegue continuo dockerizado:** imágenes Docker en GHCR, backend y sidecar en Render (Dockerfile), frontend en Vercel, y el job `CD` despliega automáticamente tras el CI verde.

---

## 4. Base de datos y modelo de datos — Daniel *(~5 min)*

### Decisión arquitectónica (requisito de la materia)

El enunciado exige:

> *PostgreSQL para el Core de la API, pero los usuarios deben ser gestionados con otra base de datos en otra tecnología.*

| Base | Motor | Qué guarda |
|---|---|---|
| **Core** | PostgreSQL 16 | Estudiantes, empresas, vacantes, convenios, trimestres, planes, actas, evaluaciones, informes, plantillas |
| **Usuarios** | MongoDB 7 | Email, password hash (BCrypt), roles, enlaces lógicos a `estudianteId` / `empresaId` |

### Modelo relacional (PostgreSQL) — vista simplificada

```
estudiantes ── postulaciones ── convenios ── trimestre (1|2|3)
                                              ├── plan_actividades (+ objetivos + meses)
                                              ├── acta_reunion (+ temas)
                                              ├── evaluacion_profesor_trimestre (2 cortes)
                                              ├── evaluacion_tutor_trimestre
                                              └── plan_mejora → informe_final_pm (12 secciones)

empresas ── vacantes ── tutores
plantilla_formulario → seccion → criterio (EAV para formularios dinámicos)
agendamiento: disponibilidad_docente, propuesta_reunion, reunion_confirmada
```

### Flyway — evolución controlada del esquema

- **33 migraciones versionadas** (`V1__init_schema.sql` → `V33__...`).
- Al arrancar el backend en prod, Flyway aplica migraciones pendientes sobre **Supabase**.
- Ejemplos clave para Coformación:
  - `V7` — trimestres, planes, actas, evaluaciones
  - `V11` — evaluación profesor dos cortes
  - `V22` — agendamiento colaborativo
  - `V31`/`V32` — informe final 12 secciones
  - `V27` — calificación consolidada (25 % + 25 % + 50 %)

### MongoDB — colección `usuarios`

```json
{
  "email": "kelly@est.uempresarial.edu.co",
  "passwordHash": "$2a$...",
  "roles": ["ESTUDIANTE"],
  "estudianteId": 42
}
```

Los roles (`ESTUDIANTE`, `COORDINADOR`, `EMPRESA`, `ADMIN`, `MCP_AGENT`) controlan qué ve y hace cada usuario.

### Producción vs local

| Ambiente | PostgreSQL | MongoDB |
|---|---|---|
| **Local** | Docker (`make dev-deps`, puerto 5432) | Docker (puerto 27017) |
| **Producción** | Supabase (pooler JDBC + SSL) | MongoDB Atlas M0 |

### Qué decir en la presentación

> "Diseñamos un modelo relacional normalizado para el dominio académico y separamos la autenticación en MongoDB, cumpliendo el requisito de poliglota persistence. Flyway nos da trazabilidad de cada cambio de esquema y el mismo script corre en local, CI y producción."

---

## 5. Backend, MCP, IA y CI/CD — Jaydeth *(~8 min)*

### Backend Spring Boot

- **API REST** documentada en Swagger: https://sivu-backend.onrender.com/swagger-ui.html
- **Autenticación JWT** (HS512): login, refresh, registro, `@PreAuthorize` por rol.
- **Validaciones** con Bean Validation + reglas de negocio en servicios.
- **Manejo de errores** centralizado (`@ControllerAdvice`).
- **Organización:** package-by-feature (`estudiante/`, `convenio/`, `trimestre/`, `agendamiento/`, etc.).

### Módulos principales del backend (Coformación)

| Módulo | Endpoints clave | Función |
|---|---|---|
| Auth | `/auth/login`, `/auth/register` | JWT + roles |
| Plan de actividades | `/planes-actividades` | GAC-FM-10 + flujo de aprobación |
| Actas | `/actas-reunion` | GAC-FM-11 |
| Evaluaciones | `/evaluaciones-profesor`, `/evaluaciones-tutor` | GAC-FM-1 y GAC-FM-9 |
| Informe final | `/informes-final-pm` | GTC-FM-16 (12 secciones) |
| Agendamiento | `/agendamiento/*` | Calendario + propuestas de reunión |
| Expediente | `/expedientes/{estudianteId}` | Vista consolidada |
| IA | `/ia/informe-final/{id}/feedback` | Revisión del informe |
| PDF | generadores OpenPDF por formato | PDFs institucionales |

### Integración MCP (Punto 8 del enunciado — nuestra elección)

El enunciado pide elegir **IA convencional (punto 7) o MCP (punto 8)**. Elegimos **MCP**.

El **MCP Server** (`mcp-server/`) expone 9 tools que Claude Desktop / Claude Code consume vía stdio:

| Tool | Para qué sirve |
|---|---|
| `listar_vacantes_activas` | Vacantes publicadas |
| `listar_estudiantes_pendientes_validacion` | Estudiantes sin docs al día |
| `consultar_estado_postulacion` | Timeline de una postulación |
| `estadisticas_proceso` | Conteos del pipeline |
| `verificar_academico` | Veredicto académico |
| `matching_estudiante_vacante` | Score de compatibilidad |
| `asistente_tecnico` | Pregunta en lenguaje natural → elige tool |
| `revisar_logs_pipeline` | Último run de GitHub Actions |
| `revisar_informe_final` | Análisis del informe para revisión cualitativa |

**Demo sugerida en vivo:**

```
Usuario en Claude: "¿Cuántas vacantes activas hay?"
→ MCP llama listar_vacantes_activas → backend → respuesta en tabla markdown
```

Configuración: ver [`mcp-server/README.md`](../mcp-server/README.md).

### IA complementaria (Informe Final — requerimiento Coformación)

Además del MCP, tenemos un **IA Sidecar** (`ia-sidecar/`) desplegado en Render:

```
Frontend "Revisar con IA" → Backend → Sidecar POST /review → Claude Code
```

- Usa `@anthropic-ai/claude-agent-sdk` con el **plan Claude Code** (sin API key de Anthropic).
- Si el sidecar no está disponible, el backend usa un **revisor heurístico local** (secciones vacías, límite 15 páginas, carátula).

### CI/CD — núcleo de la materia

**Archivo:** `.github/workflows/ci.yml`

```
push master
    │
    ├── backend (JUnit + SonarCloud)
    ├── frontend (build)
    ├── mcp (build)
    ├── api-contract (Newman + Postman)
    ├── e2e (Cypress)
    ├── docker (push GHCR)          ← dockerizado
    └── deploy (Render + Vercel)    ← despliegue continuo
```

**Docker:**

- `backend/Dockerfile`, `frontend/Dockerfile`, `mcp-server/Dockerfile`, `ia-sidecar/Dockerfile`
- `docker-compose.yml` levanta todo el stack local
- Imágenes publicadas en `ghcr.io/jaydethsp01/sivu/*`

**Pruebas automatizadas (exigidas por la profe):**

| Tipo | Herramienta | Cantidad / alcance |
|---|---|---|
| Unitarias | JUnit 5 + Mockito | **21 tests** en 4 clases (mínimo exigido: 6) ✅ |
| API / contrato | Newman + Postman | Colección `tests/postman/SIVU.postman_collection.json` ✅ |
| Funcionales E2E | Cypress | 3 specs: auth, estudiantes, coformación ✅ |
| Rendimiento | k6 | 3 scripts: login, vacantes, postulaciones ✅ |
| Calidad | SonarCloud | Job en pipeline ✅ |

### Qué decir en la presentación

> "El backend es una API REST con Spring Boot que centraliza la lógica de Coformación, genera PDFs y expone Swagger. Integramos MCP para que un agente de IA consulte el sistema en lenguaje natural. El pipeline de GitHub Actions corre 7 jobs en cada push a master y, si todo pasa, despliega solo a producción — eso es despliegue continuo dockerizado."

---

## 6. Frontend — Bryam *(~5 min)*

### Stack frontend

- **React 18 + Vite + TypeScript estricto**
- **TailwindCSS + shadcn/ui** — look institucional consistente
- **TanStack Query** — cache y sincronización con la API
- **Zustand** — estado de sesión (JWT)
- **react-hook-form + zod** — formularios con validación
- **PWA instalable** — funciona en móvil (RNF-02 Coformación)

### Estructura por features

```
frontend/src/features/
├── auth/              → login, registro
├── expedientes/       → expediente digital unificado
├── trimestres/        → plan actividades, actas, evaluaciones, informe final
├── agendamiento/      → calendario, proponer reunión, bandeja docente
├── evaluacion-externa/→ tutor accede por token (sin cuenta institucional)
├── dashboard/         → analítica para Coformación
└── ...
```

### Pantallas clave para la demo (Coformación)

| Pantalla | Rol | Qué muestra |
|---|---|---|
| `/login` | Todos | Acceso por rol con menú dinámico |
| `/expediente/:id` | Estudiante / Docente | Documentos, estados, PDFs, notas |
| `/trimestres/plan-actividades` | Estudiante | Formulario GAC-FM-10 digital |
| `/trimestres/evaluacion-profesor` | Docente | Calificación cortes 1 y 2 |
| `/trimestres/informe-final-pm` | Estudiante | Editor 12 secciones + botón "Revisar con IA" |
| `/agendamiento/*` | Estudiante / Docente | Propuesta y confirmación de reuniones |

### Demo en producción — https://sivu-platform.vercel.app

**Usuarios de prueba (sembrados automáticamente):**

| Rol | Email | Contraseña |
|---|---|---|
| Coformación | `coord@uempresarial.edu.co` | `Coord123*` |
| Estudiante | `kelly@est.uempresarial.edu.co` | `Estudiante123*` |
| Empresa | `rrhh@coally.com` | `Empresa123*` |
| Admin | `admin@uempresarial.edu.co` | `Admin123*` |

> ⚠️ El backend está en **Render free**: puede tardar ~2 min en la primera carga (cold start). Recargar si la API no responde.

### Guion de demo sugerido para Bryam

1. Abrir **https://sivu-platform.vercel.app**
2. Login como **Estudiante** (`kelly@...`) → mostrar "Mi práctica" / expediente
3. Navegar al **Plan de Actividades** o **Informe Final** — formulario digital, no Excel
4. Mostrar descarga de **PDF** generado desde el expediente
5. (Opcional) Login como **Coformación** → dashboard / supervisión
6. Mencionar que el **menú lateral cambia** según el rol

### CI/CD del frontend

- Job **`Frontend (build)`** en cada push/PR
- Job **`E2E (Cypress)`** prueba la SPA compilada contra backend real
- Job **`CD — Deploy`** construye con `VITE_API_BASE_URL` apuntando al backend de Render y publica en Vercel con alias `sivu-platform.vercel.app`

### Qué decir en la presentación

> "El frontend es una SPA en React desplegada en Vercel. Cada rol ve solo lo que le corresponde. Los formularios de Coformación reemplazan los Excel institucionales y se conectan al backend por JWT. Cada push a master que pasa tests se despliega automáticamente a producción."

---

## 7. Validación de cumplimiento

### 7.1 Enunciado — Proyecto Final de Despliegue Continuo

| # | Requisito | ¿Cumple? | Evidencia |
|---|---|---|---|
| 1 | Enfoque ágil Scrum (backlog, sprints, HU, DoD, tablero, ≥2 sprints, trazabilidad) | ✅ | [`docs/scrum/`](./scrum/) — product backlog, sprint 1 y 2, historias, DoD, trazabilidad |
| 2 | Backend + Frontend + BD + Infraestructura + Pipeline + Arquitectura documentada | ✅ | [`docs/arquitectura/`](./arquitectura/), [`docs/DESPLIEGUE.md`](./DESPLIEGUE.md), repo completo |
| 3 | Backend API REST (Spring Boot + Swagger + auth + validaciones + errores + seguridad) | ✅ | Swagger en prod, Spring Security JWT, `@Valid`, OpenPDF |
| 4 | PostgreSQL core + otra BD para usuarios | ✅ | PostgreSQL (Supabase) + MongoDB (Atlas) |
| 5 | Pruebas automatizadas | ✅ | JUnit (21), Newman, Cypress, k6 |
| 6 | Calidad SonarCloud | ✅ | Job `backend → SonarCloud Scan` |
| 7 u 8 | IA **o** MCP | ✅ MCP (elegido) + IA sidecar complementaria para informe | [`mcp-server/`](../mcp-server/), [`ia-sidecar/`](../ia-sidecar/) |
| 9 | **CI/CD (núcleo)** | ✅ | `.github/workflows/ci.yml` — 7 jobs, deploy automático a Render + Vercel |
| — | **Dockerizado** | ✅ | Dockerfiles, docker-compose, job `Docker images` → GHCR |

### 7.2 Requerimientos Coformación SIVU v2 (documento del cliente)

| Requerimiento | Estado | Notas |
|---|---|---|
| RF-A01 GAC-FM-10 digital + aprobación tripartita + PDF | ✅ Implementado | `plan-actividades-page.tsx`, backend PDF |
| RF-A02 GAC-FM-1 dos cortes + PDF columnas paralelas | ✅ Implementado | `V11`, `evaluacion-profesor-page.tsx` |
| RF-A03 GAC-FM-9 tutor + continuidad empresa | ✅ Implementado | Acceso tutor por token, evaluación corte 3 |
| RF-A04 GTC-FM-16 12 secciones + carátula + nivel | ✅ Implementado | `V31`, `V18`, editor por secciones |
| RF-B01 Expediente digital unificado | ✅ Implementado | `expediente-page.tsx` |
| RF-B02 GAC-FM-11 actas de acompañamiento | ✅ Implementado | `acta-form-page.tsx` |
| RF-C01–C03 Agendamiento colaborativo | ✅ Implementado | `V22`, features `agendamiento/` |
| RF-D01–D02 Notificaciones automáticas | ✅ Parcial | Eventos críticos; mail deshabilitado en prod (`APP_MAIL_ENABLED=false`) |
| RNF-01 PDFs consistentes con formato oficial | ✅ | OpenPDF con plantillas por formato |
| RNF-02 Responsive / móvil | ✅ | Tailwind responsive + PWA |
| RNF-03 Cálculo nota final 25+25+50 | ✅ | `V27` calificación consolidada |
| RNF-04 Control de acceso por rol | ✅ | JWT + `@PreAuthorize` + scopes en FE |

### 7.3 Trazabilidad requerimiento → desarrollo → pruebas → despliegue

Documentada en [`docs/scrum/trazabilidad.md`](./scrum/trazabilidad.md):

```
Requerimiento (HU) → Componente Java/TS → Test JUnit/Newman/Cypress → Job CI/CD → Deploy prod
```

---

## 8. División de la exposición (sugerencia de tiempos)

| Orden | Quién | Tema | Min |
|---|---|---|---|
| 1 | Todos / Jaydeth | Qué es SIVU y el problema que resuelve | 3 |
| 2 | Todos | Stack y flujo general (diagrama) | 3 |
| 3 | Daniel | BD: Postgres + Mongo, Flyway, modelo | 5 |
| 4 | Jaydeth | Backend, MCP, IA, CI/CD (mostrar GitHub checks) | 8 |
| 5 | Bryam | Frontend + demo live en Vercel | 5 |
| 6 | Todos | Preguntas + matriz de cumplimiento | 4 |

**Total aproximado:** ~28 min

---

## 9. Links rápidos para proyectar

| Recurso | URL |
|---|---|
| App producción | https://sivu-platform.vercel.app |
| API / Swagger | https://sivu-backend.onrender.com/swagger-ui.html |
| Health backend | https://sivu-backend.onrender.com/actuator/health |
| IA sidecar health | https://sivu-ia-sidecar.onrender.com/health |
| GitHub Actions | https://github.com/JaydethSp01/sivu/actions |
| Documentación deploy | [`docs/DESPLIEGUE.md`](./DESPLIEGUE.md) |
| MCP setup | [`mcp-server/README.md`](../mcp-server/README.md) |
| Scrum / trazabilidad | [`docs/scrum/`](./scrum/) |

---

## 10. Respuestas a preguntas frecuentes del jurado

**¿Tienen despliegue continuo?**  
Sí. Push a `master` → CI (tests) → CD (Render + Vercel). Evidencia: screenshot de GitHub "All checks have passed" + job `CD — Deploy`.

**¿Está dockerizado?**  
Sí. Cada servicio tiene Dockerfile; CI publica imágenes en GHCR; Render corre backend y sidecar en contenedor.

**¿Por qué dos bases de datos?**  
Requisito explícito del enunciado: PostgreSQL para el dominio, otra tecnología (MongoDB) para usuarios/auth.

**¿IA o MCP?**  
MCP (punto 8). El sidecar de IA es complemento para revisión del Informe Final (requerimiento de Coformación).

**¿Qué pasa si falla un test?**  
El job `deploy` tiene `needs: [backend, frontend, mcp, api-contract, e2e]` — **no despliega** si algo falla.

**¿Cómo se conecta DBeaver a prod?**  
Supabase → Settings → Database → connection string. User pooler: `postgres.<project-ref>`. Ver [`docs/DESPLIEGUE.md`](./DESPLIEGUE.md).
