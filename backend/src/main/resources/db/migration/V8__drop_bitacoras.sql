-- =====================================================================
-- SIVU V8 — Eliminar la entidad Bitácora
-- =====================================================================
-- Motivo: redundante con las Actas de Reunión (GAC-FM-11) del módulo de
-- Trimestres (V7). El flujo real de la Universidad Empresarial NO contempla
-- "bitácoras"; usa Actas dentro de cada Trimestre. Por consistencia con el
-- proceso real, eliminamos la tabla y sus dependencias.

DROP TABLE IF EXISTS bitacoras CASCADE;
