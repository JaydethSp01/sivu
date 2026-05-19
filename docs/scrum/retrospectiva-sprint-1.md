# Retrospectiva — Sprint 1

| Campo | Valor |
|---|---|
| Sprint | 1 |
| Fechas | 2026-05-04 → 2026-05-17 |
| Sesión de retro | Viernes 2026-05-15, 17:00 — 18:15 |
| Facilitador | Jaydeth Sandoval (Scrum Master) |
| Asistentes | 12 de 14 (faltaron Sofía Hernández y Luis Alejandro Torres por agenda académica) |
| Formato | **Start / Stop / Continue** + voto con dots para action items |

---

## Resultado del sprint en una frase

> **Cumplimos el sprint goal: hay autenticación, CRUDs base, Swagger y CI verde**, pero arrastramos la US-008 (postulaciones) al Sprint 2 por falta de cobertura de reglas de negocio sobre vacante activa.

- Comprometido: **51 SP**
- Entregado (DoD cumplida): **49 SP**
- Carry over: **2 SP** (US-008)
- Cobertura JaCoCo global: **72.4 %**
- Pipeline CI: verde en `main` desde el día 5

---

## START — empezar a hacer

| Acción | Propuesto por | Votos |
|---|---|---|
| Hacer **pair programming** obligatorio en las historias que tocan seguridad (Spring Security / JWT). | Andrés Ríos | 7 |
| Definir y publicar una **plantilla de PR** con checklist de DoD para evitar revisiones incompletas. | Laura Pinzón | 9 |
| Tener un **canal `#daily-blockers` en Slack** para reportar bloqueantes fuera del daily presencial. | Sebastián Quintero | 6 |
| **Refinar historias de automatización** (US-011 a US-014) en una sesión específica antes del kickoff del Sprint 2. | Kellyn Delgado (PO) | 11 |
| Crear un **mini-glosario del dominio** (estado de postulación, tipos de documento, roles) para que frontend y backend hablen el mismo idioma. | María Fernanda López | 8 |

---

## STOP — dejar de hacer

| Acción | Propuesto por | Votos |
|---|---|---|
| **Estimar sin entender la regla de negocio.** US-008 se estimó en 5 cuando la regla de "vacante activa con cupo" valía sola un punto adicional. | Juan Pablo Caicedo | 10 |
| Empezar la implementación de un endpoint **sin antes definir su contrato** en Postman/Swagger. Generó dos retrabajos en CRUDs. | Laura Pinzón | 7 |
| Mergear PRs los viernes después de las 17:00. Quedaron dos PRs sin revisión real. | Sebastián Quintero | 6 |
| Hacer dailies de 25 min con discusiones técnicas. **Caja de tiempo: 15 min máximo**, lo demás a side-chat. | Jaydeth Sandoval (SM) | 9 |

---

## CONTINUE — mantener

| Acción | Propuesto por | Votos |
|---|---|---|
| Subir Swagger desde el día 1: aceleró la integración frontend↔backend. | María Fernanda López | 11 |
| Tener `docker-compose.dev.yml` separado para correr sólo Mongo + Postgres + MailHog. Hizo que el setup local fuera trivial. | Camilo Restrepo | 8 |
| Refinement los miércoles a las 16:00 en lugar de "cuando se pueda". Llegamos al planning con historias listas. | Kellyn Delgado | 10 |
| Demos cortas internas los martes y jueves de 10 min. La PO detectó dudas antes del review. | Jaydeth Sandoval | 9 |
| Cobertura ≥ 70 % bloqueante en build local. Forzó el TDD desde el día 2. | Andrés Ríos | 7 |

---

## Problemas concretos discutidos

### 1. Primera vez con MongoDB en el equipo

- **Síntoma:** dos días para tener `users` funcionando con índices y `unique` en email.
- **Causa raíz:** nadie en el equipo había hecho un setup `spring-data-mongodb` con seeding antes.
- **Acción correctiva:** publicar `docs/arquitectura/mongo-setup.md` (Sebastián) y un seeder declarativo para usuarios demo.

