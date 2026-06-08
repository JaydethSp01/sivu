# Auditoría UI/UX — SIVU (post-rebranding Uniempresarial)

> Senior UI/UX review · stack React + shadcn/ui + Tailwind · paleta institucional `#1B3380` / `#E2173A`.
> Alcance: `frontend/src/` (layout, login, dashboard, listas, formularios, sistema de tokens).

---

## Brand consistency

- Tokens HSL bien estructurados en `src/index.css:6-63` (primary/secondary/accent/coral + `*-soft` + dark mode espejado). Tailwind los expone como utilidades semánticas en `tailwind.config.ts:28-80`. Base sólida.
- Identidad reforzada por `bg-uni-gradient`, `.uni-accent` (subrayado primary→secondary) y `UniempresarialLogo` con halo gradient (`uniempresarial-logo.tsx:31-46`) — coherentes y reutilizadas en `PageHeader`, `EmptyState`, `Topbar` avatar.
- Tipografía institucional aplicada: Oswald (display) + Inter (UI) — cargada en `index.html:11-13`, asignada a `h1-h3` y `font-display`. Buena jerarquía editorial.
- **Inconsistencia secundary**: en `components/ui/button.tsx:27` el variant `secondary` usa `bg-secondary-soft` (rosado pálido) en lugar del rojo institucional, contradiciendo la convención del token. El botón "Enviar a Coformación" (`mi-hoja-vida-page.tsx:920`) queda pastel, no rojo UE.

## Fortalezas de UX

- Etiquetas dinámicas por rol en sidebar (`sidebar.tsx:44-90`): "Mis vacantes" / "Mis practicantes" / "Mi práctica" vs. "Prácticas". Excelente uso de copy contextual.
- `PageHeader` consistente con icono, descripción, acentos y CTAs (`page-header.tsx`). Mantiene jerarquía en toda la app.
- `StatusBadge` centralizado con mapa por dominio y dot de color (`status-badge.tsx`). Evita inventar estados ad-hoc por página.
- `EmptyState` reutilizable con copy humano y CTA opcional ("Sube tu primer documento", `documentos-list-page.tsx:295-300`).
- Microcopy del Dashboard estudiante muy bien orientado al usuario final ("Postúlate con un clic", `dashboard-page.tsx:524`).

## Hallazgos críticos UX

- **Sidebar sobrecargado**: hasta ~22 ítems planos para ADMIN/COORDINADOR (`sidebar.tsx:92-116`) bajo un único grupo "Menú principal". Sin agrupar por dominio (Procesos / Catálogos / Administración / IA) la cognición es alta y se mezclan "Recomendar candidatos", "Programa interno", "Solicitudes programa interno", "Plantillas" sin jerarquía visual.
- **Hoja de Vida sin `PageHeader`**: `mi-hoja-vida-page.tsx:852-867` arma su propio header plano (h1+icon), rompiendo el sistema usado en el resto de la app. Además expone barra superior con 4-6 botones simultáneos (Descargar, Guardar, Enviar, Aprobar, Rechazar) sin agrupación — riesgo de error.
- **Campo "Orden" expuesto al estudiante** (`mi-hoja-vida-page.tsx:415-422`, 535-541, 668-674): tecnicismo de backend filtrado a la UI; el estudiante no debería ver/editar orden manualmente. Debe ocultarse o sustituirse por drag-handle.

## Mejoras recomendadas (impacto ↓)

