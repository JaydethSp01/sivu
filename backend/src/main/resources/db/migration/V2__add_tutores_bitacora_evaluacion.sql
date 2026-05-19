-- =====================================================================
-- SIVU V2 — Tutores, Bitácoras y Evaluaciones (etapa "durante" la práctica)
-- =====================================================================

-- -------------------- TUTORES --------------------
CREATE TABLE tutores (
    id            BIGSERIAL PRIMARY KEY,
    tipo          VARCHAR(20)  NOT NULL CHECK (tipo IN ('ACADEMICO','EMPRESARIAL')),
    nombres       VARCHAR(120) NOT NULL,
    apellidos     VARCHAR(120) NOT NULL,
    email         VARCHAR(180) NOT NULL UNIQUE,
    telefono      VARCHAR(30),
    cargo         VARCHAR(120),
    dependencia   VARCHAR(160),  -- facultad/área para académicos, área para empresariales
    empresa_id    BIGINT REFERENCES empresas(id) ON DELETE SET NULL,
    estado        VARCHAR(20)  NOT NULL DEFAULT 'ACTIVO',
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_tutores_tipo   ON tutores(tipo);
CREATE INDEX idx_tutores_estado ON tutores(estado);
CREATE INDEX idx_tutores_empresa ON tutores(empresa_id);

-- -------------------- CONVENIO ↔ TUTORES + calificación final --------------------
ALTER TABLE convenios ADD COLUMN tutor_academico_id    BIGINT REFERENCES tutores(id) ON DELETE SET NULL;
ALTER TABLE convenios ADD COLUMN tutor_empresarial_id  BIGINT REFERENCES tutores(id) ON DELETE SET NULL;
ALTER TABLE convenios ADD COLUMN calificacion_final    NUMERIC(3,2) CHECK (calificacion_final IS NULL OR calificacion_final BETWEEN 0 AND 5);
ALTER TABLE convenios ADD COLUMN certificado_pdf_id    BIGINT REFERENCES documentos(id) ON DELETE SET NULL;
CREATE INDEX idx_convenios_tutor_academico  ON convenios(tutor_academico_id);
CREATE INDEX idx_convenios_tutor_empresarial ON convenios(tutor_empresarial_id);

-- -------------------- BITÁCORAS --------------------
CREATE TABLE bitacoras (
    id                            BIGSERIAL PRIMARY KEY,
    convenio_id                   BIGINT       NOT NULL REFERENCES convenios(id) ON DELETE CASCADE,
    periodo_inicio                DATE         NOT NULL,
    periodo_fin                   DATE         NOT NULL,
    horas_trabajadas              NUMERIC(5,1) NOT NULL DEFAULT 0 CHECK (horas_trabajadas >= 0),
    actividades_realizadas        TEXT         NOT NULL,
    logros_destacados             TEXT,
    dificultades                  TEXT,
    comentarios_estudiante        TEXT,
    comentarios_tutor_academico   TEXT,
    comentarios_tutor_empresarial TEXT,
    estado                        VARCHAR(20)  NOT NULL DEFAULT 'BORRADOR'
        CHECK (estado IN ('BORRADOR','ENVIADA','APROBADA','RECHAZADA')),
    fecha_envio                   TIMESTAMPTZ,
    fecha_revision                TIMESTAMPTZ,
    created_at                    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at                    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT chk_bitacora_periodo CHECK (periodo_fin >= periodo_inicio)
);
CREATE INDEX idx_bitacoras_convenio ON bitacoras(convenio_id);
CREATE INDEX idx_bitacoras_estado   ON bitacoras(estado);

-- -------------------- EVALUACIONES --------------------
CREATE TABLE evaluaciones (
    id                       BIGSERIAL PRIMARY KEY,
    convenio_id              BIGINT       NOT NULL REFERENCES convenios(id) ON DELETE CASCADE,
    tutor_id                 BIGINT       NOT NULL REFERENCES tutores(id) ON DELETE RESTRICT,
    tipo                     VARCHAR(20)  NOT NULL CHECK (tipo IN ('INTERMEDIA','FINAL')),
    evaluador_tipo           VARCHAR(20)  NOT NULL CHECK (evaluador_tipo IN ('ACADEMICO','EMPRESARIAL')),
    fecha_evaluacion         DATE         NOT NULL DEFAULT CURRENT_DATE,
    calificacion             NUMERIC(3,2) NOT NULL CHECK (calificacion BETWEEN 0 AND 5),
    competencias_tecnicas    NUMERIC(3,2) NOT NULL CHECK (competencias_tecnicas BETWEEN 0 AND 5),
    competencias_blandas     NUMERIC(3,2) NOT NULL CHECK (competencias_blandas BETWEEN 0 AND 5),
    recomendacion            VARCHAR(40)  NOT NULL
        CHECK (recomendacion IN ('CONTINUAR','REFORZAR','SUSPENDER','NO_APLICA')),
    observaciones            TEXT,
    created_at               TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at               TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_evaluacion_unica UNIQUE (convenio_id, tipo, evaluador_tipo)
);
CREATE INDEX idx_evaluaciones_convenio ON evaluaciones(convenio_id);
CREATE INDEX idx_evaluaciones_tutor    ON evaluaciones(tutor_id);
