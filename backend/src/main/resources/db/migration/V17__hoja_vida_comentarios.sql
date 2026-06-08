-- Historial conversacional de feedback entre Coformación y Estudiante sobre
-- la Hoja de Vida. Antes, cada rechazo sobrescribía el campo
-- 'observaciones_coformacion'; ahora cada mensaje queda registrado y el
-- estudiante puede responder antes de reenviar la HV.
--
-- Tipos:
--   FEEDBACK   -> comentario de Coformación al estudiante (sin cambio de estado)
--   RESPUESTA  -> mensaje del estudiante hacia Coformación
--   SISTEMA    -> evento auto-registrado al APROBAR / RECHAZAR / ENVIAR

CREATE TABLE hoja_vida_comentario (
    id              BIGSERIAL PRIMARY KEY,
    hoja_vida_id    BIGINT       NOT NULL REFERENCES hoja_vida(id) ON DELETE CASCADE,
    autor_mongo_id  VARCHAR(36),
    autor_nombre    VARCHAR(160) NOT NULL,
    autor_rol       VARCHAR(20)  NOT NULL,
    tipo            VARCHAR(20)  NOT NULL,
    mensaje         TEXT         NOT NULL,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_hv_comentario_tipo
        CHECK (tipo IN ('FEEDBACK','RESPUESTA','SISTEMA')),
    CONSTRAINT chk_hv_comentario_autor_rol
        CHECK (autor_rol IN ('COORDINADOR','ADMIN','ESTUDIANTE','SISTEMA'))
);

CREATE INDEX idx_hv_comentario_hv_created
    ON hoja_vida_comentario(hoja_vida_id, created_at);
