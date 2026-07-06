# Despliegue de SIVU en la nube

Cómo está montado el ambiente productivo y cómo replicarlo. Todo en **tiers gratuitos**.

---

## Arquitectura productiva

```
   Usuario
     │
     ▼
┌─────────────────────┐        HTTPS / CORS         ┌──────────────────────────┐
│ Frontend            │ ──────────────────────────▶ │ Backend (Spring Boot)    │
│ Vercel (estático)   │                             │ Render — Docker          │
│ sivu-platform       │                             │ sivu-backend.onrender.com│
└─────────────────────┘                             └────┬───────────────┬─────┘
                                                         │               │
                                       JDBC (sslmode=require)        Spring Data Mongo
                                                         ▼               ▼
                                              ┌──────────────┐   ┌──────────────────┐
                                              │ Supabase     │   │ MongoDB Atlas    │
                                              │ PostgreSQL   │   │ (usuarios/auth)  │
                                              └──────────────┘   └──────────────────┘
        ┌──────────────────────────┐
        │ IA Sidecar (Node)        │ ◄── backend /ia/...feedback (IA_SIDECAR_URL)
        │ Render — Docker          │     usa el plan Claude Code (CLAUDE_CODE_OAUTH_TOKEN)
        │ sivu-ia-sidecar.onrender │
        └──────────────────────────┘
```

| Componente | Proveedor | Notas |
|---|---|---|
| Frontend | **Vercel** | Sitio estático (build de Vite). Deployment protection **desactivada**. |
| Backend | **Render** (free, Docker) | `backend/Dockerfile`. Cold start ~2 min cuando idle. |
| IA sidecar | **Render** (free, Docker) | `ia-sidecar/Dockerfile`. |
| PostgreSQL | **Supabase** | Pooler JDBC + `sslmode=require`. Flyway (21 migraciones) corre al arrancar el backend. |
| MongoDB | **Mongo Atlas** (M0 free) | Solo la colección `usuarios`. Network Access: `0.0.0.0/0`. |
| Repo | **GitHub** (público) | Render free clona repos públicos sin OAuth. |
| Keep-alive | **cron-job.org** | Ping cada 5 min al `/actuator/health` para evitar el cold start. |

---

## Variables de entorno del backend (Render)

| Variable | Valor / fuente |
|---|---|
| `SPRING_PROFILES_ACTIVE` | `docker` |
| `SERVER_PORT` | *(no se setea)* — Render inyecta `PORT`; el app lo lee con `server.port=${PORT:8080}` |
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://<region>.pooler.supabase.com:5432/postgres?sslmode=require` |
| `SPRING_DATASOURCE_USERNAME` | `postgres.<project-ref>` (formato del pooler de Supabase) |
| `SPRING_DATASOURCE_PASSWORD` | contraseña de la BD en **Project Settings → Database** |
| `SPRING_DATA_MONGODB_URI` | `mongodb+srv://<user>:<pass>@<cluster>/sivu_users?retryWrites=true&w=majority` |
| `JWT_SECRET` | **≥ 64 caracteres** (HS512 lo exige) |
| `IA_SIDECAR_URL` | `https://sivu-ia-sidecar.onrender.com` |
| `MANAGEMENT_HEALTH_MAIL_ENABLED` | `false` |
| `MANAGEMENT_HEALTH_MONGO_ENABLED` | `false` |
| `APP_MAIL_ENABLED` | `false` (no hay SMTP en prod) |
| `APP_MAIL_FROM` | `no-reply@sivu.uempresarial.edu.co` |

**IA sidecar**: `CLAUDE_CODE_OAUTH_TOKEN` (de `claude setup-token`) y `PORT=8090`.

**Frontend (build de Vite)**: `VITE_API_BASE_URL=https://sivu-backend.onrender.com/api/v1`.

---

## Pasos para desplegar desde cero

1. **GitHub** — push del repo (público para Render free).
2. **Supabase** — crear proyecto → **Project Settings → Database → Connection string**
   (modo *URI*, pooler *Session* en puerto 5432) → convertir a JDBC:
   - **URL:** `jdbc:postgresql://<region>.pooler.supabase.com:5432/postgres?sslmode=require`
   - **User:** `postgres.<project-ref>` (no uses solo `postgres` con el pooler)
   - **Password:** la de la BD del proyecto (reseteable en el panel)
