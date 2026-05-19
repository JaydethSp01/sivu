-- =====================================================================
-- SIVU V4 — Modalidades de vinculación y requisitos documentales configurables
-- =====================================================================
-- Reemplaza el enum hardcodeado TipoDocumentoSoporte por un catálogo en BD
-- que el admin puede gestionar sin tocar código. Cada Modalidad de vinculación
-- (CCB, interna U, empresa propuesta) tiene su set de requisitos documentales.

-- -------------------- MODALIDAD DE VINCULACIÓN --------------------
CREATE TABLE modalidad_vinculacion (
    id           BIGSERIAL PRIMARY KEY,
    codigo       VARCHAR(60)   NOT NULL UNIQUE,
    nombre       VARCHAR(160)  NOT NULL,
    descripcion  TEXT,
    activo       BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ   NOT NULL DEFAULT now()
);
CREATE INDEX idx_modalidad_activo ON modalidad_vinculacion(activo);

-- -------------------- TIPO DE REQUISITO DOCUMENTAL --------------------
CREATE TABLE tipo_requisito_documental (
    id           BIGSERIAL PRIMARY KEY,
    codigo       VARCHAR(60)   NOT NULL UNIQUE,
    nombre       VARCHAR(160)  NOT NULL,
    descripcion  TEXT,
    aplica_a     VARCHAR(20)   NOT NULL CHECK (aplica_a IN ('ESTUDIANTE','EMPRESA','AMBOS')),
    activo       BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ   NOT NULL DEFAULT now()
);
CREATE INDEX idx_tipo_req_activo  ON tipo_requisito_documental(activo);
CREATE INDEX idx_tipo_req_aplica  ON tipo_requisito_documental(aplica_a);

-- -------------------- REQUISITO POR MODALIDAD (junction) --------------------
CREATE TABLE requisito_modalidad (
    id                 BIGSERIAL PRIMARY KEY,
    modalidad_id       BIGINT      NOT NULL REFERENCES modalidad_vinculacion(id) ON DELETE CASCADE,
    tipo_requisito_id  BIGINT      NOT NULL REFERENCES tipo_requisito_documental(id) ON DELETE RESTRICT,
    obligatorio        BOOLEAN     NOT NULL DEFAULT TRUE,
    orden              SMALLINT    NOT NULL DEFAULT 0,
    instrucciones      TEXT,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_req_mod UNIQUE (modalidad_id, tipo_requisito_id)
);
CREATE INDEX idx_req_mod_modalidad ON requisito_modalidad(modalidad_id);

-- -------------------- VACANTE: agregar modalidad --------------------
ALTER TABLE vacantes
    ADD COLUMN modalidad_id BIGINT REFERENCES modalidad_vinculacion(id) ON DELETE SET NULL;
CREATE INDEX idx_vacantes_modalidad ON vacantes(modalidad_id);

-- -------------------- DOCUMENTO: vincular a tipo configurable + a empresa --------------------
-- Mantenemos la columna 'tipo' (enum) por compatibilidad; agregamos tipo_requisito_id
-- como referencia al catálogo. Ambos pueden convivir; el campo nuevo es la fuente
-- de verdad en el flujo configurable.
ALTER TABLE documentos
    ADD COLUMN tipo_requisito_id BIGINT REFERENCES tipo_requisito_documental(id) ON DELETE SET NULL,
    ADD COLUMN empresa_id        BIGINT REFERENCES empresas(id) ON DELETE SET NULL;
CREATE INDEX idx_documentos_tipo_req ON documentos(tipo_requisito_id);
CREATE INDEX idx_documentos_empresa  ON documentos(empresa_id);

-- -------------------- EMPRESA: propuesta por un estudiante --------------------
ALTER TABLE empresas
    ADD COLUMN propuesta_por_estudiante_id BIGINT REFERENCES estudiantes(id) ON DELETE SET NULL,
    ADD COLUMN fecha_aprobacion            TIMESTAMPTZ,
    ADD COLUMN motivo_rechazo              TEXT;
CREATE INDEX idx_empresas_propuesta_por ON empresas(propuesta_por_estudiante_id);

-- =====================================================================
-- DATOS INICIALES — modalidades + tipos + matriz
-- (idempotentes con ON CONFLICT)
-- =====================================================================

