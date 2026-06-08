# Frontend SIVU — React 18 · Vite · TypeScript · Tailwind · shadcn/ui

SPA (PWA instalable) que consume la API del backend. Aquí se explica **cómo se cumple el flujo en la
interfaz** (qué pantalla y archivo hace cada paso), la estructura y cómo correrlo.

---

## Estructura

```
src/
├── features/<modulo>/    Páginas por dominio (co-localizadas)
│   └── *-page.tsx        Cada pantalla + sus componentes
├── components/
│   ├── ui/               shadcn/ui (Button, Dialog, Select, Table, …)
│   ├── layout/           app-shell.tsx, sidebar.tsx, topbar.tsx
│   ├── error-boundary.tsx, page-header.tsx, status-badge.tsx, empty-state.tsx,
│   └── role-guard.tsx, protected-route.tsx, uniempresarial-logo.tsx
├── lib/
│   ├── api.ts            axios + interceptor de refresh-token (single-flight)
│   ├── auth-store.ts     Zustand (token + usuario, persistido en localStorage)
│   ├── types.ts          tipos de todos los DTOs del backend
│   ├── enum-labels.ts    enums → etiquetas en español + variantes de badge
│   └── theme.ts, utils.ts
├── App.tsx               rutas (React Router) con lazy + RoleGuard
└── main.tsx              bootstrap + ErrorBoundary + registro del service worker (PWA)
```

**Patrones:**
- Datos del servidor con **TanStack Query** (`useQuery`/`useMutation`); nada de estado de servidor
  en Zustand. Zustand solo guarda la sesión.
- Formularios con **react-hook-form + zod**.
- TypeScript **estricto, cero `any`**.
- Rutas con **code-splitting** (`React.lazy`) — cada feature es su propio chunk.

---

## Cómo se cumple el flujo (paso → pantalla → archivo)

| Etapa | Ruta | Archivo | Rol |
|---|---|---|---|
| Login | `/login` | `features/auth/login-page.tsx` | todos |
| Dashboard | `/` | `features/dashboard/dashboard-page.tsx` | todos (contenido por rol) |
| **Mi Hoja de Vida** | `/mi-hoja-vida` | `features/hoja-vida/mi-hoja-vida-page.tsx` | estudiante |
| Bandeja HV + feedback | `/hoja-vida/bandeja` | `features/hoja-vida/bandeja-hv-page.tsx` + `hoja-vida-timeline.tsx` | Coformación |
| Vacantes | `/vacantes` | `features/vacantes/*` | todos |
| Postularse / Postulaciones | `/postulaciones` | `features/postulaciones/*` | estudiante/empresa/coord |
| Entrevistas | `/entrevistas` | `features/entrevistas/*` | empresa/coord |
| Documentos (con vigencia) | `/documentos` | `features/documentos/documentos-list-page.tsx` | todos |
| Prácticas / Convenios | `/convenios` | `features/convenios/convenio-detail-page.tsx` | todos |
| Plan actividades / Actas / Evaluaciones / Informe | dentro del convenio → trimestre | `features/trimestres/*` | varios |
| Programa interno (solicitudes + asignar) | `/programa-interno/solicitudes` | `features/fabrica-soluciones/solicitudes-fabrica-page.tsx` | Coformación |
| **Analítica institucional** | `/analytics` | `features/analytics/analytics-page.tsx` | Coformación/admin |
| Plantillas / Mis formularios | `/plantillas`, `/mis-formularios` | `features/plantillas/*` | admin / todos |
| Usuarios | `/admin/usuarios` | `features/admin/usuarios-admin-page.tsx` | admin |

**El menú (sidebar)** está en `components/layout/sidebar.tsx`: los items se agrupan por dominio y se
**filtran por rol**; las etiquetas también cambian por rol (ej. "Estudiantes" ↔ "Mis practicantes",
"Prácticas" ↔ "Mi práctica") mediante funciones `label*(roles)`.

**El feedback con IA** del informe está en `features/trimestres/informe-final-pm-page.tsx` (botón
"Revisar con IA" → `POST /ia/informe-final/{id}/feedback`).

---

## Autenticación y permisos

- `lib/auth-store.ts` guarda el JWT + usuario (persistido). `lib/api.ts` adjunta el token y maneja
  el **refresh** automático cuando expira.
- `components/protected-route.tsx` exige sesión; `components/role-guard.tsx` exige rol(es) para una ruta.
- En `App.tsx` las rutas sensibles van envueltas en `<RoleGuard allow={[...]}/>`.

---

## Configuración (env)

Vite lee `VITE_API_BASE_URL` **al arrancar** (si lo cambias, reinicia `pnpm dev`).

```bash
# frontend/.env.local  (local)
VITE_API_BASE_URL=http://localhost:8081/api/v1

# build de producción (Vercel) usa:
VITE_API_BASE_URL=https://sivu-backend.onrender.com/api/v1
```

---

## Correr, validar y construir

```bash
pnpm install
pnpm dev            # http://localhost:5173

pnpm tsc --noEmit   # type-check (debe pasar)
pnpm lint           # ESLint (0 errores; warnings ok)
pnpm build          # build de producción → dist/
```

---

## PWA

`public/manifest.webmanifest` + `public/sw.js` (service worker registrado en `main.tsx` **solo en
producción**). La app es instalable; el SW cachea el app-shell y nunca cachea `/api`.
