# SIVU — Sistema de Vinculación Universitaria

> Plataforma que automatiza el proceso de **Coformación Empresarial** de la Fundación
> Universitaria Empresarial de la Cámara de Comercio de Bogotá (Uniempresarial): desde la
> hoja de vida del estudiante hasta el informe final de la práctica, con generación de los
> formatos institucionales oficiales en PDF, firmas con sello de tiempo, y asistencia con IA.

Proyecto final de **Despliegue Continuo**. Demuestra integración de desarrollo, calidad,
automatización, despliegue continuo y **Model Context Protocol (MCP) + IA**.

---

## 🚀 Demo en vivo (producción)

| Pieza | URL |
|---|---|
| **Aplicación** | **https://sivu-platform.vercel.app** |
| Backend (API) | https://sivu-backend.onrender.com · [Swagger](https://sivu-backend.onrender.com/swagger-ui.html) |
| IA sidecar | https://sivu-ia-sidecar.onrender.com/health |

**Usuarios demo** (sembrados automáticamente):

| Rol (UI) | Email | Password |
|---|---|---|
| Admin | `admin@uempresarial.edu.co` | `Admin123*` |
| **Coformación** (coordinador) | `coord@uempresarial.edu.co` | `Coord123*` |
| Estudiante | `kelly@est.uempresarial.edu.co` | `Estudiante123*` |
| Empresa | `rrhh@coally.com` | `Empresa123*` |

> ⚠️ **Cold start**: el backend corre en Render free y se "duerme" tras 15 min de inactividad.
> Un cron externo (cron-job.org) lo mantiene caliente. Si la primera carga tarda ~2 min, es eso —
> recarga y listo. Detalle y arquitectura de despliegue en [`docs/DESPLIEGUE.md`](./docs/DESPLIEGUE.md).

---

## Tabla de contenido

