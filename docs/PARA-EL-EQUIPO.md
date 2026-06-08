# Para el equipo — Guía de onboarding de SIVU

Bienvenido/a. Esta guía es para que cualquier compañero/a pueda **levantar el proyecto, entenderlo
y contribuir** sin tener que preguntar. Léela completa una vez; después es referencia.

---

## 1. Qué es SIVU en 30 segundos

Sistema que digitaliza el proceso de **Coformación Empresarial** de Uniempresarial: un estudiante
crea su hoja de vida → Coformación la aprueba → se postula a una vacante → entrevista → convenio
firmado → fase activa (plan de actividades, actas, evaluaciones) → informe final → cierre. Todo con
los **formatos oficiales en PDF** y asistencia con IA.

- **Monorepo** con 4 aplicaciones: `backend/` (Java), `frontend/` (React), `mcp-server/` (Node),
  `ia-sidecar/` (Node).
- Dos bases de datos: **PostgreSQL** (todo el dominio) y **MongoDB** (solo usuarios/login).

---

## 2. Arranque rápido (15 min)

> Necesitas: **Docker**, **Java 21**, **Node 20**, **pnpm** (`npm i -g pnpm`), **Python 3** (para el seed).

```bash
git clone https://github.com/JaydethSp01/sivu.git
cd sivu
cp .env.example .env

# 1) Bases de datos en Docker
make dev-deps          # postgres (5432/5433) + mongo (27017/27018) + mailhog (8025)

# 2) Backend (deja esta terminal abierta)
cd backend
SERVER_PORT=8081 mvn spring-boot:run -Dspring-boot.run.profiles=dev
#   ⤷ arranca en :8081, corre las migraciones Flyway y SIEMBRA usuarios+catálogos solo.

# 3) Frontend (otra terminal)
cd frontend
echo "VITE_API_BASE_URL=http://localhost:8081/api/v1" > .env.local
pnpm install && pnpm dev          # http://localhost:5173

# 4) (opcional) datos de demo completos para que las pantallas no salgan vacías
python3 scripts/seed-demo-lifecycle.py http://localhost:8081/api/v1
```

Entra a http://localhost:5173 con `coord@uempresarial.edu.co` / `Coord123*`.

> **¿Por qué 8081 y no 8080?** En varias máquinas el 8080 está ocupado por otra cosa. 8081 evita
> el conflicto. Si usas 8080, ajusta el `VITE_API_BASE_URL` del frontend.

---

## 3. Mapa del proyecto (dónde está cada cosa)

### Backend — `backend/src/main/java/co/uempresarial/sivu/`
Está organizado **por feature** (no por capa global). Cada carpeta de feature tiene su propio
`domain/` (entidades JPA), `persistence/` (repositorios), `service/` (lógica), `web/` (controllers
+ DTOs) y a veces `pdf/` (generador del formato oficial).

| Feature | Qué contiene |
|---|---|
| `hojavida/` | Hoja de Vida institucional, su PDF, y el **hilo de feedback** Coformación↔estudiante |
| `postulacion/` | Postulaciones, **máquina de estados** (`PostulacionService.TRANSICIONES`) y eventos |
| `entrevista/` | Entrevistas; al crearlas mueven la postulación a `ENTREVISTA_PROGRAMADA` |
| `convenio/` | Convenios, firmas de las 3 partes, asignación de tutores, PDF del convenio |
| `trimestre/` | Núcleo de la fase activa: plan de actividades, actas, evaluaciones tutor/profesor + sus PDFs |
| `informefinalpm/` | Informe Final (GTC-FM-16), carátula, nivel, conteo real de páginas |
| `solicitudfabrica/` | Programa interno: solicitud → aprobar → **asignar proyecto** |
| `plantilla/` | Formularios configurables por el admin + respuestas dinámicas |
| `analytics/` | Consultas agregadas para el dashboard (empleabilidad, embudo, estudiantes en riesgo) |
| `ia/` | Feedback IA del informe (llama al sidecar; si no, heurístico local) |
| `documento/` | Documentos con **estados de vigencia** (ACTIVO / POR_VENCER / VENCIDO) |
| `automatizacion/` | Matching, certificados, **alertas de plazos** (job diario), notificaciones email |
| `security/` | JWT, configuración de Spring Security, `Usuario` (Mongo) |
| `admin/` | `SeedService` + `SeedBootstrap` (siembra al arrancar en dev/docker) |

