-- BI-04 / RF-A01: hilo del flujo de aprobación tripartito del Plan de Actividades
-- (GAC-FM-10). Registra el feedback y las respuestas de aprobación/rechazo entre
-- estudiante, tutor empresarial y profesor, en vez de perder las observaciones.
--
-- Tipos:
--   FEEDBACK              -> observación, sin cambio de estado
--   RESPUESTA_APROBACION  -> el revisor aprueba; avanza el estado de firma del plan
--   RESPUESTA_RECHAZO     -> el revisor rechaza; el plan vuelve a BORRADOR
--   SISTEMA               -> evento auto-registrado por el sistema

CREATE TABLE plan_actividades_comentario (
    id                  BIGSERIAL PRIMARY KEY,
    plan_actividades_id BIGINT       NOT NULL REFERENCES plan_actividades(id) ON DELETE CASCADE,
    autor_mongo_id      VARCHAR(36),
    autor_nombre        VARCHAR(160) NOT NULL,
    autor_rol           VARCHAR(20)  NOT NULL,
    tipo                VARCHAR(30)  NOT NULL,
    mensaje             TEXT         NOT NULL,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT chk_pa_comentario_tipo
        CHECK (tipo IN ('FEEDBACK','RESPUESTA_APROBACION','RESPUESTA_RECHAZO','SISTEMA'))
);

CREATE INDEX idx_pa_comentario_pa_created
    ON plan_actividades_comentario(plan_actividades_id, created_at);