### 2. MapStruct generaba mappers vacíos al cambiar paquetes

- **Síntoma:** tras refactor de carpetas, el `mvn clean install` generaba mappers sin métodos.
- **Causa raíz:** plugin de Lombok declarado después de MapStruct en `pom.xml`.
- **Acción correctiva:** orden corregido en `pom.xml`; documentado en ADR `docs/arquitectura/adr/0003-mapstruct-lombok.md`.

### 3. CI lento por instalar Newman en cada job

- **Síntoma:** stage `api-tests` tardaba 3 min sólo en instalar dependencias.
- **Causa raíz:** sin cache de `~/.npm` ni runner pre-cocido.
- **Acción correctiva:** activar `actions/cache` para `~/.npm` y `~/.m2/repository`. Ya bajó a 1 min 10 s.

### 4. Estimación inflada en una historia y deflactada en otra

- **Síntoma:** US-009 (Documentos) se estimó en 3 y costó 5; US-006 (Empresas) se estimó en 5 y costó 2.
- **Causa raíz:** no hubo "story splitting" previo ni referencia a tickets análogos.
- **Acción correctiva:** llevar al refinement una **biblioteca de referencias** (`SP 3 = CRUD simple sin reglas`, `SP 5 = CRUD con 1–2 reglas`, etc.).

---

## Métricas

| Métrica | Valor |
|---|---|
| Velocidad real | 49 SP |
| Compromiso vs entrega | 96 % (49/51) |
| PRs mergeados | 28 |
| PRs revertidos | 0 |
| Tiempo medio PR → merge | 4 h |
| Cobertura JaCoCo final | 72.4 % |
| Issues SonarCloud nuevos (MAJOR+) | 0 |
| Quality Gate en `main` | Pasa |
| Builds CI en el sprint | 71 (68 verdes / 3 rojos por flakiness corregido) |

---

## Action items con dueño y fecha

| # | Acción | Responsable | Fecha límite | Estado |
|---|---|---|---|---|
| 1 | Crear plantilla `.github/pull_request_template.md` con checklist DoD | Laura Pinzón | 2026-05-19 | Open |
| 2 | Sesión de refinement de US-011 → US-014 | Kellyn Delgado | 2026-05-18 | Open |
| 3 | Publicar `docs/arquitectura/mongo-setup.md` y ADR MapStruct/Lombok | Sebastián Quintero | 2026-05-20 | Open |
| 4 | Subir glosario de dominio a `docs/arquitectura/glosario.md` | María Fernanda López | 2026-05-19 | Open |
| 5 | Activar cache `actions/cache` para `.m2` y `.npm` en `ci.yml` | Sebastián Quintero | 2026-05-18 | Done (entregado mismo día) |
| 6 | Biblioteca de referencias de estimación | Jaydeth Sandoval | 2026-05-20 | Open |
| 7 | Crear canal `#sivu-daily-blockers` | Jaydeth Sandoval | 2026-05-17 | Done |

---

## Sentimiento del equipo (escala 1–5)

| Categoría | Promedio |
|---|---|
| Claridad del sprint goal | 4.5 |
| Apoyo del equipo | 4.7 |
| Carga de trabajo | 3.4 (un poco alta) |
| Calidad del incremento | 4.2 |
| Comunicación con la PO | 4.6 |
| Salud del repo / CI | 4.0 |

> Conclusión del SM: **moral alta**, foco principal del Sprint 2 = reducir percepción de sobrecarga partiendo mejor las historias y manteniendo la disciplina de refinement.

---

## Próximo paso

- **Lunes 2026-05-18, 8:00 — Sprint Planning del Sprint 2.**
- Backlog candidato y objetivo: ver [`sprint-2-backlog.md`](./sprint-2-backlog.md).
