-- =====================================================================
-- SIVU — Esquema inicial (PostgreSQL)
-- Dominio: Vinculación de estudiantes a prácticas profesionales
-- =====================================================================

-- -------------------- ESTUDIANTES --------------------
CREATE TABLE estudiantes (
    id                   BIGSERIAL PRIMARY KEY,
    tipo_documento       VARCHAR(10)   NOT NULL,
    numero_documento     VARCHAR(30)   NOT NULL UNIQUE,
    nombres              VARCHAR(120)  NOT NULL,
    apellidos            VARCHAR(120)  NOT NULL,
    email                VARCHAR(180)  NOT NULL UNIQUE,
    telefono             VARCHAR(30),
    programa_academico   VARCHAR(120)  NOT NULL,
    semestre             SMALLINT      NOT NULL CHECK (semestre BETWEEN 1 AND 20),
    creditos_aprobados   SMALLINT      NOT NULL DEFAULT 0 CHECK (creditos_aprobados >= 0),
    promedio_acumulado   NUMERIC(3,2)  NOT NULL DEFAULT 0.00 CHECK (promedio_acumulado BETWEEN 0 AND 5),
    estado               VARCHAR(20)   NOT NULL DEFAULT 'ACTIVO',
    created_at           TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ   NOT NULL DEFAULT now()
);
CREATE INDEX idx_estudiantes_programa ON estudiantes(programa_academico);
CREATE INDEX idx_estudiantes_estado   ON estudiantes(estado);

-- -------------------- EMPRESAS --------------------
CREATE TABLE empresas (
    id                BIGSERIAL PRIMARY KEY,
    nit               VARCHAR(20)   NOT NULL UNIQUE,
    razon_social      VARCHAR(180)  NOT NULL,
    nombre_comercial  VARCHAR(180),
    sector            VARCHAR(80)   NOT NULL,
    ciudad            VARCHAR(80)   NOT NULL,
    direccion         VARCHAR(200),
    email_contacto    VARCHAR(180)  NOT NULL,
    telefono_contacto VARCHAR(30),
    contacto_nombre   VARCHAR(160)  NOT NULL,
    contacto_cargo    VARCHAR(120),
    estado            VARCHAR(20)   NOT NULL DEFAULT 'EN_REVISION',
    created_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ   NOT NULL DEFAULT now()
);
CREATE INDEX idx_empresas_sector ON empresas(sector);
CREATE INDEX idx_empresas_estado ON empresas(estado);

