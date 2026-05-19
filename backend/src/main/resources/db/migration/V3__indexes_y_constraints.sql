-- =====================================================================
-- SIVU V3 — Índices adicionales para filtros frecuentes
-- =====================================================================
-- Las FKs en Postgres NO generan índice automático. Esto los crea para
-- los filtros más usados en /convenios?estudianteId / ?empresaId / etc.

CREATE INDEX IF NOT EXISTS idx_convenios_estudiante  ON convenios(estudiante_id);
CREATE INDEX IF NOT EXISTS idx_convenios_empresa     ON convenios(empresa_id);
CREATE INDEX IF NOT EXISTS idx_convenios_vacante     ON convenios(vacante_id);

-- Búsqueda por número (además del UNIQUE) — explícito por claridad
CREATE INDEX IF NOT EXISTS idx_convenios_numero      ON convenios(numero_convenio);

-- Reportes/dashboards filtran por estado de convenio
-- (estado ya tiene índice en V1)

-- Bitácoras: filtros frecuentes
CREATE INDEX IF NOT EXISTS idx_bitacoras_periodo     ON bitacoras(periodo_inicio, periodo_fin);

-- Evaluaciones: filtros por tutor + tipo
CREATE INDEX IF NOT EXISTS idx_evaluaciones_tipo     ON evaluaciones(tipo);
CREATE INDEX IF NOT EXISTS idx_evaluaciones_evaluador_tipo ON evaluaciones(evaluador_tipo);
