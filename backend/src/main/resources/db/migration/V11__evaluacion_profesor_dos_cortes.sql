-- =====================================================================
-- SIVU V11 — Evaluación del Profesor con dos cortes (1° y 2°)
-- =====================================================================
-- El formato oficial GAC-FM-1 v3 evalúa al estudiante en DOS cortes
-- (cada uno vale 25% del total del proceso). Hasta ahora la tabla
-- evaluacion_profesor_trimestre guardaba una sola calificación.
--
-- Se agregan columnas espejo para el 2° corte y se separan las
-- observaciones y fechas. Los registros existentes quedan como
-- "corte 1" (sus columnas actuales no se mueven).

ALTER TABLE evaluacion_profesor_trimestre
    ADD COLUMN capacidades_c2                 NUMERIC(3,2)
        CHECK (capacidades_c2 IS NULL OR (capacidades_c2 BETWEEN 0.0 AND 5.0)),
    ADD COLUMN actitudes_c2                   NUMERIC(3,2)
        CHECK (actitudes_c2 IS NULL OR (actitudes_c2 BETWEEN 0.0 AND 5.0)),
    ADD COLUMN aplicacion_desempeno_c2        NUMERIC(3,2)
        CHECK (aplicacion_desempeno_c2 IS NULL OR (aplicacion_desempeno_c2 BETWEEN 0.0 AND 5.0)),
    ADD COLUMN aplicacion_elaboracion_pem_c2  NUMERIC(3,2)
        CHECK (aplicacion_elaboracion_pem_c2 IS NULL OR (aplicacion_elaboracion_pem_c2 BETWEEN 0.0 AND 5.0)),
    ADD COLUMN aplicacion_sustentacion_pem_c2 NUMERIC(3,2)
        CHECK (aplicacion_sustentacion_pem_c2 IS NULL OR (aplicacion_sustentacion_pem_c2 BETWEEN 0.0 AND 5.0)),
    ADD COLUMN nota_ponderada_c2              NUMERIC(3,2)
        CHECK (nota_ponderada_c2 IS NULL OR (nota_ponderada_c2 BETWEEN 0.0 AND 5.0)),
    ADD COLUMN observaciones_c1                TEXT,
    ADD COLUMN observaciones_c2                TEXT,
    ADD COLUMN fecha_c1                        DATE,
    ADD COLUMN fecha_c2                        DATE;

-- Migrar datos existentes: lo que estaba en "observaciones" y "fecha_elaboracion"
-- se considera del corte 1.
UPDATE evaluacion_profesor_trimestre
SET observaciones_c1 = observaciones,
    fecha_c1         = fecha_elaboracion
WHERE observaciones IS NOT NULL OR fecha_elaboracion IS NOT NULL;

-- Las columnas singulares quedan como "corte 1" para retrocompatibilidad;
-- nuevas escrituras usan los campos *_c1/*_c2 explícitos.
