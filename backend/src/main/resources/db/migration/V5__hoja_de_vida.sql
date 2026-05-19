-- =====================================================================
-- SIVU V5 — Hoja de Vida institucional (formato Uniempresarial)
-- =====================================================================
-- El estudiante llena un formulario; el sistema genera el PDF con el
-- formato oficial de la Uniempresarial. Reemplaza al "Hoja de vida"
-- como documento subido manualmente: si la HV está completa, el
-- checklist de requisitos la marca cumplida automáticamente.

CREATE TABLE hoja_vida (
    id                  BIGSERIAL PRIMARY KEY,
    estudiante_id       BIGINT       NOT NULL UNIQUE REFERENCES estudiantes(id) ON DELETE CASCADE,

    -- Datos de contacto
    direccion           VARCHAR(200),
    telefono_contacto   VARCHAR(30),
    ciudad              VARCHAR(80),
    foto_path           VARCHAR(500),

    -- Perfil dividido en SABER / HACER / SER (estilo Uniempresarial)
    perfil_saber        TEXT,
    perfil_hacer        TEXT,
    perfil_ser          TEXT,

    -- Metadatos
    ultima_actualizacion TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_hoja_vida_estudiante ON hoja_vida(estudiante_id);

-- Habilidades técnicas y personales (lista)
CREATE TABLE hoja_vida_habilidad (
    id            BIGSERIAL PRIMARY KEY,
    hoja_vida_id  BIGINT      NOT NULL REFERENCES hoja_vida(id) ON DELETE CASCADE,
    categoria     VARCHAR(40) NOT NULL CHECK (categoria IN ('TECNICA','PERSONAL','HERRAMIENTA','OTRO')),
    descripcion   VARCHAR(160) NOT NULL,
    orden         SMALLINT    NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_hv_habilidad_hv ON hoja_vida_habilidad(hoja_vida_id);

-- Idiomas con nivel marco europeo
CREATE TABLE hoja_vida_idioma (
    id            BIGSERIAL PRIMARY KEY,
    hoja_vida_id  BIGINT      NOT NULL REFERENCES hoja_vida(id) ON DELETE CASCADE,
    idioma        VARCHAR(40) NOT NULL,
    nivel         VARCHAR(10) NOT NULL CHECK (nivel IN ('A1','A2','B1','B2','C1','C2','NATIVO')),
    orden         SMALLINT    NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_hv_idioma UNIQUE (hoja_vida_id, idioma)
);
CREATE INDEX idx_hv_idioma_hv ON hoja_vida_idioma(hoja_vida_id);

-- Educación formal
CREATE TABLE hoja_vida_educacion (
    id            BIGSERIAL PRIMARY KEY,
    hoja_vida_id  BIGINT      NOT NULL REFERENCES hoja_vida(id) ON DELETE CASCADE,
    programa      VARCHAR(180) NOT NULL,
    institucion   VARCHAR(180) NOT NULL,
    fecha_inicio  DATE,
    fecha_fin     DATE,
    en_curso      BOOLEAN     NOT NULL DEFAULT FALSE,
    observaciones TEXT,
    orden         SMALLINT    NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_hv_educacion_hv ON hoja_vida_educacion(hoja_vida_id);

-- Experiencia "fase empresa" (prácticas previas en la U)
CREATE TABLE hoja_vida_experiencia_fase (
    id            BIGSERIAL PRIMARY KEY,
    hoja_vida_id  BIGINT      NOT NULL REFERENCES hoja_vida(id) ON DELETE CASCADE,
    empresa       VARCHAR(180) NOT NULL,
    cargo         VARCHAR(160),
    fecha_inicio  DATE,
    fecha_fin     DATE,
    en_curso      BOOLEAN     NOT NULL DEFAULT FALSE,
    descripcion   TEXT,
    orden         SMALLINT    NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_hv_exp_fase_hv ON hoja_vida_experiencia_fase(hoja_vida_id);

-- Experiencia laboral externa
CREATE TABLE hoja_vida_experiencia_laboral (
    id            BIGSERIAL PRIMARY KEY,
    hoja_vida_id  BIGINT      NOT NULL REFERENCES hoja_vida(id) ON DELETE CASCADE,
    empresa       VARCHAR(180) NOT NULL,
    cargo         VARCHAR(160) NOT NULL,
    fecha_inicio  DATE,
    fecha_fin     DATE,
    en_curso      BOOLEAN     NOT NULL DEFAULT FALSE,
    descripcion   TEXT,
    orden         SMALLINT    NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_hv_exp_laboral_hv ON hoja_vida_experiencia_laboral(hoja_vida_id);
