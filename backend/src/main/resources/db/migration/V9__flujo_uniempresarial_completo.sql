-- =====================================================================
-- SIVU V9 — Cerrar flujo Uniempresarial Coformación Empresarial
-- =====================================================================
-- Añade las piezas que faltaban para soportar el 100% del flujo oficial:
--   • Entrevistas (entre Postulación y Aceptación)
--   • Carta de Presentación institucional firmada por Coformación
--   • Informe Final del PM (GTC-FM-16) con secciones académicas
--   • Estado de HV (BORRADOR → ENVIADA → APROBADA/RECHAZADA) para que
--     Coformación valide perfiles antes de exponerlos a empresas
--   • Flag opción de grado + páginas + nota final en Plan de Mejora
--   • Momento del proceso (INICIO/MITAD/CIERRE) en Actas de Reunión
--   • Estados nuevos en Postulación para reflejar el ciclo de entrevista
--
-- NOTA: los usuarios viven en MongoDB, por eso las referencias a coord
-- son snapshots (nombre + id como string) y NO FKs a una tabla local.

-- -------------------- ENTREVISTAS --------------------
CREATE TABLE entrevista (
    id                    BIGSERIAL PRIMARY KEY,
    postulacion_id        BIGINT       NOT NULL REFERENCES postulaciones(id) ON DELETE CASCADE,
    fecha_programada      TIMESTAMPTZ  NOT NULL,
    modalidad             VARCHAR(20)  NOT NULL DEFAULT 'PRESENCIAL'
        CHECK (modalidad IN ('PRESENCIAL','VIRTUAL','HIBRIDA')),
    lugar                 VARCHAR(200),
    enlace_virtual        VARCHAR(300),
    entrevistador_nombre  VARCHAR(160),
    entrevistador_cargo   VARCHAR(120),
    observaciones         TEXT,
    resultado             VARCHAR(20)  NOT NULL DEFAULT 'PENDIENTE'
        CHECK (resultado IN ('PENDIENTE','APROBADA','RECHAZADA')),
    fecha_resultado       TIMESTAMPTZ,
    created_at            TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_entrevista_postulacion ON entrevista(postulacion_id);
CREATE INDEX idx_entrevista_resultado   ON entrevista(resultado);

-- -------------------- CARTA DE PRESENTACIÓN --------------------
CREATE TABLE carta_presentacion (
    id                       BIGSERIAL PRIMARY KEY,
    postulacion_id           BIGINT       NOT NULL UNIQUE REFERENCES postulaciones(id) ON DELETE CASCADE,
    ruta_pdf                 VARCHAR(500),
    contenido_extra          TEXT,                  -- texto adicional opcional del coord
    generada_at              TIMESTAMPTZ  NOT NULL DEFAULT now(),
    firmada_por_coord_mongo_id VARCHAR(36),         -- id Mongo del coord
    firmada_por_coord_nombre VARCHAR(160),
    created_at               TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at               TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_carta_postulacion ON carta_presentacion(postulacion_id);

-- -------------------- INFORME FINAL DEL PM (GTC-FM-16) --------------------
-- Documento académico estructurado que entrega el estudiante al cierre del
-- Plan Especial de Mejora. Máximo 15 páginas según norma Uniempresarial.
CREATE TABLE informe_final_pm (
    id                     BIGSERIAL PRIMARY KEY,
    plan_mejora_id         BIGINT       NOT NULL UNIQUE REFERENCES plan_mejora(id) ON DELETE CASCADE,
    resumen_ejecutivo      TEXT,
    contextualizacion      TEXT,
    planteamiento_problema TEXT,
    marco_teorico          TEXT,
    objetivo_general       TEXT,
    objetivos_especificos  TEXT,
    diagnostico            TEXT,       -- DOFA / PESTEL / Ishikawa
    metodologia            TEXT,
    propuesta_solucion     TEXT,
    factibilidad           TEXT,
    conclusiones           TEXT,
    anexos                 TEXT,
    numero_paginas         SMALLINT,
    estado                 VARCHAR(20)  NOT NULL DEFAULT 'BORRADOR'
        CHECK (estado IN ('BORRADOR','ENTREGADO','APROBADO','RECHAZADO')),
    fecha_entrega          TIMESTAMPTZ,
    fecha_revision         TIMESTAMPTZ,
    revisado_por_mongo_id  VARCHAR(36),
    revisado_por_nombre    VARCHAR(160),
    observaciones_revisor  TEXT,
    firmado_estudiante     BOOLEAN      NOT NULL DEFAULT FALSE,
    firmado_tutor_acad     BOOLEAN      NOT NULL DEFAULT FALSE,
    firmado_tutor_emp      BOOLEAN      NOT NULL DEFAULT FALSE,
    documento_pdf_id       BIGINT REFERENCES documentos(id) ON DELETE SET NULL,
    created_at             TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at             TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_informe_pm ON informe_final_pm(plan_mejora_id);

-- -------------------- HOJA DE VIDA: estado de coformación --------------------
ALTER TABLE hoja_vida
    ADD COLUMN estado                    VARCHAR(20) NOT NULL DEFAULT 'BORRADOR'
        CHECK (estado IN ('BORRADOR','ENVIADA','APROBADA','RECHAZADA')),
    ADD COLUMN observaciones_coformacion TEXT,
    ADD COLUMN enviada_at                TIMESTAMPTZ,
    ADD COLUMN aprobada_at               TIMESTAMPTZ,
    ADD COLUMN aprobada_por_coord_mongo_id VARCHAR(36),
    ADD COLUMN aprobada_por_coord_nombre VARCHAR(160);

CREATE INDEX idx_hv_estado ON hoja_vida(estado);

-- -------------------- PLAN DE MEJORA: opción de grado + nota --------------------
ALTER TABLE plan_mejora
    ADD COLUMN es_opcion_de_grado BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN numero_paginas     SMALLINT,
    ADD COLUMN nota_final         NUMERIC(3,2) CHECK (nota_final BETWEEN 0 AND 5);

-- -------------------- ACTA DE REUNIÓN: momento del proceso --------------------
-- 3 reuniones por convenio según la guía: inicio / mitad / cierre.
ALTER TABLE acta_reunion
    ADD COLUMN momento_proceso VARCHAR(10)
        CHECK (momento_proceso IN ('INICIO','MITAD','CIERRE'));

CREATE INDEX idx_acta_momento ON acta_reunion(momento_proceso);

-- -------------------- POSTULACIÓN: nuevos estados de entrevista --------------------
-- El enum se valida en Java (EstadoPostulacion). La columna existente no tiene
-- CHECK constraint, solo documentamos los valores nuevos:
--   ENTREVISTA_PROGRAMADA, ENTREVISTA_REALIZADA

-- -------------------- SEED: catálogo de requisitos --------------------
INSERT INTO tipo_requisito_documental (codigo, nombre, descripcion, aplica_a, activo, created_at, updated_at)
VALUES
  ('GAC-FM-CARTA', 'Carta de Presentación', 'Carta institucional firmada por Coformación al inicio del proceso', 'AMBOS', true, now(), now()),
  ('GTC-FM-16',    'Informe Final del PM',  'Informe académico de cierre del Plan Especial de Mejora (máx 15 páginas)', 'ESTUDIANTE', true, now(), now())
ON CONFLICT (codigo) DO NOTHING;