INSERT INTO modalidad_vinculacion (codigo, nombre, descripcion) VALUES
    ('EMPRESA_ALIADA_CCB',          'Empresa aliada vía Cámara de Comercio de Bogotá',
        'La universidad analiza tu perfil y te postula a empresas con convenio vigente CCB.'),
    ('INTERNA_UNIVERSIDAD',         'Práctica interna en la Universidad (Fábrica de Software)',
        'Plan B cuando no quedas en empresa aliada: trabajas en proyectos internos de la U.'),
    ('EMPRESA_PROPUESTA_ESTUDIANTE','Empresa propuesta por el estudiante (nueva alianza)',
        'Tú llevas una empresa nueva. Pasa por un proceso de validación y aprobación por coordinación.')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO tipo_requisito_documental (codigo, nombre, descripcion, aplica_a) VALUES
    ('HOJA_VIDA',              'Hoja de vida actualizada',                     'CV en PDF, no mayor a 2 páginas.', 'ESTUDIANTE'),
    ('DOCUMENTO_IDENTIDAD',    'Documento de identidad',                       'CC/TI/CE escaneada por ambas caras.', 'ESTUDIANTE'),
    ('EPS',                    'Afiliación vigente a EPS',                     'Certificado de afiliación con vigencia.', 'ESTUDIANTE'),
    ('CERTIFICADO_ACADEMICO',  'Certificado académico con promedio',           'Emitido por Registro y Control con promedio acumulado.', 'ESTUDIANTE'),
    ('CARTA_PRESENTACION',     'Carta de presentación del programa',           'Carta emitida por el director de programa.', 'ESTUDIANTE'),
    ('RUT_EMPRESA',            'RUT de la empresa',                            'Documento RUT actualizado de la empresa.', 'EMPRESA'),
    ('CAMARA_COMERCIO',        'Certificado de Cámara de Comercio',            'No mayor a 30 días de expedición.', 'EMPRESA'),
    ('CARTA_ALIANZA',          'Carta de intención de alianza',                'Carta firmada por el representante legal manifestando interés en el convenio.', 'EMPRESA'),
    ('POLIZA_ARL',             'Póliza de ARL para el practicante',            'Soporte de afiliación al sistema de riesgos laborales.', 'EMPRESA')
ON CONFLICT (codigo) DO NOTHING;

-- Matriz: qué requisito aplica a qué modalidad
-- (referenciamos por codigo para que sea idempotente con CTEs)
WITH m AS (SELECT id, codigo FROM modalidad_vinculacion),
     t AS (SELECT id, codigo FROM tipo_requisito_documental)
INSERT INTO requisito_modalidad (modalidad_id, tipo_requisito_id, obligatorio, orden)
SELECT m.id, t.id, mr.obligatorio, mr.orden
FROM (
    VALUES
        -- EMPRESA_ALIADA_CCB
        ('EMPRESA_ALIADA_CCB',           'HOJA_VIDA',              TRUE, 1),
        ('EMPRESA_ALIADA_CCB',           'DOCUMENTO_IDENTIDAD',    TRUE, 2),
        ('EMPRESA_ALIADA_CCB',           'EPS',                    TRUE, 3),
        ('EMPRESA_ALIADA_CCB',           'CERTIFICADO_ACADEMICO',  TRUE, 4),
        -- INTERNA_UNIVERSIDAD
        ('INTERNA_UNIVERSIDAD',          'HOJA_VIDA',              TRUE, 1),
        ('INTERNA_UNIVERSIDAD',          'DOCUMENTO_IDENTIDAD',    TRUE, 2),
        ('INTERNA_UNIVERSIDAD',          'EPS',                    TRUE, 3),
        -- EMPRESA_PROPUESTA_ESTUDIANTE
        ('EMPRESA_PROPUESTA_ESTUDIANTE', 'HOJA_VIDA',              TRUE, 1),
        ('EMPRESA_PROPUESTA_ESTUDIANTE', 'DOCUMENTO_IDENTIDAD',    TRUE, 2),
        ('EMPRESA_PROPUESTA_ESTUDIANTE', 'EPS',                    TRUE, 3),
        ('EMPRESA_PROPUESTA_ESTUDIANTE', 'CERTIFICADO_ACADEMICO',  TRUE, 4),
        ('EMPRESA_PROPUESTA_ESTUDIANTE', 'CARTA_PRESENTACION',     TRUE, 5),
        ('EMPRESA_PROPUESTA_ESTUDIANTE', 'RUT_EMPRESA',            TRUE, 6),
        ('EMPRESA_PROPUESTA_ESTUDIANTE', 'CAMARA_COMERCIO',        TRUE, 7),
        ('EMPRESA_PROPUESTA_ESTUDIANTE', 'CARTA_ALIANZA',          TRUE, 8),
        ('EMPRESA_PROPUESTA_ESTUDIANTE', 'POLIZA_ARL',             FALSE, 9)
) AS mr(mod_codigo, tipo_codigo, obligatorio, orden)
JOIN m ON m.codigo = mr.mod_codigo
JOIN t ON t.codigo = mr.tipo_codigo
ON CONFLICT (modalidad_id, tipo_requisito_id) DO NOTHING;
