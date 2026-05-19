-- =====================================================================
-- SIVU V7 — Trimestres + Plan de Actividades (PA, GAC-FM-10)
--         + Actas de Reunión (AC, GAC-FM-11) + Plan de Mejora (PM)
--         + Evaluación Tutor (ET, GAC-FM-007) + Evaluación Profesor (EP, GAC-FM-1)
-- =====================================================================
-- Modela el "durante" de la práctica como lo vive la Universidad Empresarial:
-- cada Convenio (1 semestre) se divide en 2 Trimestres con materia núcleo,
-- y por trimestre se entregan PA / Actas / PM / ET / EP firmados.

-- -------------------- TRIMESTRES --------------------
CREATE TABLE trimestre (
    id                  BIGSERIAL PRIMARY KEY,
    convenio_id         BIGINT       NOT NULL REFERENCES convenios(id) ON DELETE CASCADE,
    numero              SMALLINT     NOT NULL CHECK (numero IN (1, 2, 3)),
    materia_nucleo      VARCHAR(180) NOT NULL,
    fecha_inicio        DATE,
    fecha_fin           DATE,
    estado              VARCHAR(20)  NOT NULL DEFAULT 'ABIERTO'
        CHECK (estado IN ('ABIERTO','EN_CURSO','CERRADO')),
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_trimestre_convenio_numero UNIQUE (convenio_id, numero)
);
CREATE INDEX idx_trimestre_convenio ON trimestre(convenio_id);

