# Documentación Scrum — SIVU

Carpeta que consolida los artefactos Scrum del proyecto **SIVU — Sistema de Vinculación Universitaria**, entregable de la asignatura **Despliegue Continuo** de la Universidad Empresarial.

Esta documentación cubre los **artefactos mínimos** exigidos por el enunciado del proyecto final: Product Backlog, Sprint Backlog (2 sprints), historias de usuario, criterios de aceptación, Definition of Done, tablero de gestión y la matriz de trazabilidad requerimiento → desarrollo → pruebas → despliegue.

---

## Equipo Scrum

| Rol | Persona |
|---|---|
| Product Owner | Kellyn Johanna Delgado Jaimes |
| Scrum Master | Jaydeth Sandoval |
| Backend Lead (Spring Boot) | Andrés Ríos |
| Frontend Lead (React) | María Fernanda López |
| QA / Automatización | Laura Camila Pinzón |
| DevOps / CI-CD | Sebastián Quintero |
| IA / MCP | Daniela Mejía |
| Desarrolladores backend | Juan Pablo Caicedo, Sergio Vargas |
| Desarrolladores frontend | Valentina Suárez, Camilo Restrepo |
| Diseño UX | Sofía Hernández |
| Documentación / SM apoyo | Luis Alejandro Torres |
| Stakeholder docente | Coordinación de Despliegue Continuo |

Equipo de 14 personas distribuidas en 5 frentes (BE, FE, QA, DevOps, IA).

---

## Marco de trabajo

- **Framework:** Scrum, sprints de **2 semanas**.
- **Ceremonias:** planning (lunes 8:00), daily (lunes a viernes 8:00, 15 min), review (viernes último día 16:00), retro (viernes último día 17:00), refinement (miércoles intermedio 16:00).
- **Capacity por sprint:** ~80 horas/dev efectivas → ~28 story points planificables por sprint (velocidad inicial estimada).
- **Estimación:** Planning Poker, escala Fibonacci (1, 2, 3, 5, 8, 13).
- **Priorización backlog:** MoSCoW + valor de negocio declarado por la PO.

---

## Calendario de sprints

| Sprint | Fechas | Objetivo |
|---|---|---|
| Sprint 1 | 2026-05-04 → 2026-05-17 | Autenticación funcional, CRUDs base con Swagger, tests unitarios y pipeline CI configurado. |
| Sprint 2 | 2026-05-18 → 2026-05-31 | Automatizaciones (validación documental, matching, formalización, notificaciones), MCP integrado, suite E2E/k6/Sonar y pipeline CI/CD desplegando en local con docker-compose. |

> A la fecha de redacción de este documento (**2026-05-17**) el Sprint 1 está en su último día y el Sprint 2 inicia el lunes 2026-05-18.

---

## Tablero de gestión

Tablero en **GitHub Projects (Beta)**:

> https://github.com/orgs/uempresarial/projects/SIVU

Columnas estándar: `Backlog` → `Ready` → `In Progress` → `In Review` → `QA` → `Done`.

Cada item del Product Backlog tiene un issue en GitHub con etiqueta de épica (`epic:auth`, `epic:crud`, `epic:automatizacion`, `epic:mcp`, `epic:calidad`, `epic:devops`) y se enlaza al PR que lo implementa para mantener trazabilidad nativa.

---

## Índice de artefactos

| Archivo | Descripción |
|---|---|
| [`product-backlog.md`](./product-backlog.md) | Backlog priorizado con MoSCoW, épicas, story points y valor. |
| [`sprint-1-backlog.md`](./sprint-1-backlog.md) | Sprint Backlog del Sprint 1 con asignaciones, estados y burndown. |
| [`sprint-2-backlog.md`](./sprint-2-backlog.md) | Sprint Backlog del Sprint 2 con asignaciones, estados y burndown proyectado. |
| [`historias-usuario.md`](./historias-usuario.md) | Historias de usuario completas con criterios Gherkin. |
| [`criterios-aceptacion.md`](./criterios-aceptacion.md) | Consolidado de criterios de aceptación en formato checklist. |
| [`definition-of-done.md`](./definition-of-done.md) | DoD a nivel historia, sprint y release. |
| [`trazabilidad.md`](./trazabilidad.md) | Matriz requerimiento → componente → endpoint → test → stage de pipeline. |
| [`retrospectiva-sprint-1.md`](./retrospectiva-sprint-1.md) | Retrospectiva del Sprint 1 (Start / Stop / Continue). |

---

## Convenciones

- IDs de historias: `US-001` … `US-NNN`.
- IDs de épicas: `EP-01` … `EP-NN`.
- IDs de tareas técnicas dentro de una historia: `US-XXX.T1`, `US-XXX.T2`.
- Branch por historia: `feat/US-XXX-slug` o `fix/US-XXX-slug`.
- Mensajes de commit: Conventional Commits (`feat(scope): ...`, `fix(scope): ...`, `test(scope): ...`).

---

## Cómo leer esta documentación

1. Empezar por el **Product Backlog** para entender alcance global.
2. Revisar los **Sprint Backlogs** (1 y 2) para ver qué se ejecutó y qué se está ejecutando.
3. Profundizar en una historia concreta en **historias de usuario** y validar sus **criterios de aceptación**.
4. Verificar la **trazabilidad** para ver cómo cada historia se conecta con endpoints, tests y pipeline.
5. Consultar la **Definition of Done** para entender el nivel de calidad exigido a cada incremento.

---

## Referencias del proyecto

- Análisis AS-IS / TO-BE del proceso de vinculación: `/home/jaydethsp/proyecto_kelly_doc/Análisis proceso de vinculación.docx`
- Diagramas BPMN: `/home/jaydethsp/proyecto_kelly_doc/Jaydeth trabajo }.bpm` (AS-IS) y `to be jaydeth (2).bpm` (TO-BE)
- README técnico del repo: [`../../README.md`](../../README.md)
- Documentación arquitectónica: [`../arquitectura/`](../arquitectura/)
