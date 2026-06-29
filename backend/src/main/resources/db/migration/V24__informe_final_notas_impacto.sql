-- BI-07 / RF-A04: Informe Final GTC-FM-16 — calificación con notas individuales
-- (tutor empresarial + profesor/docente acompañante), promedio automático,
-- validación de nota mínima (3.0) y marca de Alto Impacto.
-- Las columnas de carátula y nivel ya existían (V18); aquí solo se agregan
-- los campos de calificación. Defaults seguros: notas NULL, alto_impacto FALSE.

ALTER TABLE informe_final_pm
    ADD COLUMN nota_tutor     NUMERIC(3,2),
    ADD COLUMN nota_profesor  NUMERIC(3,2),
    ADD COLUMN nota_promedio  NUMERIC(3,2),
    ADD COLUMN alto_impacto   BOOLEAN NOT NULL DEFAULT FALSE,
    ADD CONSTRAINT chk_informe_nota_tutor    CHECK (nota_tutor    IS NULL OR (nota_tutor    BETWEEN 0 AND 5)),
    ADD CONSTRAINT chk_informe_nota_profesor CHECK (nota_profesor IS NULL OR (nota_profesor BETWEEN 0 AND 5)),
    ADD CONSTRAINT chk_informe_nota_promedio CHECK (nota_promedio IS NULL OR (nota_promedio BETWEEN 0 AND 5));
