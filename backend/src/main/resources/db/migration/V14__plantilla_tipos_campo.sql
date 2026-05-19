-- =====================================================================
-- SIVU V14 — Tipos de campo en criterios de plantillas
-- =====================================================================
-- Cada criterio puede pedir distintos tipos de valor:
--   NUMBER     → input numérico 0-5
--   TEXT       → textarea libre
--   BOOL       → checkbox / SI-NO
--   DATE       → fecha
--   SELECT     → combo con opciones predefinidas
--   SIGNATURE  → firma (booleana + nombre del firmante)
--
-- Antes la heurística era por descripción ("calificación"/"%" → numérico,
-- el resto → texto). Ahora se configura explícito.

ALTER TABLE criterio_plantilla
    ADD COLUMN tipo VARCHAR(20) NOT NULL DEFAULT 'NUMBER'
        CHECK (tipo IN ('NUMBER','TEXT','BOOL','DATE','SELECT','SIGNATURE')),
    ADD COLUMN opciones TEXT;

COMMENT ON COLUMN criterio_plantilla.tipo IS
    'Tipo de campo: NUMBER, TEXT, BOOL, DATE, SELECT, SIGNATURE.';
COMMENT ON COLUMN criterio_plantilla.opciones IS
    'CSV de opciones cuando tipo=SELECT, ej. "INICIAL,SEGUIMIENTO,FINAL".';

-- Reclasificar criterios existentes que vienen del seed V12:
-- los que tenían peso (todos los de eval tutor/profesor) son NUMBER (default).
-- Los de ACTA, PLAN_ACTIVIDADES e INFORME_FINAL no tienen criterios todavía.
-- Nada que migrar.