3. **Mongo Atlas** — crear cluster M0, un *database user*, Network Access `0.0.0.0/0`, tomar la URI.
4. **Render backend** — `New Web Service` desde el repo, Docker, `rootDir=backend`,
   `dockerfilePath=./Dockerfile`, `dockerContext=.`, plan free, healthCheck `/actuator/health`, +
   las variables de arriba.
5. **Render IA sidecar** — igual con `rootDir=ia-sidecar` y `CLAUDE_CODE_OAUTH_TOKEN`.
6. **Vercel** — build del frontend con `VITE_API_BASE_URL` apuntando al backend de Render; el deploy
   debe incluir un `vercel.json` con rewrite SPA (ver gotcha #6).
7. **Keep-alive** — cron-job.org pingeando `/actuator/health` cada 5 min.

> Las credenciales se manejan vía API; nunca se commitean. El `.gitignore` cubre `.env*`,
> `.mongo-atlas.env`, `.supabase*.env`, `.render*.env`.

---

## Gotchas resueltos (lecciones aprendidas)

Estos nos costaron tiempo; documentados para que no se repitan:

1. **Dockerfile path doble-anidado.** Con `rootDir=backend`, el `dockerfilePath` es **relativo a
   rootDir** → debe ser `./Dockerfile` y contexto `.`, no `backend/Dockerfile` (eso busca
   `backend/backend/Dockerfile` y el build falla).

2. **JWT_SECRET corto.** HS512 exige ≥ 64 bytes. Un secreto de 62 chars rompe el arranque
   (`IllegalStateException`). Genera uno de 80.

3. **Connection string de Mongo vacía/truncada.** La URI tiene `&` (`?retryWrites=true&w=majority`);
   al pasarla por shell se trunca. Setea la env var con un PUT JSON (no por shell directo).

4. **El healthcheck nunca pasa → deploy se queda en `update_in_progress` y falla.** Causa: el
   `MailHealthIndicator` de Actuator intenta conectar a SMTP `localhost` y marca `/actuator/health`
   como DOWN (503). Fix: `MANAGEMENT_HEALTH_MAIL_ENABLED=false`. (También desactivamos
   `MANAGEMENT_HEALTH_MONGO_ENABLED` porque Atlas M0 tarda ~27s en el primer health.)

5. **Puerto.** Render inyecta `PORT` (10000). El app debe leerlo: `server.port=${PORT:8080}`.

6. **Vercel + SPA → `/login` da 404.** Al desplegar la carpeta `dist` como estático, hay que incluir
   un `vercel.json` **dentro de dist** con `{"rewrites":[{"source":"/(.*)","destination":"/index.html"}]}`
   para que las rutas del client-side router resuelvan.

7. **Vercel Deployment Protection.** Por defecto el proyecto puede pedir login de Vercel (401).
   Desactívalo (`ssoProtection: null`) para que el sitio sea público.

8. **Cold start (Render free).** El servicio se duerme tras 15 min idle. Un ping cada 5 min
   (cron-job.org) lo mantiene caliente. Para always-on real sin trucos: Render Starter ($7/mes).

9. **Supabase pooler + username.** Con el pooler de Supabase el usuario JDBC no es `postgres` sino
   `postgres.<project-ref>`. Si la auth falla en Render pero DBeaver conecta (o viceversa), revisa
   que estés usando el mismo modo (pooler vs direct) y el user correcto. Al resetear la contraseña
   en Supabase hay que actualizar `SPRING_DATASOURCE_PASSWORD` en Render.

---

## Sembrar datos de demo en producción

```bash
python3 scripts/seed-demo-lifecycle.py https://sivu-backend.onrender.com/api/v1
```

Crea un ciclo de práctica completo (idempotente) para que la demo no muestre pantallas vacías.

---

## Limitaciones del tier gratuito

- **Render free**: cold start ~2 min, 512 MB RAM, 750 h/mes por workspace.
- **Atlas M0**: latencia de ~25-30 s en la primera conexión, almacenamiento limitado.
- **Supabase free**: 500 MB de BD, límites de conexiones del pooler; el proyecto puede pausarse tras
  inactividad prolongada (re-activa solo, agrega latencia al primer query).

Para una demostración en vivo: **abrir el sitio 2-3 min antes** y/o tener el keep-alive corriendo.