-- -------------------- PLAN DE ACTIVIDADES (PA, GAC-FM-10) --------------------
CREATE TABLE plan_actividades (
    id                          BIGSERIAL PRIMARY KEY,
    trimestre_id                BIGINT       NOT NULL UNIQUE REFERENCES trimestre(id) ON DELETE CASCADE,
    escenario_coformacion       VARCHAR(180),       -- ej. "Area de IT, Efecty"

    -- Identificación del Plan Especial de Mejora (PEM) (escenario + objetivo)
    pem_descripcion_escenario   TEXT,
    pem_objetivo_general        TEXT,

    -- Estado y firmas
    estado                      VARCHAR(20)  NOT NULL DEFAULT 'BORRADOR'
        CHECK (estado IN ('BORRADOR','ENVIADO_TUTOR','APROBADO_TUTOR','APROBADO_PROFESOR','RECHAZADO')),
    firmado_estudiante          BOOLEAN      NOT NULL DEFAULT FALSE,
    firmado_tutor               BOOLEAN      NOT NULL DEFAULT FALSE,
    firmado_profesor            BOOLEAN      NOT NULL DEFAULT FALSE,
    fecha_firma_estudiante      TIMESTAMPTZ,
    fecha_firma_tutor           TIMESTAMPTZ,
    fecha_firma_profesor        TIMESTAMPTZ,

    documento_pdf_id            BIGINT REFERENCES documentos(id) ON DELETE SET NULL,
    created_at                  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_pa_trimestre ON plan_actividades(trimestre_id);

-- Objetivos de aprendizaje seleccionados del PA (los 9 estándar más los custom)
CREATE TABLE plan_actividades_objetivo (
    id                  BIGSERIAL PRIMARY KEY,
    plan_actividades_id BIGINT       NOT NULL REFERENCES plan_actividades(id) ON DELETE CASCADE,
    escenario           VARCHAR(180),
    descripcion         TEXT         NOT NULL,
    seleccionado        BOOLEAN      NOT NULL DEFAULT TRUE,
    orden               SMALLINT     NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_pa_obj_pa ON plan_actividades_objetivo(plan_actividades_id);

-- Plan mensual mes 1..6 con sus actividades
CREATE TABLE plan_actividades_mes (
    id                  BIGSERIAL PRIMARY KEY,
    plan_actividades_id BIGINT       NOT NULL REFERENCES plan_actividades(id) ON DELETE CASCADE,
    mes                 SMALLINT     NOT NULL CHECK (mes BETWEEN 1 AND 12),
    area_rotacion       VARCHAR(180),
    actividades         TEXT,        -- texto multilinea
    tutor_nombre        VARCHAR(160),
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_pa_mes UNIQUE (plan_actividades_id, mes)
);
CREATE INDEX idx_pa_mes_pa ON plan_actividades_mes(plan_actividades_id);

-- -------------------- ACTAS DE REUNIÓN (AC, GAC-FM-11) --------------------
CREATE TABLE acta_reunion (
    id              BIGSERIAL PRIMARY KEY,
    trimestre_id    BIGINT       NOT NULL REFERENCES trimestre(id) ON DELETE CASCADE,
    numero          SMALLINT     NOT NULL,  -- AC1, AC2, AC3...
    fecha           DATE         NOT NULL,
    hora            VARCHAR(20),
    lugar           VARCHAR(120),
    asunto          VARCHAR(180),
    tipo_reunion    VARCHAR(60)  NOT NULL DEFAULT 'SEGUIMIENTO'
        CHECK (tipo_reunion IN ('INICIAL','SEGUIMIENTO','EVALUACION_PARCIAL','EVALUACION_FINAL','OTRO')),
    asistentes_json TEXT,  -- JSON con [{nombre, rol, correo}]
    observaciones   TEXT,

    firmado_estudiante BOOLEAN   NOT NULL DEFAULT FALSE,
    firmado_tutor      BOOLEAN   NOT NULL DEFAULT FALSE,
    firmado_profesor   BOOLEAN   NOT NULL DEFAULT FALSE,

    documento_pdf_id BIGINT REFERENCES documentos(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_acta_trimestre_numero UNIQUE (trimestre_id, numero)
);
CREATE INDEX idx_acta_trimestre ON acta_reunion(trimestre_id);

-- Items de "Temas tratados" del acta (con observaciones/compromisos por tema)
CREATE TABLE acta_tema (
    id          BIGSERIAL PRIMARY KEY,
    acta_id     BIGINT       NOT NULL REFERENCES acta_reunion(id) ON DELETE CASCADE,
    tema        VARCHAR(180) NOT NULL,
    observaciones TEXT,
    orden       SMALLINT     NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_acta_tema_acta ON acta_tema(acta_id);

-- -------------------- PLAN DE MEJORA (PM) --------------------
-- Un trimestre puede tener 1 o 2 PMs.
CREATE TABLE plan_mejora (
    id              BIGSERIAL PRIMARY KEY,
    trimestre_id    BIGINT       NOT NULL REFERENCES trimestre(id) ON DELETE CASCADE,
    numero          SMALLINT     NOT NULL CHECK (numero IN (1, 2)),
    titulo          VARCHAR(180) NOT NULL,
    problema        TEXT,        -- diagnóstico/contexto del problema
    objetivo        TEXT,        -- objetivo general
    actividades     TEXT,        -- plan de actividades para la mejora
    indicadores     TEXT,        -- cómo se mide
    estado          VARCHAR(20)  NOT NULL DEFAULT 'BORRADOR'
        CHECK (estado IN ('BORRADOR','EN_DESARROLLO','SUSTENTADO','APROBADO','RECHAZADO')),
    documento_pdf_id BIGINT REFERENCES documentos(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_pm_trimestre_numero UNIQUE (trimestre_id, numero)
);
CREATE INDEX idx_pm_trimestre ON plan_mejora(trimestre_id);

-- -------------------- EVALUACIÓN TUTOR (ET, GAC-FM-007) --------------------
-- Pesos: Capacidades 40%, Actitudes 40%, Aplicación 20% (subdividido 10/5/5).
CREATE TABLE evaluacion_tutor_trimestre (
    id                            BIGSERIAL PRIMARY KEY,
    trimestre_id                  BIGINT       NOT NULL UNIQUE REFERENCES trimestre(id) ON DELETE CASCADE,

    capacidades                   NUMERIC(3,2) CHECK (capacidades BETWEEN 0 AND 5),     -- 40%
    actitudes                     NUMERIC(3,2) CHECK (actitudes BETWEEN 0 AND 5),       -- 40%
    aplicacion_desempeno          NUMERIC(3,2) CHECK (aplicacion_desempeno BETWEEN 0 AND 5),    -- 10%
    aplicacion_elaboracion_pem    NUMERIC(3,2) CHECK (aplicacion_elaboracion_pem BETWEEN 0 AND 5), -- 5%
    aplicacion_sustentacion_pem   NUMERIC(3,2) CHECK (aplicacion_sustentacion_pem BETWEEN 0 AND 5), -- 5%
    nota_ponderada                NUMERIC(3,2) CHECK (nota_ponderada BETWEEN 0 AND 5),

    continuidad_con_empresa       BOOLEAN,
    observaciones                 TEXT,
    fecha_elaboracion             DATE,

    firmado_tutor                 BOOLEAN      NOT NULL DEFAULT FALSE,
    firmado_estudiante            BOOLEAN      NOT NULL DEFAULT FALSE,

    documento_pdf_id              BIGINT REFERENCES documentos(id) ON DELETE SET NULL,
    created_at                    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at                    TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_et_trim ON evaluacion_tutor_trimestre(trimestre_id);

-- -------------------- EVALUACIÓN PROFESOR (EP, GAC-FM-1) --------------------
-- Pesos: Capacidades 10%, Actitudes 10%, Aplicación 80% (subdividido 20/50/10).
-- El formato físico tiene dos columnas (1ra y 2da calificación). En SIVU cada
-- trimestre tiene su propia EP, así que solo guardamos una calificación aquí.
CREATE TABLE evaluacion_profesor_trimestre (
    id                            BIGSERIAL PRIMARY KEY,
    trimestre_id                  BIGINT       NOT NULL UNIQUE REFERENCES trimestre(id) ON DELETE CASCADE,

    capacidades                   NUMERIC(3,2) CHECK (capacidades BETWEEN 0 AND 5),     -- 10%
    actitudes                     NUMERIC(3,2) CHECK (actitudes BETWEEN 0 AND 5),       -- 10%
    aplicacion_desempeno          NUMERIC(3,2) CHECK (aplicacion_desempeno BETWEEN 0 AND 5),    -- 20%
    aplicacion_elaboracion_pem    NUMERIC(3,2) CHECK (aplicacion_elaboracion_pem BETWEEN 0 AND 5), -- 50%
    aplicacion_sustentacion_pem   NUMERIC(3,2) CHECK (aplicacion_sustentacion_pem BETWEEN 0 AND 5), -- 10%
    nota_ponderada                NUMERIC(3,2) CHECK (nota_ponderada BETWEEN 0 AND 5),

    observaciones                 TEXT,
    fecha_elaboracion             DATE,

    firmado_profesor              BOOLEAN      NOT NULL DEFAULT FALSE,
    firmado_estudiante            BOOLEAN      NOT NULL DEFAULT FALSE,

    documento_pdf_id              BIGINT REFERENCES documentos(id) ON DELETE SET NULL,
    created_at                    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at                    TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_ep_trim ON evaluacion_profesor_trimestre(trimestre_id);
