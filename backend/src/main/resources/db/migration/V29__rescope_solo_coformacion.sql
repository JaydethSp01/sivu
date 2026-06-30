-- =====================================================================
-- V29 — Rescope: dejar SOLO el módulo de Coformación v2.
--
-- En Coformación el estudiante es ASIGNADO directamente a una práctica
-- (empresa + docente acompañante + tutor empresarial); NO hay vacantes ni
-- postulaciones. Esta migración:
--   1) Desacopla convenios y documentos de postulación/vacante.
--   2) Elimina (DROP) las tablas de las features fuera de alcance.
--
-- Forward-only. El orden respeta las dependencias por FK (primero las hijas).
-- Se usa DROP ... IF EXISTS para que sea idempotente / tolerante a entornos
-- donde alguna feature nunca llegó a crearse.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Desacoplar la entrada del Convenio (la "práctica") de postulación/vacante.
--    Al eliminar las columnas, Postgres elimina automáticamente sus FKs y la
--    restricción UNIQUE asociada a postulacion_id.
-- ---------------------------------------------------------------------
ALTER TABLE convenios DROP COLUMN IF EXISTS postulacion_id;
ALTER TABLE convenios DROP COLUMN IF EXISTS vacante_id;

-- ---------------------------------------------------------------------
-- 2) Desacoplar Documentos de postulación.
-- ---------------------------------------------------------------------
ALTER TABLE documentos DROP COLUMN IF EXISTS postulacion_id;

-- ---------------------------------------------------------------------
-- 3) DROP de las tablas de features eliminadas (hijas primero).
-- ---------------------------------------------------------------------

-- Plantillas de formularios y respuestas
DROP TABLE IF EXISTS respuesta_criterio CASCADE;
DROP TABLE IF EXISTS respuesta_formulario CASCADE;
DROP TABLE IF EXISTS criterio_plantilla CASCADE;
DROP TABLE IF EXISTS seccion_plantilla CASCADE;
DROP TABLE IF EXISTS plantilla_formulario CASCADE;

-- Hoja de vida y sus tablas dependientes
DROP TABLE IF EXISTS hoja_vida_comentario CASCADE;
DROP TABLE IF EXISTS hoja_vida_idioma CASCADE;
DROP TABLE IF EXISTS hoja_vida_habilidad CASCADE;
DROP TABLE IF EXISTS hoja_vida_experiencia_fase CASCADE;
DROP TABLE IF EXISTS hoja_vida_experiencia_laboral CASCADE;
DROP TABLE IF EXISTS hoja_vida_educacion CASCADE;
DROP TABLE IF EXISTS hoja_vida CASCADE;

-- Carta de presentación y entrevistas (cuelgan de postulación)
DROP TABLE IF EXISTS carta_presentacion CASCADE;
DROP TABLE IF EXISTS entrevista CASCADE;

-- Fábrica de soluciones
DROP TABLE IF EXISTS solicitud_fabrica CASCADE;

-- Postulaciones (hijas primero) y vacantes
DROP TABLE IF EXISTS postulacion_eventos CASCADE;
DROP TABLE IF EXISTS postulaciones CASCADE;
DROP TABLE IF EXISTS vacantes CASCADE;
