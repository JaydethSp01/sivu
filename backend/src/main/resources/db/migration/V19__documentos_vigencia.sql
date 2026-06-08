-- Documentos institucionales con fechas de vigencia (EPS, certificados,
-- contratos, etc.). Antes solo había estado de validación
-- (RECIBIDO/VALIDADO/RECHAZADO); ahora se puede saber si un documento
-- está ACTIVO, POR_VENCER o VENCIDO en función de la fecha de hoy.
--
-- El cálculo del estado de vigencia es derivado (no se persiste) y se
-- expone en DocumentoResponse.estadoVigencia.

ALTER TABLE documentos
    ADD COLUMN fecha_vigencia_inicio DATE NULL,
    ADD COLUMN fecha_vigencia_fin    DATE NULL,
    ADD CONSTRAINT chk_documento_vigencia
        CHECK (
            fecha_vigencia_inicio IS NULL
            OR fecha_vigencia_fin  IS NULL
            OR fecha_vigencia_fin >= fecha_vigencia_inicio
        );

CREATE INDEX IF NOT EXISTS idx_documento_vigencia_fin
    ON documentos(fecha_vigencia_fin)
    WHERE fecha_vigencia_fin IS NOT NULL;
