# Definition of Done (DoD) — SIVU

Define el **estándar mínimo de calidad** que debe cumplir cualquier incremento del producto SIVU para considerarse `Done`. Aplica a tres niveles: historia, sprint y release.

> Una historia o un sprint que no cumple la DoD **no se considera completado** y no se contabiliza para la velocidad del sprint.

---

## DoD a nivel de historia de usuario

Toda historia marcada como `Done` cumple **todos** los siguientes puntos:

### Código

- [ ] La implementación cubre **todos** los criterios de aceptación definidos en la historia.
- [ ] El código sigue la guía de estilo del equipo (formatter Spring/Java + ESLint+Prettier para TS).
- [ ] Sin TODOs, código comentado ni `System.out.println` / `console.log` de depuración.
- [ ] DTOs validados con `jakarta.validation` (backend) y `zod` (frontend).
- [ ] Manejo de errores explícito: excepciones de dominio → `@ControllerAdvice` → respuesta REST consistente.

### Revisión

- [ ] Pull Request abierto con descripción que enlaza al issue de la historia (`Closes #US-XXX`).
- [ ] Al menos **1 reviewer** del equipo aprobó (`approved`).
- [ ] Comentarios de revisión resueltos o explicitados.
- [ ] No quedan conflictos con `main`.

### Pruebas

- [ ] Tests unitarios para cada rama lógica nueva (JUnit 5 + Mockito).
- [ ] Cobertura JaCoCo del **módulo modificado ≥ 70 %**.
- [ ] Si la historia añade endpoint público: caso cubierto en la colección Postman (Newman).
- [ ] Si la historia tiene impacto en UI: caso cubierto por al menos un test Cypress.
- [ ] Si la historia tiene impacto en rendimiento: script k6 actualizado o creado.

### Calidad estática

- [ ] **SonarCloud Quality Gate** verde en el PR.
  - Cobertura nuevo código ≥ 70 %.
  - 0 vulnerabilidades, 0 bugs `BLOCKER`/`CRITICAL`.
  - Duplicación nuevo código ≤ 3 %.
- [ ] Sin nuevos issues `MAJOR` introducidos por el PR (si los hay, justificados en el PR).

### Documentación

- [ ] **Swagger / OpenAPI** actualizado: anotaciones `@Operation`, `@ApiResponse`, `@Schema`.
- [ ] README actualizado si la historia añade variables de entorno, comandos o servicios.
- [ ] Trazabilidad actualizada en [`trazabilidad.md`](./trazabilidad.md) (requerimiento → endpoint → test → stage).
- [ ] Si introduce decisión arquitectónica, ADR creado en `docs/arquitectura/adr/`.

### Integración

- [ ] Branch `feat/US-XXX-...` mergeado a `main` por merge commit (sin rebase forzado en `main`).
- [ ] Pipeline `ci.yml` **verde end-to-end** sobre el commit fusionado.
- [ ] El issue de GitHub Projects pasa a la columna `Done`.

### Aceptación

- [ ] **Demo aprobada por la Product Owner** (Kellyn) en la review del sprint o en una demo intermedia agendada.
- [ ] Aceptación documentada como comentario en el issue (`/accept` o "aceptada por PO").

---

## DoD a nivel de sprint

Un sprint se considera completado cuando:

- [ ] Todas las historias seleccionadas en el Sprint Backlog cumplen su DoD individual **o** han sido movidas explícitamente al siguiente sprint con justificación documentada.
- [ ] El **objetivo del sprint** (sprint goal) se demuestra en la review.
- [ ] Pipeline CI verde sobre el commit del último merge a `main` del sprint.
- [ ] Cobertura global del proyecto ≥ 70 %.
- [ ] Sin **vulnerabilidades altas** abiertas en SonarCloud.
- [ ] Retrospectiva realizada y action items registrados ([`retrospectiva-sprint-1.md`](./retrospectiva-sprint-1.md) y posteriores).
- [ ] Documentación Scrum actualizada: Sprint Backlog cerrado, burndown final, retro publicada.
- [ ] Tablero GitHub Projects refleja el estado real (no hay tarjetas `In Progress` huérfanas).

---

## DoD a nivel de release (v1.0.0)

La release `v1.0.0` se considera lista para entrega académica cuando:

- [ ] Todas las historias `Must` del Product Backlog están `Done`.
- [ ] Pipeline `cd.yml` ejecutado al menos una vez con éxito (build → push GHCR → deploy demo → smoke test).
- [ ] `docker compose up` desde un clon limpio levanta todo el sistema sin pasos manuales adicionales (salvo `cp .env.example .env`).
- [ ] Suite **Newman** verde en `main`.
- [ ] Suite **Cypress** verde en `main`.
- [ ] **k6** sin umbrales rotos en el último run.
- [ ] **SonarCloud Quality Gate** verde en `main`.
- [ ] Documentación completa:
  - [ ] README raíz.
  - [ ] `docs/arquitectura/` con diagramas C4 y ADRs.
  - [ ] `docs/scrum/` con todos los artefactos enumerados en su README.
  - [ ] `docs/diagramas/` con BPMN AS-IS y TO-BE.
- [ ] Tag git `v1.0.0` creado y release publicada en GitHub.
- [ ] Aceptación final firmada por la PO en la review del Sprint 2.

---

## Excepciones y manejo

Si una historia **no** cumple la DoD pero la PO decide igualmente aceptarla:

1. La PO debe documentar la excepción en el comentario del issue (`Excepción DoD: ...`).
2. Se crea un **issue técnico** de seguimiento etiquetado `tech-debt` con la deuda introducida.
3. El issue de deuda entra al backlog y se prioriza en el siguiente refinement.

Sin estos tres pasos, la historia **no** puede marcarse como `Done`.
