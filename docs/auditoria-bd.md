# Auditoría capa de persistencia — SIVU

**Stack:** PostgreSQL 16 (core académico) + MongoDB 7 (auth `usuarios`). Flyway V1→V15. Hexagonal por feature.

## ERD a alto nivel

```
                        +-----------+    +----------+
                        | empresas  |<---| tutores  |  (empresariales)
                        +-----+-----+    +----+-----+
                              |               |
                  +-----------+--+         +--+----------------+
                  | vacantes     |         | convenios.tutorAc |
                  +-----+--------+         | convenios.tutorEm |
                        | (modalidad_vinculacion)
                        v
estudiantes --- postulaciones --- entrevista
   |   \       (uq est+vac)      carta_presentacion
   |    \           |
   |     +-> convenios --(1..N)--> trimestre (1|2|3)
   |     |    | tutorAc/Emp        |   uq(conv,num)
   |     |    | semestre_acad      +--> plan_actividades (1:1) -> _objetivo, _mes(1..12)
   |     |    | convenio_anterior  +--> acta_reunion -> acta_tema
   |     |                          +--> plan_mejora --> informe_final_pm (1:1)
   |     |                          +--> evaluacion_tutor_trimestre   (1:1, sello tiempo V15)
   |     |                          +--> evaluacion_profesor_trimestre (1:1, 2 cortes V11)
   |     +-> documentos (estudiante|empresa|postulacion|tipo_requisito)
   |     +-> hoja_vida (1:1) -> habilidad/idioma/educacion/experiencia_*
   |     +-> solicitud_fabrica
   +-- cohorte_estudiante -- cohorte (semestre_academico UNIQUE)

plantilla_formulario -> seccion_plantilla -> criterio_plantilla
                                              (tipo: NUMBER|TEXT|BOOL|DATE|SELECT|SIGNATURE)
respuesta_formulario -> respuesta_criterio (EAV: valor_numero|texto|bool)

Mongo: usuarios { email†, roles[], estudianteId, empresaId, passwordHash }  (FKs lógicas cross-DB)
```

## Fortalezas

- **Modelado fiel al proceso real** (GAC-FM-007/1/10/11, GTC-FM-16); plantillas configurables (V12-V14) evitan hardcode.
- **Naming, snake_case y timestamps** consistentes (`created_at`/`updated_at` + `TIMESTAMPTZ`).
- **UNIQUEs de negocio bien puestos**: `(estudiante_id,vacante_id)`, `(trimestre,numero)`, `(convenio,numero)`, `(cohorte,estudiante)`, `(plantilla,codigo,version)` y los UNIQUE parciales `WHERE estado='PENDIENTE'` (V10) y `WHERE vigente=true` (V12) son excelentes.
- **CHECKs robustos** (rangos 0-5, semestre 1-20, pesos 0..1) y `EntityGraph` para evitar N+1 en `Convenio`/`Postulacion`.
- Migraciones **idempotentes con `IF NOT EXISTS` / `ON CONFLICT`** donde corresponde; V8 limpia deuda (`drop bitacoras`).

## Hallazgos críticos

- **CRÍTICO – FKs sin índice en hijos pesados**: `evaluaciones.convenio_id` sí lo tiene, pero `plan_actividades_mes`, `acta_tema`, `respuesta_criterio.criterio_id`, `criterio_plantilla.seccion_id` no siempre indexan la FK del padre individualmente para `JOIN`/`DELETE` (riesgo de seq-scan en cascadas).
- **CRÍTICO – Integridad cross-DB no garantizada**: `Usuario.estudianteId/empresaId` (Mongo) referencia Postgres sin restricción; un borrado en `estudiantes` deja huérfanos. No hay job de reconciliación.
- **Búsquedas `LOWER(...) LIKE '%q%'`** (Estudiante, Vacante, Empresa) hacen **full-scan**: sin `pg_trgm` + GIN no escalan con catálogos grandes.
- **EAV `respuesta_criterio` sin CHECK de exclusividad**: deja escribir `valor_numero` y `valor_texto` simultáneamente — ambigüedad para el motor de scoring.

