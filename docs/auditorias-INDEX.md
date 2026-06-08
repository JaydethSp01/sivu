# Auditorías técnicas SIVU — 2026-05-26

Cuatro auditorías independientes ejecutadas por roles especializados sobre el estado actual del proyecto SIVU tras el rebranding Uniempresarial.

| # | Dominio | Reporte | Puntaje |
|---|---------|---------|---------|
| 1 | Arquitectura backend | [auditoria-arquitectura.md](./auditoria-arquitectura.md) | **8 / 10** |
| 2 | Base de datos (PG + Mongo) | [auditoria-bd.md](./auditoria-bd.md) | **8 / 10** |
| 3 | Frontend (React + TS) | [auditoria-frontend.md](./auditoria-frontend.md) | **8 / 10** |
| 4 | UX / UI / Brand | [auditoria-uxui.md](./auditoria-uxui.md) | **8 / 10** |

**Promedio global: 8.0 / 10.** Proyecto académico maduro y por encima del promedio en todas las dimensiones.

## Hallazgos críticos consolidados (top 5)

Ordenados por riesgo. Resolver estos antes de la sustentación final.

1. 🚨 **`POST /api/v1/admin/seed` es `permitAll()`** y crea usuarios ADMIN — riesgo de escalación de privilegios. Proteger con `@PreAuthorize("hasRole('ADMIN')")` o eliminar en perfil prod. *(auditoria-arquitectura.md)*
2. 🚨 **JWT secret hardcodeado** en `application.yml` con valor default. Mover a variable de entorno obligatoria. *(auditoria-arquitectura.md)*
3. 🚨 **Sin ErrorBoundary global** en el frontend — un throw no controlado tumba toda la app. Fix de ~1h. *(auditoria-frontend.md)*
4. 🚨 **`pnpm lint` declarado pero `eslint.config.js` no existe** — red de seguridad ausente en CI. *(auditoria-frontend.md)*
5. 🚨 **Bundle sin code-splitting** — `App.tsx` importa estáticamente las ~50 páginas. `React.lazy` por ruta reduce el bundle inicial drásticamente. *(auditoria-frontend.md)*

## Quick wins (todos < 2h)

- Variant `secondary` del `Button` usa el soft rosado en vez del rojo institucional — un cambio de token en `button.tsx:27` *(uxui)*
- Sidebar plano con 22+ items: agruparlos por dominio reduce carga cognitiva *(uxui)*
- Añadir índices `pg_trgm + GIN` para las búsquedas `LOWER LIKE '%q%'` *(bd)*
- Centralizar query-keys en un módulo `queries/keys.ts` *(frontend)*
- Reemplazar `window.location.href` por `useNavigate` para no romper SPA *(frontend)*

## Recomendación

El proyecto está **listo para sustentación** desde el punto de vista funcional. Los 5 hallazgos críticos son **fáciles de resolver en una sesión de trabajo** y vale la pena cerrarlos antes de la entrega final.
