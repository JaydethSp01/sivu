-- Gap §6.3 del doc de revisión Coformación: el informe final GTC-FM-16
-- requiere carátula con título propio + indicador de nivel (1/2/3) +
-- cargo del tutor empresarial en cabecera. Antes el informe arrancaba
-- directo en la primera sección y no había forma de distinguir niveles.

ALTER TABLE informe_final_pm
    ADD COLUMN titulo_informe       VARCHAR(300),
    ADD COLUMN nivel                SMALLINT,
    ADD COLUMN cargo_tutor_empresarial VARCHAR(160),
    ADD CONSTRAINT chk_informe_nivel CHECK (nivel IS NULL OR nivel IN (1,2,3));
