-- BI-01 / RF-D01-D02 - Auditoría de notificaciones de co-formación.
--
-- Tabla aditiva que registra cada notificación emitida por la capa de
-- co-formación (flujo documental y de agendamiento), envolviendo el sistema
-- de correo existente. Deja trazabilidad de éxito/fallo por destinatario y
-- referencia de dominio (POSTULACION / CONVENIO / TRIMESTRE).

CREATE TABLE notificacion_auditoria (
    id                 BIGSERIAL    PRIMARY KEY,
    tipo_evento        VARCHAR(40)  NOT NULL
        CHECK (tipo_evento IN (
            'PLAN_ENVIADO','CORTE_CALIFICADO','DOCUMENTO_FIRMADO','EXPEDIENTE_COMPLETO',
            'REUNION_PROPUESTA','REUNION_CONFIRMADA','RECORDATORIO_CIERRE',
            'RECORDATORIO_REUNION','REUNION_CANCELADA')),
    destinatario_email VARCHAR(255) NOT NULL,
    asunto             VARCHAR(255) NOT NULL,
    enviado_exitoso    BOOLEAN      NOT NULL DEFAULT FALSE,
    error              VARCHAR(1000),
    referencia_tipo    VARCHAR(40),
    referencia_id      BIGINT,
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_notif_auditoria_destinatario ON notificacion_auditoria(destinatario_email);
CREATE INDEX idx_notif_auditoria_tipo_evento  ON notificacion_auditoria(tipo_evento);
CREATE INDEX idx_notif_auditoria_referencia   ON notificacion_auditoria(referencia_tipo, referencia_id);