**Migraciones**: `backend/src/main/resources/db/migration/V1..V21__*.sql`. **Nunca edites una
migración ya aplicada** — crea una nueva `V22__...`.

### Frontend — `frontend/src/`
- `features/<modulo>/` — cada módulo tiene sus páginas (`*-page.tsx`) y componentes.
- `components/` — UI compartida: `ui/` (shadcn) + propios (`page-header`, `status-badge`, `error-boundary`…).
- `lib/` — `api.ts` (axios + refresh token), `auth-store.ts` (Zustand), `types.ts`, `enum-labels.ts`.
- `components/layout/sidebar.tsx` — el menú; los items se filtran por rol y las etiquetas cambian por rol.

### Otros
- `mcp-server/src/tools/` — una tool MCP por archivo.
- `ia-sidecar/server.mjs` — el servicio de IA (Express + claude-agent-sdk).
- `scripts/seed-demo-lifecycle.py` — siembra un ciclo de práctica completo vía la API real.

---

## 4. Convenciones

- **Commits**: en español, estilo `feat:`, `fix:`, `chore:`, `docs:`. Identidad de Kelly
  (`jsimarrapolo@gmail.com`). El repo está en `master`.
- **Backend**: package-by-feature. Un endpoint nuevo va en `web/`, su lógica en `service/`,
  validación con `@Valid` + DTOs `record`. Excepciones de negocio → `BusinessException`.
- **Frontend**: TypeScript estricto, **cero `any`**. Datos del server con TanStack Query
  (`useQuery`/`useMutation`), formularios con react-hook-form + zod. Estilos con Tailwind + shadcn.
- **PDFs**: se generan **dentro de un método `@Transactional`** del service (porque
  `open-in-view: false`); el controller llama `service.generarPdf(id)`, nunca al generador directo.
- **Roles**: protege endpoints con `@PreAuthorize("hasAnyRole(...)")` y rutas del front con `RoleGuard`.

---

## 5. Antes de hacer push (checklist)

```bash
cd backend  && mvn -q compile          # compila
cd frontend && pnpm tsc --noEmit       # type-check
cd frontend && pnpm lint               # 0 errores (warnings ok)
cd frontend && pnpm build              # build de prod pasa
```

Si tocaste el MCP: `cd mcp-server && pnpm typecheck`.

---

## 6. Troubleshooting (lo que nos pasó a nosotros)

| Síntoma | Causa / Solución |
|---|---|
| Frontend dice "Sin conexión con el servidor" | `VITE_API_BASE_URL` apunta al puerto equivocado. Revisa `frontend/.env.local` y reinicia Vite (lee el env solo al arrancar). |
| `FATAL: autentificación password falló` (Postgres) | El `.env` no coincide con la BD local. Usa la de Docker (`make dev-deps`) en el puerto que expone (5432 o 5433). |
| `bad auth` con Mongo | Credenciales del *database user* (Atlas) o de la imagen local; revisa la URI. |
| Pantallas vacías (postulaciones/convenios/evaluaciones) | El seed base no crea el flujo completo. Corre `scripts/seed-demo-lifecycle.py`. |
| `MultipleBagFetchException` | Un `@EntityGraph` trae 2 `List` a la vez. Quítalas del graph y confía en `default_batch_fetch_size`. |
| `LazyInitializationException` al generar un PDF | El PDF se arma fuera de transacción. Genera dentro de un `@Transactional service.generarPdf(id)`. |
| El backend "se cae" al correr con `mvn spring-boot:run` en background | En algunos entornos el proceso recibe SIGTERM. Empaca el JAR (`mvn -DskipTests package`) y corre `java -jar target/sivu-backend.jar`. |

---

## 7. Despliegue

Está en producción (ver URLs en el README). La receta completa para volver a desplegar o entender
cómo está montado: **[`DESPLIEGUE.md`](./DESPLIEGUE.md)**.

---

## 8. Documentación adicional

- **Revisión para Coformación**: [`REVISION_COFORMACION.md`](./REVISION_COFORMACION.md) — qué cumple
  el sistema módulo por módulo.
- **Auditorías técnicas**: [`auditorias-INDEX.md`](./auditorias-INDEX.md) — arquitectura, BD, frontend, UX/UI.
- **Scrum**: [`scrum/`](./scrum/) — product backlog, historias, DoD.
- **Diagramas**: [`arquitectura/`](./arquitectura/) y [`diagramas/`](./diagramas/).

¿Dudas? Revisa primero el Swagger (http://localhost:8081/swagger-ui.html) — documenta todos los endpoints.
