-- =====================================================================
-- SIVU V15 — Sello de tiempo en firmas de evaluaciones (HU-06)
-- =====================================================================
-- Las evaluaciones por trimestre (tutor y profesor) registran si está
-- firmado pero no cuándo. Para que la firma electrónica tenga sello
-- de tiempo verificable, agregamos timestamps explícitos.

ALTER TABLE evaluacion_tutor_trimestre
    ADD COLUMN fecha_firma_tutor      TIMESTAMPTZ,
    ADD COLUMN fecha_firma_estudiante TIMESTAMPTZ,
    ADD COLUMN firmado_tutor_nombre   VARCHAR(160),
    ADD COLUMN firmado_estudiante_nombre VARCHAR(160);

ALTER TABLE evaluacion_profesor_trimestre
    ADD COLUMN fecha_firma_profesor    TIMESTAMPTZ,
    ADD COLUMN fecha_firma_estudiante  TIMESTAMPTZ,
    ADD COLUMN firmado_profesor_nombre VARCHAR(160),
    ADD COLUMN firmado_estudiante_nombre VARCHAR(160);