-- -------------------- VACANTES --------------------
CREATE TABLE vacantes (
    id                          BIGSERIAL PRIMARY KEY,
    empresa_id                  BIGINT       NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    titulo                      VARCHAR(180) NOT NULL,
    descripcion                 TEXT         NOT NULL,
    area_practica               VARCHAR(40)  NOT NULL,
    modalidad                   VARCHAR(20)  NOT NULL,
    ciudad                      VARCHAR(80)  NOT NULL,
    requisitos_keywords         TEXT         NOT NULL DEFAULT '',
    creditos_minimos            SMALLINT     NOT NULL DEFAULT 0,
    promedio_minimo             NUMERIC(3,2) NOT NULL DEFAULT 0.00,
    programas_dirigidos         TEXT         NOT NULL DEFAULT '',
    duracion_meses              SMALLINT     NOT NULL DEFAULT 6 CHECK (duracion_meses > 0),
    cupos_disponibles           SMALLINT     NOT NULL DEFAULT 1 CHECK (cupos_disponibles >= 0),
    fecha_inicio                DATE         NOT NULL,
    fecha_cierre_postulaciones  DATE         NOT NULL,
    estado                      VARCHAR(20)  NOT NULL DEFAULT 'BORRADOR',
    created_at                  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_vacantes_empresa ON vacantes(empresa_id);
CREATE INDEX idx_vacantes_estado  ON vacantes(estado);
CREATE INDEX idx_vacantes_area    ON vacantes(area_practica);

-- -------------------- POSTULACIONES --------------------
CREATE TABLE postulaciones (
    id                      BIGSERIAL PRIMARY KEY,
    estudiante_id           BIGINT       NOT NULL REFERENCES estudiantes(id) ON DELETE CASCADE,
    vacante_id              BIGINT       NOT NULL REFERENCES vacantes(id) ON DELETE CASCADE,
    estado                  VARCHAR(20)  NOT NULL DEFAULT 'POSTULADA',
    score_matching          NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (score_matching BETWEEN 0 AND 100),
    justificacion_matching  TEXT,
    mensaje_estudiante      TEXT,
    observaciones_empresa   TEXT,
    fecha_postulacion       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    fecha_decision          TIMESTAMPTZ,
    created_at              TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_postulaciones_est_vac UNIQUE (estudiante_id, vacante_id)
);
CREATE INDEX idx_postulaciones_estado    ON postulaciones(estado);
CREATE INDEX idx_postulaciones_score     ON postulaciones(score_matching);
CREATE INDEX idx_postulaciones_vacante   ON postulaciones(vacante_id);
CREATE INDEX idx_postulaciones_estudiante ON postulaciones(estudiante_id);

-- -------------------- DOCUMENTOS --------------------
CREATE TABLE documentos (
    id                       BIGSERIAL PRIMARY KEY,
    estudiante_id            BIGINT       REFERENCES estudiantes(id) ON DELETE SET NULL,
    postulacion_id           BIGINT       REFERENCES postulaciones(id) ON DELETE SET NULL,
    tipo                     VARCHAR(40)  NOT NULL,
    nombre_original          VARCHAR(255) NOT NULL,
    ruta_almacenamiento      VARCHAR(500) NOT NULL,
    mime_type                VARCHAR(120) NOT NULL,
    tamano_bytes             BIGINT       NOT NULL CHECK (tamano_bytes >= 0),
    estado                   VARCHAR(20)  NOT NULL DEFAULT 'RECIBIDO',
    observaciones_validacion TEXT,
    fecha_validacion         TIMESTAMPTZ,
    created_at               TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at               TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_documentos_estudiante  ON documentos(estudiante_id);
CREATE INDEX idx_documentos_postulacion ON documentos(postulacion_id);
CREATE INDEX idx_documentos_tipo_estado ON documentos(tipo, estado);

-- -------------------- CONVENIOS --------------------
CREATE TABLE convenios (
    id                BIGSERIAL PRIMARY KEY,
    postulacion_id    BIGINT       NOT NULL UNIQUE REFERENCES postulaciones(id) ON DELETE CASCADE,
    estudiante_id     BIGINT       NOT NULL REFERENCES estudiantes(id) ON DELETE CASCADE,
    empresa_id        BIGINT       NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    vacante_id        BIGINT       NOT NULL REFERENCES vacantes(id) ON DELETE CASCADE,
    numero_convenio   VARCHAR(40)  NOT NULL UNIQUE,
    fecha_inicio      DATE         NOT NULL,
    fecha_fin         DATE         NOT NULL,
    estado            VARCHAR(30)  NOT NULL DEFAULT 'BORRADOR',
    documento_pdf_id  BIGINT       REFERENCES documentos(id) ON DELETE SET NULL,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_convenios_estado ON convenios(estado);

-- -------------------- HISTORIAL DE EVENTOS DE POSTULACIÓN --------------------
-- (Visibilidad "tipo seguimiento de pedido" para el estudiante)
CREATE TABLE postulacion_eventos (
    id                  BIGSERIAL PRIMARY KEY,
    postulacion_id      BIGINT       NOT NULL REFERENCES postulaciones(id) ON DELETE CASCADE,
    tipo_evento         VARCHAR(40)  NOT NULL,
    estado_anterior     VARCHAR(20),
    estado_nuevo        VARCHAR(20)  NOT NULL,
    detalle             TEXT,
    actor               VARCHAR(80),
    ocurrido_en         TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_postevt_postulacion ON postulacion_eventos(postulacion_id);
