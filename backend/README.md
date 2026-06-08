# Backend SIVU — Spring Boot 3 · Java 21

API REST que implementa **todo el proceso de Coformación**. Aquí se explica **cómo se cumple el
flujo paso a paso** (qué archivo hace cada cosa), la estructura, las migraciones y cómo correrlo.

---

## Organización: package-by-feature

Bajo `src/main/java/co/uempresarial/sivu/` cada **feature** es una carpeta autocontenida con sus
propias capas. No hay un `service/` global ni un `controller/` global: todo lo de "convenios" vive
en `convenio/`, todo lo de "hoja de vida" en `hojavida/`, etc.

```
<feature>/
├── domain/          Entidades JPA + enums + reglas
├── persistence/     Repositorios (Spring Data JPA)
├── service/         Lógica de negocio (@Transactional)
├── web/             Controllers REST + dto/ (records)
└── pdf/             (si aplica) generador del formato oficial OpenPDF
```

Ventaja: para entender una funcionalidad abres **una** carpeta y está todo junto.

---

## Cómo se cumple el flujo (paso → archivo)

Cada etapa del proceso, con el endpoint y el archivo que la implementa:

### 1. Hoja de Vida → `hojavida/`
- **Guardar HV**: `PUT /hoja-vida/{estId}` → `HojaVidaController.guardar` → `HojaVidaService.guardar`
  (reemplaza sub-listas: habilidades, idiomas, educación, experiencias).
- **Enviar a Coformación**: `POST /hoja-vida/{estId}/enviar-a-coformacion` → estado `ENVIADA`.
- **Aprobar / Rechazar (con feedback)**: `POST /hoja-vida/{hvId}/{aprobar|rechazar}`. El rechazo
  guarda observaciones y registra un mensaje en el **hilo conversacional** (`HojaVidaComentario`).
- **Hilo de feedback**: `GET/POST /hoja-vida/{hvId}/comentarios` → `HojaVidaComentario*`.
- **PDF**: `GET /hoja-vida/{estId}/pdf` → `HojaVidaService.generarPdf` → `HojaVidaPdfGenerator`.
- Estado: `BORRADOR → ENVIADA → APROBADA / RECHAZADA`.

### 2. Postulación → `postulacion/`
- **Crear**: `POST /postulaciones` → `PostulacionService.crear`.
- **Cambiar estado**: `PATCH /postulaciones/{id}/estado`. Las transiciones válidas están en
  `PostulacionService.TRANSICIONES` (mapa enum): `POSTULADA → EN_REVISION → PRESELECCIONADA → ACEPTADA`.
- Cada cambio deja un `PostulacionEvento` (línea de tiempo). Al `ACEPTADA` se **auto-genera la carta**.

### 3. Entrevista → `entrevista/`
- **Programar**: `POST /entrevistas` → `EntrevistaService` mueve la postulación a
  `ENTREVISTA_PROGRAMADA` (solo permitido desde `EN_REVISION`/`POSTULADA`).
- **Resultado**: `PATCH /entrevistas/{id}/resultado`. Si `APROBADA` → postulación `PRESELECCIONADA`.

### 4. Carta de presentación → `cartapresentacion/`
- Se genera sola al aceptar la postulación, o `POST /postulaciones/{id}/carta-presentacion`.

### 5. Convenio → `convenio/`
- **Crear**: `POST /convenios` (desde la postulación aceptada).
- **Asignar tutores**: `PATCH /convenios/{id}/tutores` (académico + empresarial).
- **Firmar (3 partes)**: `PATCH /convenios/{id}/firmar/{ESTUDIANTE|EMPRESA|UNIVERSIDAD}` →
  al completar las 3, el convenio pasa a `ACTIVO`.
- **PDF**: `GET /convenios/{id}/pdf` → `ConvenioPdfGenerator` (cláusulas + firmas con sello de tiempo).
- **Finalizar**: `PATCH /convenios/{id}/finalizar` con la nota.

### 6. Fase activa (por trimestre) → `trimestre/`
Es el núcleo más grande. Un trimestre agrupa:
- **Plan de Actividades (GAC-FM-10)**: `PUT /trimestres/{id}/plan-actividades` + firmar →
  `PlanActividadesService` + `PlanActividadesPdfGenerator`.
- **Actas (GAC-FM-11)**: `POST /trimestres/{id}/actas` (3: INICIAL/SEGUIMIENTO/EVALUACIÓN) + firmar →
  `ActaReunionService` + `ActaReunionPdfGenerator`.
- **Evaluación del Tutor (GAC-FM-007)**: `PUT /trimestres/{id}/evaluacion-tutor` + firmar.
  Nota ponderada automática (Capacidades 40% / Actitudes 40% / Aplicación 20%) + campo
  **continuidad con la empresa**. `EvaluacionTutorTrimestreService` + su PDF.