- [Resumen](#resumen)
- [El proceso de Coformación (qué automatiza)](#el-proceso-de-coformación-qué-automatiza)
- [Roles del sistema](#roles-del-sistema)
- [Stack tecnológico](#stack-tecnológico)
- [Arquitectura](#arquitectura)
- [Estructura del monorepo](#estructura-del-monorepo)
- [Cómo ejecutar en local](#cómo-ejecutar-en-local)
- [Asistencia con IA (Claude Code, sin API key)](#asistencia-con-ia-claude-code-sin-api-key)
- [Integración MCP](#integración-mcp)
- [Despliegue en la nube](#despliegue-en-la-nube)
- [Pruebas y calidad](#pruebas-y-calidad)
- [Para el equipo (onboarding)](#para-el-equipo-onboarding)

---

## Resumen

**Problema (AS-IS):** el proceso de prácticas tiene cuellos de botella — carga manual de
documentos por correo, validación humana repetitiva, seguimiento a mano, los 5 formatos
oficiales llenados en Word/Excel, y nula visibilidad para el estudiante.

**Solución (SIVU):** sistema que automatiza hoja de vida institucional, validación académica,
matching estudiante↔vacante, entrevistas, carta de presentación, convenio con firmas, la fase
activa completa (plan de actividades, actas, evaluaciones), el informe final y el cierre — con
**generación automática de los 5 formatos oficiales en PDF**, notificaciones, un **dashboard de
analítica institucional**, **asistencia con IA** sobre el informe final, y un **agente MCP** para
consultar el sistema en lenguaje natural.

---

## El proceso de Coformación (qué automatiza)

El ciclo completo de una práctica, de inicio a fin:

```
Hoja de Vida ──► revisión Coformación (aprobar/feedback) ──► Vacantes ──► Postulación
     │                                                                        │
     └── PDF HV Uniempresarial                                                ▼
                                                              Entrevista ──► Carta de presentación
                                                                                │
                                          Convenio ◄────────────────────────────┘
                                    (3 firmas: estudiante/empresa/universidad)
                                             │
                          ┌──────────────────┴─── FASE ACTIVA (por trimestre) ───┐
                          ▼                                                       ▼
              Plan de Actividades (GAC-FM-10)                     3 Actas de reunión (GAC-FM-11)
              Evaluación del Tutor (GAC-FM-007)            Evaluación del Profesor (GAC-FM-1, 2 cortes)
                          │
                          ▼
              Plan de Mejora ──► Informe Final (GTC-FM-16) ──► Cierre con nota + continuidad
```

**Programa interno (plan B):** si el estudiante no consigue empresa, solicita ingreso →
Coformación aprueba y le **asigna un proyecto interno**.

**Los 5 formatos oficiales** se generan como PDF institucional desde el sistema:

| Formato | Documento |
|---|---|
| **GAC-FM-007 v2.0** | Evaluación del Tutor Empresarial |
| **GAC-FM-1 v3** | Evaluación del Profesor Acompañante (2 cortes) |
| **GAC-FM-11 v2.0** | Acta de Reunión de Acompañamiento |
| **GAC-FM-10 v2.0** | Plan de Actividades |
| **GTC-FM-16 v3.0** | Informe Final del Plan de Mejora |

Además: PDF de Hoja de Vida y de Convenio. Las firmas llevan **sello de tiempo**.

---

## Roles del sistema

| Rol técnico | UI muestra | Qué hace |
|---|---|---|
| `ADMIN` | Admin | Todo + gestión de usuarios y catálogos |
| `COORDINADOR` | **Coformación** | Aprueba HV (con feedback), gestiona empresas/tutores, asigna proyectos del programa interno, ve analítica |
| `ESTUDIANTE` | Estudiante | Llena su HV, se postula, llena formularios, ve su práctica |
| `EMPRESA` | Empresa | Publica vacantes, programa entrevistas, evalúa practicantes |
| `MCP_AGENT` | — | Cuenta de servicio para el agente MCP |

> El menú lateral y las etiquetas cambian dinámicamente según el rol (ej. "Estudiantes" vs
> "Mis practicantes", "Prácticas" vs "Mi práctica").

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| **Backend** | Spring Boot 3 · Java 21 · Maven · **package-by-feature** (cada feature: `domain` / `persistence` / `service` / `web` / `pdf`) |
| **Core DB** | PostgreSQL 16 + **Flyway** (21 migraciones versionadas) |
| **Users DB** | MongoDB 7 (colección `usuarios` / auth) |
| **PDFs** | OpenPDF (server-side, sin dependencias externas) |
| **Auth** | Spring Security · JWT (HS512) · `@PreAuthorize` por rol |
| **Frontend** | React 18 · Vite · TypeScript estricto · TailwindCSS · shadcn/ui · **PWA instalable** |
| **Estado FE** | TanStack Query · Zustand · react-hook-form · zod · @dnd-kit |
| **IA** | **`@anthropic-ai/claude-agent-sdk`** vía sidecar Node (usa el plan Claude Code, **sin API key**) |
| **MCP** | Node · TypeScript · `@modelcontextprotocol/sdk` (9 tools) |
| **Email local** | MailHog (SMTP + UI 8025) |
| **Despliegue** | Docker · Render (backend + sidecar) · Vercel (frontend) · Neon (PG) · Mongo Atlas |
| **Calidad** | JUnit 5 · Mockito · ESLint flat config · SonarCloud · JaCoCo |
| **CI/CD** | GitHub Actions |

---

## Arquitectura

```
┌──────────────┐   HTTPS/JWT   ┌──────────────────────────┐   JPA   ┌──────────────┐
│  Frontend    │ ─────────────▶│  Backend Spring Boot     │ ───────▶│ PostgreSQL   │
│  React (PWA) │               │  - REST API + Security   │         │ (dominio)    │
│  Vercel      │               │  - Flyway · OpenPDF      │         └──────────────┘
└──────────────┘               │  - 5 formatos oficiales  │ Spring  ┌──────────────┐
                               │  - Analytics · Alertas   │ Data    │ MongoDB      │
                               └───┬──────────────────┬───┘ Mongo──▶│ (usuarios)   │
                          HTTP /review                │              └──────────────┘
                                   ▼                  ▼
                        ┌──────────────────┐   ┌──────────────┐
                        │ IA Sidecar (Node)│   │ MCP Server   │──▶ Claude Desktop /
                        │ claude-agent-sdk │   │ (Node, stdio)│    Claude Code
                        │ → plan Claude    │   │ 9 tools      │
                        │   Code (sin key) │   └──────────────┘
                        └──────────────────┘
```

Diagramas C4/BPMN/ER en [`docs/arquitectura/`](./docs/arquitectura/) y [`docs/diagramas/`](./docs/diagramas/).

---

## Estructura del monorepo

```
sivu/
├── backend/                  Spring Boot 3 + Java 21 — package-by-feature
│   ├── src/main/java/co/uempresarial/sivu/
│   │   ├── hojavida/         Hoja de Vida institucional + hilo de feedback
│   │   ├── postulacion/      Postulaciones + máquina de estados + eventos
│   │   ├── entrevista/       Entrevistas y resultados
│   │   ├── convenio/         Convenios + firmas (3 partes) + PDF
│   │   ├── trimestre/        Plan actividades, actas, evaluaciones (GAC-FM-*), PDFs
│   │   ├── informefinalpm/   Informe Final (GTC-FM-16) + carátula/nivel
│   │   ├── solicitudfabrica/ Programa interno (solicitud → aprobar → asignar)
│   │   ├── plantilla/        Formularios configurables (admin) + respuestas
│   │   ├── analytics/        Dashboard: empleabilidad, embudo, estudiantes en riesgo
│   │   ├── ia/               Feedback IA al informe (sidecar + heurístico fallback)
│   │   ├── documento/        Documentos con estados de vigencia (ACTIVO/VENCIDO)
│   │   ├── automatizacion/   Matching, certificados, alertas de plazos, notificaciones
│   │   ├── security/         JWT, Spring Security, Usuario (Mongo)
│   │   ├── admin/            Seed + jobs manuales
│   │   └── ...               estudiante, empresa, vacante, tutor, cohorte, catalogo
│   ├── src/main/resources/db/migration/   V1..V21 (Flyway)
│   └── Dockerfile
├── frontend/                 React + Vite + TS + Tailwind + shadcn/ui (PWA)
│   └── src/features/<modulo>/   páginas por dominio co-localizadas
├── ia-sidecar/               Servicio IA (Node) — plan Claude Code, sin API key
├── mcp-server/               Servidor MCP (Node TS) — 9 tools
├── scripts/
│   └── seed-demo-lifecycle.py   Siembra un ciclo de práctica COMPLETO vía API
├── docs/
│   ├── PARA-EL-EQUIPO.md     ← guía de onboarding para compañeros
│   ├── DESPLIEGUE.md         ← receta de deploy (Render+Vercel+Neon+Atlas) + gotchas
│   ├── REVISION_COFORMACION.md   revisión del sistema para la oficina
│   ├── auditoria-*.md        auditorías (arquitectura, BD, frontend, UX/UI)
│   ├── arquitectura/ diagramas/ scrum/ capturas/
├── .github/workflows/        CI + keep-alive
├── docker-compose.yml · docker-compose.dev.yml · Makefile · .env.example
└── README.md
```

---

## Cómo ejecutar en local

### Prerrequisitos
- Docker ≥ 24 (para las BBDD), Java 21, Node.js ≥ 20, `make` (opcional)

### Opción A — dependencias en Docker + apps en host (recomendado dev)

```bash
cd sivu
cp .env.example .env
make dev-deps              # postgres + mongo + mailhog en Docker

# Backend (en otra terminal). Si el 8080 está ocupado, usa SERVER_PORT=8081:
cd backend && SERVER_PORT=8081 mvn spring-boot:run -Dspring-boot.run.profiles=dev

# Frontend (en otra terminal). Apunta al backend:
cd frontend
echo "VITE_API_BASE_URL=http://localhost:8081/api/v1" > .env.local
pnpm install && pnpm dev   # http://localhost:5173
```

El backend **siembra usuarios + catálogos automáticamente** en perfil `dev` (ver `SeedBootstrap`).

### Sembrar un ciclo de práctica COMPLETO (datos para demo)

Para que **ninguna pantalla salga vacía** (postulaciones, convenios, evaluaciones, informe…):

```bash
python3 scripts/seed-demo-lifecycle.py http://localhost:8081/api/v1
```

Recorre HV → postulación → entrevista → carta → convenio → trimestre → plan → 3 actas →
evaluaciones → plan de mejora → informe final → cierre. Es **idempotente** (sale si ya existe).

### Opción B — todo dockerizado

```bash
make up        # postgres, mongo, mailhog, backend, frontend
make demo      # + espera salud + seed
```

| Servicio | URL local |
|---|---|
| Frontend | http://localhost:5173 |
| Swagger | http://localhost:8080/swagger-ui.html (o 8081) |
| MailHog | http://localhost:8025 |

---

## Asistencia con IA (Claude Code, sin API key)

El **Informe Final** tiene un botón **"Revisar con IA"** que da feedback formativo
(secciones vacías/pobres, extensión, carátula, recomendaciones).

- **Sin API key de pago**: el `ia-sidecar/` usa `@anthropic-ai/claude-agent-sdk`, que corre con
  el **plan de Claude Code** (sesión logueada en local, o `CLAUDE_CODE_OAUTH_TOKEN` en deploy).
- **Fallback**: si el sidecar no está disponible, el backend usa un **revisor heurístico local**
  (sin red), así el sistema funciona siempre.

```
Frontend ──► Backend /ia/informe-final/{id}/feedback ──► IA Sidecar /review ──► Claude Code
                          (si IA_SIDECAR_URL está set, si no: heurístico local)
```

Correr local: `cd ia-sidecar && npm install && npm start` (usa tu sesión de Claude Code), y el
backend con `IA_SIDECAR_URL=http://localhost:8090`. Detalle en [`ia-sidecar/README.md`](./ia-sidecar/README.md).

---

## Integración MCP

El `mcp-server/` (Node, stdio) expone **9 tools** para que Claude Desktop / Claude Code consulten
SIVU en lenguaje natural — cumple el punto 8 del enunciado:

`listar_vacantes_activas` · `consultar_estado_postulacion` · `estadisticas_proceso` ·
`verificar_academico` · `listar_estudiantes_pendientes_validacion` · `matching_estudiante_vacante` ·
`asistente_tecnico` · `revisar_logs_pipeline` · **`revisar_informe_final`**

Ejemplo: *"revisa el informe final 1"* → el agente llama `revisar_informe_final`, el backend
devuelve el análisis, y Claude le suma su revisión cualitativa. Setup en
[`mcp-server/README.md`](./mcp-server/README.md).

---

## Despliegue en la nube

Arquitectura productiva: **Vercel** (frontend) + **Render** (backend + IA sidecar) +
**Neon** (PostgreSQL) + **Mongo Atlas** (usuarios). La receta completa, las variables de entorno
y los **gotchas resueltos** (puerto $PORT, JWT ≥64 chars, health de mail/mongo, rewrite SPA, etc.)
están en **[`docs/DESPLIEGUE.md`](./docs/DESPLIEGUE.md)**.

---

## Pruebas y calidad

| Tipo | Cómo correr |
|---|---|
| Unitarias backend | `cd backend && mvn test` |
| Lint frontend | `cd frontend && pnpm lint` |
| Type-check FE | `cd frontend && pnpm tsc --noEmit` |
| Type-check MCP | `cd mcp-server && pnpm typecheck` |
| Build prod FE | `cd frontend && pnpm build` |
| Contrato API | `make test-api` (Newman) |
| E2E | `make test-e2e` (Cypress) |

---

## Para el equipo (onboarding)

👉 Lee **[`docs/PARA-EL-EQUIPO.md`](./docs/PARA-EL-EQUIPO.md)** — guía de arranque para compañeros:
mapa del proyecto, convenciones, cómo levantar todo, troubleshooting, y cómo contribuir.

Auditorías técnicas (arquitectura, BD, frontend, UX/UI) en [`docs/auditorias-INDEX.md`](./docs/auditorias-INDEX.md).

---

Desarrollado por el equipo de **Despliegue Continuo** — Uniempresarial.