1. **Agrupar sidebar** en 3-4 secciones colapsables: *Mi trabajo* (dashboard, postulaciones, mi HV), *Operación* (estudiantes, empresas, vacantes, convenios), *Inteligencia* (matching, programa interno), *Administración* (usuarios, plantillas, catálogos). `sidebar.tsx:92-128`.
2. **Corregir variant `secondary` del Button** a `bg-secondary text-secondary-foreground hover:bg-secondary/90` (rojo UE real) y crear nuevo `subtle` o `muted` para el caso suave actual. `button.tsx:27`.
3. **Eliminar campo `orden` del UI del estudiante** y usar drag-and-drop con `@dnd-kit` (ya recomendado) o quitar el control y dejar orden por timestamp. `mi-hoja-vida-page.tsx:415-422`.
4. **Refactor barra de acciones de HV** a un único botón primario `Guardar` + dropdown "Más acciones" (Descargar PDF, Enviar a Coformación, etc.), separando flujo COORDINADOR (Aprobar/Rechazar) en un panel propio. `mi-hoja-vida-page.tsx:871-966`.
5. **Migrar `mi-hoja-vida-page.tsx` a `PageHeader`** para mantener brand consistency y subrayado `.uni-accent`.
6. **Saltos de página**: títulos h2 en tabs y secciones siguen genéricos (`text-2xl font-bold`); homogenizar con `font-display tracking-tight` aplicado por defecto vía `h1-h3` ya configurado — verificar que no se sobrescriba.
7. **Falta `Skeleton`**: estados loading usan `Loader2` centrado (`data-table.tsx:41-48`, `documentos-list-page.tsx:285-289`). Añadir `components/ui/skeleton.tsx` (shadcn) y skeletons en KPIs, tablas, grids para evitar saltos de layout.
8. **Estados vacíos genéricos en DataTable**: copy reusado "Sin resultados / No hay datos…" (`data-table.tsx:36-37`). Pasar siempre `emptyTitle/emptyDescription` específicos por contexto e incluir CTA (ej. "Crear primer estudiante").
9. **Select fallback de estados** muestra `RECHAZADO/VALIDADO` en mayúsculas (`documentos-list-page.tsx:216`). Usar el mismo mapa que `StatusBadge` para no exponer enums.
10. **Coral CTA infrautilizado**: el token `--coral` está definido pero no aparece como variant; o eliminarlo, o aprovecharlo como acento para CTAs estudiantiles ("Postularme"). Decidir y limpiar.
11. **Topbar carece de breadcrumbs** y buscador global; con 22+ rutas el usuario se pierde. Añadir breadcrumbs derivados de `react-router` y `Cmd+K` (`cmdk` ya está en `components/ui/command.tsx`).
12. **Login: emojis de roles** (`login-page.tsx:41-45`) restan formalidad institucional; sustituir por iconos `lucide` (Shield/GraduationCap/User/Building2) coloreados con tokens primary/accent.

## Quick wins visuales (<1h)

- Cambiar `bg-emerald-500` hardcoded por `bg-success` en alerts de HV (`mi-hoja-vida-page.tsx:988-993`).
- Añadir `Skeleton` en KPIs del dashboard cuando `query.isLoading` (hoy muestran "—" estático).
- Quitar emojis del demo creds en login y reemplazar por puntos de color por rol.
- Reducir items del sidebar a labels de 2 palabras max ("Solicitudes programa interno" → "Solicitudes PI" o moverlo a submenu).
- Aplicar `.uni-accent` al título del `dashboard-page.tsx` Kpi-section para reforzar branding.

## Responsive

- App-shell correcto: sidebar fijo en `lg`, drawer Sheet en `<lg` (`app-shell.tsx:20-32`). Padding adaptativo `p-4 sm:p-6 lg:p-8`.
- Login: hero asimétrico oculta el panel izquierdo en `<lg` (`login-page.tsx:123`); en móvil queda solo el card — bien.
- **Riesgo**: barra de acciones de Hoja de Vida con 5-6 botones (`mi-hoja-vida-page.tsx:871`) hace wrap feo en móvil; necesita colapsar a menú.
- Tabla `DataTable` no es horizontal-scroll en móvil (`data-table.tsx:54`); columnas como "Estudiantes" (6 cols) se desbordan. Añadir `overflow-x-auto`.
- Topbar pierde el bloque nombre+rol en `<lg` (`topbar.tsx:67`) — correcto.

## Veredicto: **8.0 / 10**

Base de diseño sólida y consistente con paleta institucional bien tokenizada; el rebranding está bien ejecutado en componentes core (PageHeader, EmptyState, KPIs, login). Pierde puntos por sobrecarga del sidebar, inconsistencia del variant `secondary` y pantalla `Mi Hoja de Vida` que se sale del sistema. Resolviendo los 5 hallazgos top sube fácil a 9+.
