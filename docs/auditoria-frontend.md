# Auditoría Frontend SIVU

**Stack:** React 18.3 + Vite 5 + TS 5.6 (strict) + Tailwind 3.4 + shadcn/ui + React Query 5 + react-hook-form + zod + axios + Zustand + @dnd-kit
**Tamaño:** ~20.2k LOC TS/TSX · 23 features co-localizados · 23 primitivos shadcn · 1 hook custom

---

## Fortalezas

- **TS estricto real**: `strict`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch` activos; **cero `any`** en `src/`. `types.ts` (1038 LOC) centraliza DTOs alineados al backend.
- **Capa HTTP robusta** (`src/lib/api.ts`): interceptor con refresh-token single-flight (`refreshing` Promise compartida), `extractApiMessage` con tabla `STATUS_FRIENDLY` y fallback amigable para 5xx, salta refresh en rutas `/auth/*` para evitar loops.
- **Organización feature-first** clara (`src/features/<modulo>/<page>-page.tsx`), 23 módulos co-localizados, naming consistente `*-list-page`, `*-form-page`, `*-detail-page`.
- **Guards declarativos** mínimos y limpios: `ProtectedRoute` + `RoleGuard` con `<Outlet/>` (composición react-router v6 idiomática). `useAuthStore.hasRole(...roles)` legible.
- **UX honesta**: sidebar con etiquetas dinámicas por rol (`labelEstudiantes`, `labelPracticas`…), toasts con `sonner`, login con login pulido (dark mode toggle, demo creds, alt text en imagen institucional).

## Hallazgos críticos

- **Sin error boundary global**: cero `ErrorBoundary` en `src/`. Un throw en cualquier feature tumba toda la app a pantalla blanca. Bloqueante para entrega académica.
- **Sin ESLint configurado pese a `pnpm lint`**: `package.json:9` declara `"lint": "eslint ."` pero no existe `eslint.config.js`/`.eslintrc*`. El comando falla silenciosamente y no hay red de seguridad de lint en CI.
- **Sin code-splitting**: `App.tsx:10-60` importa **~50 páginas estáticamente**. El bundle inicial carga catálogos, admin, trimestres, plantillas, fábrica-soluciones para todos los usuarios.

## Mejoras recomendadas

- **Lazy-load rutas por feature** con `React.lazy` + `<Suspense fallback={<Skeleton/>}>` en `App.tsx`. Quick win con impacto fuerte en TTI.
- **Añadir `<ErrorBoundary>`** envolviendo `<AppShell>` y otro alrededor de `<Outlet/>` por feature; mostrar fallback con "Recargar" + reportar.
- **Skeletons consistentes**: no existe primitivo `Skeleton` (no aparece en `components/ui/`). Hoy `plan-actividades-page.tsx:148-154` usa `<Loader2/>` + texto. Crear `components/ui/skeleton.tsx` shadcn y reemplazar.
- **Query keys tipados**: hoy son arrays ad-hoc (`["/empresas", id]`, `["/respuestas-formulario", id]`). Centralizar en `lib/query-keys.ts` con factory functions para evitar invalidaciones desincronizadas (ej. `empresa-detail-page.tsx:43,55` y `empresas-list-page.tsx:59` mezclan strings).
- **Configurar ESLint** (`eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `@typescript-eslint`) + Prettier. Bloquea problemas como deps faltantes en `useEffect` (varios `plan-actividades-page.tsx:87` solo dependen de `data, error` pero setean state derivado — patrón anti-React; preferir `useMemo` o transformar dentro de `select` de React Query).
- **Romper páginas mega**: `dashboard-page.tsx` 727 LOC, `informe-final-pm-page.tsx` 651, `respuesta-llenar-page.tsx` 482. Extraer secciones a componentes co-localizados (`./components/...`).
- **`auth-store` en localStorage**: `persist` (`auth-store.ts:38-44`) guarda `accessToken+refreshToken` en localStorage → XSS = robo de sesión. Mínimo: persistir solo `refreshToken` + `usuario`; recuperar access en arranque vía `/auth/refresh`.
- **`window.location.href` en `api.ts:61`** rompe SPA. Usar evento/store flag y `<Navigate/>` desde router para mantener estado y evitar full reload.
- **Sidebar puro**: extraer `MAIN_ITEMS`/`GROUPS` a `lib/nav-config.ts` (sidebar.tsx tiene 242 LOC con datos + render mezclados). Facilita test y agregar i18n luego.
- **`useAuthStore.getState()` en `api.ts:14,28`** funciona pero no reactivo; OK aquí, dejar comentario explicando por qué (interceptor fuera de React).

## Quick wins (<2h)

- Añadir `<ErrorBoundary>` (clase simple o `react-error-boundary`) en `App.tsx`.
- Crear `eslint.config.js` con presets oficiales de Vite + `react-hooks/exhaustive-deps`.
- Lazy + `Suspense` en rutas de catálogos/admin/trimestres (las menos visitadas).
- Sustituir `Loader2` ad-hoc por `Skeleton` shadcn en listas (empresas, vacantes, estudiantes).
- `meta name="description"` + favicon real en `index.html:5` (hoy `vite.svg`).

## Accesibilidad

- **Bien**: `aria-label` consistente en botones de acción (`size="icon"`) — 59 ocurrencias; `alt` descriptivo en imagen institucional (`login-page.tsx:161`); `aria-hidden` en decoraciones (mesh blobs, separadores).
- **Mejorar**: input checkbox nativo en `plan-actividades-page.tsx:280` sin `<label htmlFor>` asociado por id (el `<label>` envolvente funciona pero no escala). Usar `Checkbox` de shadcn (falta agregarlo a `components/ui/`).
- **Tabs en formularios largos**: `respuesta-llenar-page.tsx` (482 LOC) merece `<Tabs>` o landmarks para navegación con teclado por secciones.
- **Contraste**: revisar `text-muted-foreground/70` en footer (`login-page.tsx:331`) — probable falla WCAG AA en modo claro.
- **Focus visible**: shadcn lo trae por defecto; validar que `ring-offset` se respeta sobre fondos translúcidos (`bg-card/70 backdrop-blur`).

## Veredicto: **8.0 / 10**

Frontend sólido y maduro para alcance académico: TS estricto sin trampas, arquitectura feature-first limpia y capa HTTP profesional con refresh single-flight. Pierde puntos por **ausencia de ErrorBoundary, ESLint sin config y bundle sin splitting** — los tres son fixes de 1–2h que lo subirían a 9.
