-- BI-10 / RNF-03: nota final consolidada del proceso de Coformación.
-- Resultado persistido (cacheado) del cálculo automático y trazable:
--   nota_corte1 = Evaluación Docente (GAC-FM-1) corte 1   -> pondera 25%
--   nota_corte2 = Evaluación Docente (GAC-FM-1) corte 2   -> pondera 25%
--   nota_corte3 = promedio(Evaluación Tutor GAC-FM-9, Informe Final GTC-FM-16) -> 50%
--   nota_final  = corte1*0.25 + corte2*0.25 + corte3*0.50
-- No editable manualmente: solo el servicio de cálculo escribe estas notas (upsert).
-- Notas NULL cuando el insumo aún no existe (resultado parcial). bloqueada cierra el proceso.

CREATE TABLE calificacion_consolidada (
    id           BIGSERIAL PRIMARY KEY,
    convenio_id  BIGINT      NOT NULL,
    nota_corte1  NUMERIC(4,2),
    nota_corte2  NUMERIC(4,2),
    nota_corte3  NUMERIC(4,2),
    nota_final   NUMERIC(4,2),
    calculada_en TIMESTAMPTZ,
    bloqueada    BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_calificacion_convenio UNIQUE (convenio_id),
    CONSTRAINT fk_calificacion_convenio FOREIGN KEY (convenio_id) REFERENCES convenios (id) ON DELETE CASCADE,
    CONSTRAINT chk_calificacion_corte1 CHECK (nota_corte1 IS NULL OR (nota_corte1 BETWEEN 0 AND 5)),
    CONSTRAINT chk_calificacion_corte2 CHECK (nota_corte2 IS NULL OR (nota_corte2 BETWEEN 0 AND 5)),
    CONSTRAINT chk_calificacion_corte3 CHECK (nota_corte3 IS NULL OR (nota_corte3 BETWEEN 0 AND 5)),
    CONSTRAINT chk_calificacion_final  CHECK (nota_final  IS NULL OR (nota_final  BETWEEN 0 AND 5))
);

CREATE INDEX idx_calificacion_convenio ON calificacion_consolidada (convenio_id);