## Índices recomendados

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_estudiantes_nombres_trgm  ON estudiantes USING gin (lower(nombres) gin_trgm_ops);
CREATE INDEX idx_estudiantes_apellidos_trgm ON estudiantes USING gin (lower(apellidos) gin_trgm_ops);
CREATE INDEX idx_empresas_razon_trgm       ON empresas    USING gin (lower(razon_social) gin_trgm_ops);
CREATE INDEX idx_vacantes_titulo_trgm      ON vacantes    USING gin (lower(titulo) gin_trgm_ops);

-- FKs de hijos sin índice explícito
CREATE INDEX idx_acta_tema_acta_id          ON acta_tema(acta_id);
CREATE INDEX idx_pa_mes_pa_id               ON plan_actividades_mes(plan_actividades_id);
CREATE INDEX idx_resp_crit_criterio         ON respuesta_criterio(criterio_id);
CREATE INDEX idx_criterio_plantilla_seccion ON criterio_plantilla(seccion_id);
CREATE INDEX idx_seccion_plantilla_plant    ON seccion_plantilla(plantilla_id);

-- Composites para filtros frecuentes
CREATE INDEX idx_postulaciones_est_estado   ON postulaciones(estudiante_id, estado);
CREATE INDEX idx_postulaciones_vac_estado   ON postulaciones(vacante_id, estado);
CREATE INDEX idx_convenios_est_estado       ON convenios(estudiante_id, estado);
CREATE INDEX idx_documentos_est_tipo        ON documentos(estudiante_id, tipo);
CREATE INDEX idx_postulacion_eventos_post_fecha ON postulacion_eventos(postulacion_id, ocurrido_en DESC);
CREATE INDEX idx_resp_form_estado_fecha     ON respuesta_formulario(estado, fecha_asignacion);
```

Mongo: índice compuesto `{ estudianteId: 1 }` y `{ empresaId: 1 }` para joins lógicos rápidos al perfil.

## Mejoras de esquema

- **Reemplazar `asistentes_json TEXT` en `acta_reunion` por `JSONB`** (+índice `GIN` si se filtra por asistente).
- **Migrar columnas `*_mongo_id VARCHAR(36)` a `UUID`** (resuelto_por, firmado_por, asignado_a): tipo más estricto y menor tamaño.
- **CHECK exclusivo** en `respuesta_criterio`: `(num_nonnulls(valor_numero, valor_texto, valor_bool) <= 1)`.
- **Normalizar `requisitos_keywords`, `programas_dirigidos` (TEXT CSV en `vacantes`)** a `text[]` o tablas asociadas; hoy obligan a parsing en cliente y rompen 1NF.
- **Mover `evaluacion_profesor_trimestre`** a tabla `corte` (PK `(trimestre_id, numero_corte)`) en vez de duplicar columnas `_c1/_c2`; permitiría más cortes sin DDL.
- **Eliminar duplicación `documentos.tipo` (enum) vs `tipo_requisito_id`**; dejar solo el catálogo (V4 ya lo prevé).
- **Definir convención soft-delete**: hoy todo es hard delete con `ON DELETE CASCADE`; convenios/evaluaciones deberían ser inmutables (auditoría académica). Añadir `deleted_at` o restringir a `ON DELETE RESTRICT` para `convenios`, `evaluaciones_*`, `informe_final_pm`.
- **Particionar `postulacion_eventos`** por rango de `ocurrido_en` (mes) cuando supere ~10M filas; misma estrategia para `respuesta_criterio`.
- **Activar FKs implícitas para `documento_pdf_id`/`certificado_pdf_id`** auditando que `ON DELETE SET NULL` no deje convenios firmados huérfanos.

## Veredicto: **8/10**

Esquema sólido, bien alineado al dominio Uniempresarial y con buenas decisiones modernas (UNIQUE parciales, plantillas EAV, sello de tiempo). Las brechas son de **performance a escala** (full-scan en búsquedas) e **integridad cross-DB** (Mongo↔Postgres sin reconciliación), no de modelado.
