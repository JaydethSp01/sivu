-- Épica 8 - Agendamiento Colaborativo (RF-C01/RF-C02/RF-C03)
--
-- Módulo net-new y aislado. Dos tablas:
--   disponibilidad_docente : franjas que publica un tutor/docente (RF-C01).
--   agendamiento_reunion   : flujo colaborativo estudiante <-> docente (RF-C02/C03).
--
-- Las relaciones a tutores/estudiantes/convenios/acta_reunion se modelan como
-- FKs a nivel de BD; en JPA se referencian por id para mantener el aislamiento.

-- ---------------------------------------------------------------------------
-- RF-C01: disponibilidad del docente
-- ---------------------------------------------------------------------------
CREATE TABLE disponibilidad_docente (
    id          BIGSERIAL PRIMARY KEY,
    tutor_id    BIGINT       NOT NULL REFERENCES tutores(id) ON DELETE CASCADE,
    fecha       DATE         NOT NULL,
    hora_inicio TIME         NOT NULL,
    hora_fin    TIME         NOT NULL,
    modalidad   VARCHAR(20)  NOT NULL DEFAULT 'PRESENCIAL'
        CHECK (modalidad IN ('PRESENCIAL','VIRTUAL')),
    estado      VARCHAR(20)  NOT NULL DEFAULT 'ACTIVA'
        CHECK (estado IN ('ACTIVA','OCUPADA','CANCELADA')),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT chk_disponibilidad_horas CHECK (hora_inicio < hora_fin)
);

CREATE INDEX idx_disponibilidad_tutor ON disponibilidad_docente(tutor_id);
CREATE INDEX idx_disponibilidad_fecha ON disponibilidad_docente(fecha);
CREATE INDEX idx_disponibilidad_tutor_fecha ON disponibilidad_docente(tutor_id, fecha);

-- ---------------------------------------------------------------------------
-- RF-C02/RF-C03: reunión agendada colaborativa
-- ---------------------------------------------------------------------------
CREATE TABLE agendamiento_reunion (
    id               BIGSERIAL PRIMARY KEY,
    convenio_id      BIGINT      NOT NULL REFERENCES convenios(id) ON DELETE CASCADE,
    estudiante_id    BIGINT      NOT NULL REFERENCES estudiantes(id) ON DELETE CASCADE,
    tutor_id         BIGINT      NOT NULL REFERENCES tutores(id) ON DELETE CASCADE,
    disponibilidad_id BIGINT     REFERENCES disponibilidad_docente(id) ON DELETE SET NULL,
    fecha_propuesta  DATE        NOT NULL,
    hora_inicio      TIME        NOT NULL,
    hora_fin         TIME        NOT NULL,
    modalidad        VARCHAR(20) NOT NULL DEFAULT 'PRESENCIAL'
        CHECK (modalidad IN ('PRESENCIAL','VIRTUAL')),
    enlace           VARCHAR(300),
    estado           VARCHAR(20) NOT NULL DEFAULT 'PROPUESTO'
        CHECK (estado IN ('PROPUESTO','ACEPTADO','RECHAZADO','CONTRAOFERTA','CONFIRMADO','CANCELADO')),
    observaciones    TEXT,
    acta_reunion_id  BIGINT      REFERENCES acta_reunion(id) ON DELETE SET NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_agendamiento_horas CHECK (hora_inicio < hora_fin),
    CONSTRAINT chk_agendamiento_virtual_enlace
        CHECK (modalidad <> 'VIRTUAL' OR estado <> 'CONFIRMADO' OR enlace IS NOT NULL)
);

CREATE INDEX idx_agendamiento_tutor ON agendamiento_reunion(tutor_id);
CREATE INDEX idx_agendamiento_estudiante ON agendamiento_reunion(estudiante_id);
CREATE INDEX idx_agendamiento_convenio ON agendamiento_reunion(convenio_id);
CREATE INDEX idx_agendamiento_estado ON agendamiento_reunion(estado);