- **Evaluación del Profesor (GAC-FM-1, 2 cortes)**: `PUT /trimestres/{id}/evaluacion-profesor` →
  dos cortes con nota ponderada por corte. `EvaluacionProfesorTrimestreService` + su PDF.

### 7. Informe Final → `informefinalpm/`
- **Plan de Mejora**: `POST /trimestres/{id}/planes-mejora`.
- **Informe (GTC-FM-16)**: `PUT /planes-mejora/{id}/informe-final` (12 secciones + carátula + nivel).
- **Entregar / Aprobar**: `POST /informes-final-pm/{id}/{entregar|aprobar}` (valida ≤15 págs y nota ≥3.0).
- **PDF**: `GET /informes-final-pm/{id}/pdf` → `InformeFinalPmPdfGenerator` (con carátula).
- **Feedback IA**: ver feature `ia/`.

### 8. Programa interno (plan B) → `solicitudfabrica/`
- **Solicitar** (estudiante): `POST /solicitudes-fabrica`.
- **Aprobar / Rechazar** (Coformación): `POST /solicitudes-fabrica/{id}/{aprobar|rechazar}`.
- **Asignar proyecto**: `POST /solicitudes-fabrica/{id}/asignar-proyecto` → elige una vacante
  interna, crea la postulación y pasa la solicitud a `ASIGNADA`.

### Transversales
- **`analytics/`** — `GET /analytics/{resumen|embudo-postulaciones|empleabilidad|estudiantes-en-riesgo}`.
- **`ia/`** — `POST /ia/informe-final/{id}/feedback`: llama al **IA sidecar** (plan Claude Code);
  si no está, usa el **revisor heurístico local** (`InformeIAService`).
- **`documento/`** — subida + validación + **vigencia** (`EstadoVigencia`: ACTIVO/POR_VENCER/VENCIDO).
- **`automatizacion/`** — `MatchingService`, `AlertaPlazosService` (job diario), `NotificacionService`,
  `CertificadoService`.
- **`plantilla/`** — formularios configurables por el admin + respuestas dinámicas.
- **`security/`** — `JwtService` (HS512), `SecurityConfig`, `Usuario` (Mongo), `UsuarioRepository`.
- **`admin/`** — `SeedService` (datos demo) + `SeedBootstrap` (los siembra al arrancar en dev/docker).

---

## Migraciones (Flyway) — `src/main/resources/db/migration/`

Versionadas `V1..V21`. Corren **solas al arrancar**. **Regla de oro: nunca edites una migración ya
aplicada; crea una nueva `V22__...`.** Hitos:

| Versión | Qué agrega |
|---|---|
| V1–V9 | Esquema base, tutores, modalidades, hoja de vida, cohortes, trimestres/planes/actas/evaluaciones, flujo completo |
| V10–V15 | Solicitud fábrica, evaluación profesor 2 cortes, plantillas, respuestas, tipos de campo, sello de tiempo de firmas |
| V16–V21 | Asignación de proyecto interno, hilo de comentarios HV, carátula/nivel del informe, vigencia de documentos, estado `ASIGNADA`, ancho de `postulaciones.estado` |

---

## Seguridad

- JWT HS512; el `JWT_SECRET` debe tener **≥ 64 caracteres**.
- Endpoints protegidos con `@PreAuthorize("hasAnyRole(...)")`.
- Auto-scope por rol vía `CurrentUserService` (un EMPRESA solo ve lo suyo, etc.).
- `Usuario` vive en **Mongo**; el resto del dominio en **Postgres**.

---

## Convenciones importantes

- **PDFs siempre dentro de transacción**: `open-in-view` está en `false`, así que el generador no
  puede cargar colecciones lazy desde el controller. Patrón: el service expone
  `@Transactional(readOnly=true) byte[] generarPdf(id)` que **genera dentro de la tx**; el controller
  llama `service.generarPdf(id)`.
- **DTOs** son `record` y la validación va con `@Valid` + Bean Validation.
- **Errores de negocio** → `BusinessException` (→ 422), no encontrados → `ResourceNotFoundException` (→ 404),
  centralizados en `shared/exception/GlobalExceptionHandler`.
- Para evitar `MultipleBagFetchException`: no metas dos `List` en el mismo `@EntityGraph`; confía en
  `default_batch_fetch_size` (configurado global).

---

## Correr y probar

```bash
# Dependencias (postgres/mongo/mailhog) desde la raíz: make dev-deps

# Arrancar (8081 para evitar choque con 8080):
SERVER_PORT=8081 mvn spring-boot:run -Dspring-boot.run.profiles=dev

# Empaquetar el JAR (útil si el proceso se cae en background):
mvn -DskipTests package
java -jar target/sivu-backend.jar

# Tests
mvn test
mvn verify          # + cobertura JaCoCo en target/site/jacoco/index.html

# Swagger
#   http://localhost:8081/swagger-ui.html
```

**Perfiles**: `dev` (Postgres local + seed), `docker` (lee todo de env vars, prod-like), `test` (H2 + Mongo deshabilitado).
