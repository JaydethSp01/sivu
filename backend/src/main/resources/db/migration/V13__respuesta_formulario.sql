-- =====================================================================
-- SIVU V13 — Respuestas a plantillas de formularios
-- =====================================================================
-- Una "respuesta" es la instancia llenada por un usuario para una
-- plantilla específica. Soporta:
--   - Asignación (admin "manda" la plantilla a alguien con contexto)
--   - Llenado (el asignado pone valores en cada criterio)
--   - Entrega (deja de ser editable, queda pendiente de firma)
--   - Firma (cierra el ciclo)
--   - PDF (se genera desde la plantilla + respuestas)
--
-- "Asignado a": referencia opcional al usuario (mongo_id) que debe
-- llenarlo. Se mantiene como string para no acoplar con Mongo.

CREATE TABLE respuesta_formulario (
    id                       BIGSERIAL PRIMARY KEY,
    plantilla_id             BIGINT       NOT NULL REFERENCES plantilla_formulario(id),
    -- Contexto: puede estar atado a un convenio/trimestre/estudiante.
    convenio_id              BIGINT REFERENCES convenios(id) ON DELETE SET NULL,
    trimestre_id             BIGINT REFERENCES trimestre(id) ON DELETE SET NULL,
    estudiante_id            BIGINT REFERENCES estudiantes(id) ON DELETE SET NULL,
    -- Asignación:
    asignado_a_mongo_id      VARCHAR(36),
    asignado_a_nombre        VARCHAR(160),
    asignado_a_rol           VARCHAR(20),
    asignado_por_nombre      VARCHAR(160),
    fecha_asignacion         TIMESTAMPTZ  NOT NULL DEFAULT now(),
    fecha_limite             DATE,
    -- Estado:
    estado                   VARCHAR(20)  NOT NULL DEFAULT 'PENDIENTE'
        CHECK (estado IN ('PENDIENTE','EN_PROGRESO','ENTREGADO','FIRMADO','APROBADO','RECHAZADO')),
    nota_calculada           NUMERIC(3,2),
    observaciones            TEXT,
    fecha_entrega            TIMESTAMPTZ,
    fecha_firma              TIMESTAMPTZ,
    firmado_por_mongo_id     VARCHAR(36),
    firmado_por_nombre       VARCHAR(160),
    created_at               TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at               TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_resp_form_asignado  ON respuesta_formulario(asignado_a_mongo_id, estado);
CREATE INDEX idx_resp_form_plantilla ON respuesta_formulario(plantilla_id);
CREATE INDEX idx_resp_form_convenio  ON respuesta_formulario(convenio_id);
CREATE INDEX idx_resp_form_trimestre ON respuesta_formulario(trimestre_id);

CREATE TABLE respuesta_criterio (
    id              BIGSERIAL PRIMARY KEY,
    respuesta_id    BIGINT       NOT NULL REFERENCES respuesta_formulario(id) ON DELETE CASCADE,
    criterio_id     BIGINT       NOT NULL REFERENCES criterio_plantilla(id),
    -- Tres tipos de valor según el criterio (uno está poblado a la vez):
    valor_numero    NUMERIC(5,2),
    valor_texto     TEXT,
    valor_bool      BOOLEAN,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_resp_criterio UNIQUE (respuesta_id, criterio_id)
);
CREATE INDEX idx_resp_crit_respuesta ON respuesta_criterio(respuesta_id);
