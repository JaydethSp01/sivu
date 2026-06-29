-- BI-03 - Rol TUTOR + acceso externo por token
--
-- Cimiento para que el tutor empresarial diligencie su evaluación sin una cuenta
-- institucional. El rol TUTOR se agrega a nivel de aplicación (enum Rol, usuarios
-- en MongoDB); aquí solo se modela la tabla de tokens de acceso externo.
--
-- token_acceso_tutor: enlace de un solo uso emitido por un COORDINADOR/ADMIN.
--   El tutor recibe el token, lo valida (endpoint público) y diligencia su evaluación.

CREATE TABLE token_acceso_tutor (
    id          BIGSERIAL    PRIMARY KEY,
    tutor_id    BIGINT       NOT NULL REFERENCES tutores(id) ON DELETE CASCADE,
    convenio_id BIGINT       REFERENCES convenios(id) ON DELETE SET NULL,
    token       VARCHAR(80)  NOT NULL UNIQUE,
    proposito   VARCHAR(40)  NOT NULL DEFAULT 'EVALUACION_TUTOR'
        CHECK (proposito IN ('EVALUACION_TUTOR')),
    expira_en   TIMESTAMPTZ  NOT NULL,
    usado       BOOLEAN      NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_token_acceso_tutor_token ON token_acceso_tutor(token);
CREATE INDEX idx_token_acceso_tutor_tutor ON token_acceso_tutor(tutor_id);
CREATE INDEX idx_token_acceso_tutor_convenio ON token_acceso_tutor(convenio_id);
