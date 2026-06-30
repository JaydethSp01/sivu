-- GAP 3 (RF-A04 #1): editor estructurado de las 12 secciones del Informe Final.
-- Se usa IF NOT EXISTS porque parte de estas columnas ya existían en el esquema
-- previo (resumen_ejecutivo, planteamiento_problema, marco_teorico, diagnostico,
-- metodologia, factibilidad, conclusiones); las restantes son nuevas.
ALTER TABLE informe_final_pm ADD COLUMN IF NOT EXISTS resumen_ejecutivo TEXT;
ALTER TABLE informe_final_pm ADD COLUMN IF NOT EXISTS contextualizacion_empresa TEXT;
ALTER TABLE informe_final_pm ADD COLUMN IF NOT EXISTS planteamiento_problema TEXT;
ALTER TABLE informe_final_pm ADD COLUMN IF NOT EXISTS marco_teorico TEXT;
ALTER TABLE informe_final_pm ADD COLUMN IF NOT EXISTS objetivos TEXT;
ALTER TABLE informe_final_pm ADD COLUMN IF NOT EXISTS diagnostico TEXT;
ALTER TABLE informe_final_pm ADD COLUMN IF NOT EXISTS metodologia TEXT;
ALTER TABLE informe_final_pm ADD COLUMN IF NOT EXISTS justificacion TEXT;
ALTER TABLE informe_final_pm ADD COLUMN IF NOT EXISTS factibilidad TEXT;
ALTER TABLE informe_final_pm ADD COLUMN IF NOT EXISTS resultados TEXT;
ALTER TABLE informe_final_pm ADD COLUMN IF NOT EXISTS conclusiones TEXT;
ALTER TABLE informe_final_pm ADD COLUMN IF NOT EXISTS referencias_apa TEXT;
