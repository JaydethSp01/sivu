-- Fidelidad estructural GTC-FM-16: campos estructurados de las tablas institucionales
-- de las secciones 6 (Diagnóstico) y 7 (Metodología), que el template oficial presenta
-- como TABLAS (PESTEL, análisis interno, metodología 5W) y no como texto plano.
-- Todos los campos son TEXT nullable. Se usa IF NOT EXISTS por idempotencia.

-- Sección 6.1 Diagnóstico Externo — Tabla 1 (PESTEL)
ALTER TABLE informe_final_pm ADD COLUMN IF NOT EXISTS pestel_politico TEXT;
ALTER TABLE informe_final_pm ADD COLUMN IF NOT EXISTS pestel_economico TEXT;
ALTER TABLE informe_final_pm ADD COLUMN IF NOT EXISTS pestel_social TEXT;
ALTER TABLE informe_final_pm ADD COLUMN IF NOT EXISTS pestel_tecnologico TEXT;

-- Sección 6.1.1 Diagnóstico de la Ventaja Competitiva
ALTER TABLE informe_final_pm ADD COLUMN IF NOT EXISTS ventaja_competitiva TEXT;

-- Sección 6.2 Diagnóstico Interno o del Área Funcional — Tabla 2
ALTER TABLE informe_final_pm ADD COLUMN IF NOT EXISTS interno_capacidad_directiva TEXT;
ALTER TABLE informe_final_pm ADD COLUMN IF NOT EXISTS interno_capacidad_tecnologica TEXT;
ALTER TABLE informe_final_pm ADD COLUMN IF NOT EXISTS interno_capacidad_tecnica TEXT;
ALTER TABLE informe_final_pm ADD COLUMN IF NOT EXISTS interno_talento_humano TEXT;

-- Sección 7 Metodología del Plan de Mejora — Tabla 3 (5W)
ALTER TABLE informe_final_pm ADD COLUMN IF NOT EXISTS metodologia_que TEXT;
ALTER TABLE informe_final_pm ADD COLUMN IF NOT EXISTS metodologia_como TEXT;
ALTER TABLE informe_final_pm ADD COLUMN IF NOT EXISTS metodologia_cuando TEXT;
ALTER TABLE informe_final_pm ADD COLUMN IF NOT EXISTS metodologia_donde TEXT;
ALTER TABLE informe_final_pm ADD COLUMN IF NOT EXISTS metodologia_con_quien TEXT;
