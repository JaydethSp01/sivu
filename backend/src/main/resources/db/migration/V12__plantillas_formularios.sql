-- =====================================================================
-- SIVU V12 — Plantillas configurables de formatos institucionales
-- =====================================================================
-- Permite que Coformación gestione los formatos oficiales sin tocar
-- código: pesos, criterios, vigencia. Una plantilla tiene secciones,
-- y cada sección tiene criterios. Cuando hay una versión nueva del
-- formato, Coformación marca una plantilla como vigente.
--
-- Tipos soportados (mapean al sistema actual):
--   EVAL_TUTOR        — GAC-FM-007 (formato 24/09/2025 v2.0)
--   EVAL_PROFESOR     — GAC-FM-1   (formato 15/11/2023 v3)
--   ACTA              — GAC-FM-11  (formato 15/11/2023 v2.0)
--   PLAN_ACTIVIDADES  — GAC-FM-10  (formato 15/11/2023 v2.0)
--   INFORME_FINAL     — GTC-FM-16  (formato 03/04/2025 v3.0)

CREATE TABLE plantilla_formulario (
    id                 BIGSERIAL PRIMARY KEY,
    codigo             VARCHAR(40)  NOT NULL,
    version            VARCHAR(10)  NOT NULL,
    tipo               VARCHAR(40)  NOT NULL
        CHECK (tipo IN ('EVAL_TUTOR','EVAL_PROFESOR','ACTA','PLAN_ACTIVIDADES','INFORME_FINAL')),
    nombre             VARCHAR(180) NOT NULL,
    descripcion        TEXT,
    vigente            BOOLEAN      NOT NULL DEFAULT false,
    fecha_vigencia     DATE,
    creado_por_nombre  VARCHAR(160),
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_plantilla_codigo_version UNIQUE (codigo, version)
);
CREATE INDEX idx_plantilla_tipo_vigente ON plantilla_formulario(tipo, vigente);

-- Solo una plantilla vigente por tipo a la vez
CREATE UNIQUE INDEX uq_plantilla_vigente_por_tipo
    ON plantilla_formulario(tipo) WHERE vigente = true;

CREATE TABLE seccion_plantilla (
    id            BIGSERIAL PRIMARY KEY,
    plantilla_id  BIGINT       NOT NULL REFERENCES plantilla_formulario(id) ON DELETE CASCADE,
    orden         SMALLINT     NOT NULL DEFAULT 0,
    codigo        VARCHAR(60),
    titulo        VARCHAR(200) NOT NULL,
    descripcion   TEXT,
    peso          NUMERIC(5,4)
        CHECK (peso IS NULL OR (peso >= 0 AND peso <= 1)),
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_seccion_plantilla ON seccion_plantilla(plantilla_id, orden);

CREATE TABLE criterio_plantilla (
    id            BIGSERIAL PRIMARY KEY,
    seccion_id    BIGINT       NOT NULL REFERENCES seccion_plantilla(id) ON DELETE CASCADE,
    orden         SMALLINT     NOT NULL DEFAULT 0,
    codigo        VARCHAR(60),
    descripcion   TEXT         NOT NULL,
    peso          NUMERIC(5,4)
        CHECK (peso IS NULL OR (peso >= 0 AND peso <= 1)),
    placeholder   TEXT,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_criterio_seccion ON criterio_plantilla(seccion_id, orden);

-- ============================================================
-- SEED: Plantillas vigentes con los formatos institucionales
-- ============================================================

-- ---------- EVAL_TUTOR · GAC-FM-007 v2.0 (24/09/2025) ----------
INSERT INTO plantilla_formulario (codigo, version, tipo, nombre, descripcion, vigente, fecha_vigencia, creado_por_nombre)
VALUES ('GAC-FM-007', '2.0', 'EVAL_TUTOR',
        'Evaluación por parte del Tutor Empresarial',
        'Evaluación que el tutor empresarial hace al practicante al cierre del trimestre. Pesos: Capacidades 40% · Actitudes 40% · Aplicación de herramientas + PEM 20%.',
        true, DATE '2025-09-24', 'Coformación · Seed inicial');

INSERT INTO seccion_plantilla (plantilla_id, orden, codigo, titulo, peso)
SELECT id, 1, 'CAPACIDADES', 'Capacidades y competencias', 0.40
FROM plantilla_formulario WHERE codigo='GAC-FM-007' AND version='2.0';
INSERT INTO criterio_plantilla (seccion_id, orden, codigo, descripcion)
SELECT s.id, 1, 'PROACTIVIDAD',
       'Proactividad: tiene un alto nivel de autonomía y capacidad para resolver situaciones complejas y proponer soluciones novedosas.'
FROM seccion_plantilla s JOIN plantilla_formulario p ON s.plantilla_id=p.id
WHERE p.codigo='GAC-FM-007' AND p.version='2.0' AND s.codigo='CAPACIDADES';
INSERT INTO criterio_plantilla (seccion_id, orden, codigo, descripcion)
SELECT s.id, 2, 'CALIDAD',
       'Calidad en el trabajo: trabaja en forma eficiente, eficaz y sus resultados son de alto nivel de calidad.'
FROM seccion_plantilla s JOIN plantilla_formulario p ON s.plantilla_id=p.id
WHERE p.codigo='GAC-FM-007' AND p.version='2.0' AND s.codigo='CAPACIDADES';
INSERT INTO criterio_plantilla (seccion_id, orden, codigo, descripcion)
SELECT s.id, 3, 'COLABORACION',
       'Colaboración y resolución de problemas: apoya y participa en los procesos del área. Solicita retroalimentación y resuelve problemas siguiendo la directriz.'
FROM seccion_plantilla s JOIN plantilla_formulario p ON s.plantilla_id=p.id
WHERE p.codigo='GAC-FM-007' AND p.version='2.0' AND s.codigo='CAPACIDADES';

INSERT INTO seccion_plantilla (plantilla_id, orden, codigo, titulo, peso)
SELECT id, 2, 'ACTITUDES', 'Actitudes y comportamiento', 0.40
FROM plantilla_formulario WHERE codigo='GAC-FM-007' AND version='2.0';
INSERT INTO criterio_plantilla (seccion_id, orden, codigo, descripcion)
SELECT s.id, n, c, d FROM seccion_plantilla s JOIN plantilla_formulario p ON s.plantilla_id=p.id
CROSS JOIN (VALUES
    (1::smallint, 'PUNTUALIDAD',     'Puntualidad: respeta horarios de llegada/salida, reuniones y tareas.'),
    (2::smallint, 'RESPONSABILIDAD', 'Responsabilidad: responde y cumple con las tareas asignadas.'),
    (3::smallint, 'NORMAS',          'Cumplimiento de normas y seguimiento de instrucciones.'),
    (4::smallint, 'HABILIDADES_SOC', 'Habilidades sociales: se comunica asertivamente y se integra al equipo.'),
    (5::smallint, 'CONTEXTO',        'Comprensión del contexto: entiende situaciones, amenazas y oportunidades; identifica visión y valores institucionales.'),
    (6::smallint, 'PRESENTACION',    'Presentación personal: indumentaria acorde al código de vestuario de la organización.')
) AS items(n, c, d)
WHERE p.codigo='GAC-FM-007' AND p.version='2.0' AND s.codigo='ACTITUDES';

INSERT INTO seccion_plantilla (plantilla_id, orden, codigo, titulo, descripcion, peso)
SELECT id, 3, 'APLICACION',
       'Aplicación de herramientas técnicas y elaboración/sustentación del PEM',
       'Desempeño en aplicación + Calidad académica del PEM + Sustentación final.',
       0.20
FROM plantilla_formulario WHERE codigo='GAC-FM-007' AND version='2.0';
INSERT INTO criterio_plantilla (seccion_id, orden, codigo, descripcion, peso)
SELECT s.id, n, c, d, w FROM seccion_plantilla s JOIN plantilla_formulario p ON s.plantilla_id=p.id
CROSS JOIN (VALUES
    (1::smallint, 'DESEMPENO_HERR', 'Desempeño en la aplicación y uso de herramientas adquiridas en la fase aula (10%).',                          0.10::numeric),
    (2::smallint, 'CALIDAD_PEM',    'Calidad académica en la elaboración y entrega final del documento del PEM (5%).',                              0.05::numeric),
    (3::smallint, 'SUSTENTACION',   'Sustentación final del PEM: herramientas audiovisuales, calidad, habilidades de comunicación (5%).',           0.05::numeric)
) AS items(n, c, d, w)
WHERE p.codigo='GAC-FM-007' AND p.version='2.0' AND s.codigo='APLICACION';

-- ---------- EVAL_PROFESOR · GAC-FM-1 v3 (15/11/2023) ----------
INSERT INTO plantilla_formulario (codigo, version, tipo, nombre, descripcion, vigente, fecha_vigencia, creado_por_nombre)
VALUES ('GAC-FM-1', '3', 'EVAL_PROFESOR',
        'Evaluación por parte del Profesor Acompañante',
        'Evaluación del profesor acompañante al practicante en dos cortes (25% cada uno). Pesos por corte: Capacidades 10% · Actitudes 10% · Aplicación 80% (Desempeño 20% + Calidad PEM 50% + Sustentación 10%).',
        true, DATE '2023-11-15', 'Coformación · Seed inicial');

INSERT INTO seccion_plantilla (plantilla_id, orden, codigo, titulo, peso)
SELECT id, 1, 'CAPACIDADES', 'Capacidades y competencias', 0.10
FROM plantilla_formulario WHERE codigo='GAC-FM-1' AND version='3';
INSERT INTO criterio_plantilla (seccion_id, orden, codigo, descripcion)
SELECT s.id, 1, 'CAPACIDADES',
       'Comprensión y asimilación de funciones e instrucciones; capacidad de generar ideas y acciones más allá de las instrucciones recibidas.'
FROM seccion_plantilla s JOIN plantilla_formulario p ON s.plantilla_id=p.id
WHERE p.codigo='GAC-FM-1' AND p.version='3' AND s.codigo='CAPACIDADES';

INSERT INTO seccion_plantilla (plantilla_id, orden, codigo, titulo, peso)
SELECT id, 2, 'ACTITUDES', 'Actitudes y comportamiento', 0.10
FROM plantilla_formulario WHERE codigo='GAC-FM-1' AND version='3';
INSERT INTO criterio_plantilla (seccion_id, orden, codigo, descripcion)
SELECT s.id, 1, 'ACTITUDES',
       'Responsabilidad, dedicación, respeto, puntualidad en la entrega de compromisos, cumplimiento de reglamentos.'
FROM seccion_plantilla s JOIN plantilla_formulario p ON s.plantilla_id=p.id
WHERE p.codigo='GAC-FM-1' AND p.version='3' AND s.codigo='ACTITUDES';

INSERT INTO seccion_plantilla (plantilla_id, orden, codigo, titulo, peso)
SELECT id, 3, 'APLICACION',
       'Aplicación de herramientas técnicas y elaboración/sustentación del PEM', 0.80
FROM plantilla_formulario WHERE codigo='GAC-FM-1' AND version='3';
INSERT INTO criterio_plantilla (seccion_id, orden, codigo, descripcion, peso)
SELECT s.id, n, c, d, w FROM seccion_plantilla s JOIN plantilla_formulario p ON s.plantilla_id=p.id
CROSS JOIN (VALUES
    (1::smallint, 'DESEMPENO_HERR', 'Desempeño en la aplicación y uso de herramientas adquiridas en la fase aula (20%).',                          0.20::numeric),
    (2::smallint, 'CALIDAD_PEM',    'Calidad académica en la elaboración y entrega final del documento del PEM (50%).',                             0.50::numeric),
    (3::smallint, 'SUSTENTACION',   'Sustentación final del PEM: herramientas audiovisuales, calidad, habilidades de comunicación (10%).',          0.10::numeric)
) AS items(n, c, d, w)
WHERE p.codigo='GAC-FM-1' AND p.version='3' AND s.codigo='APLICACION';

-- ---------- ACTA · GAC-FM-11 v2.0 (15/11/2023) ----------
INSERT INTO plantilla_formulario (codigo, version, tipo, nombre, descripcion, vigente, fecha_vigencia, creado_por_nombre)
VALUES ('GAC-FM-11', '2.0', 'ACTA',
        'Acta de Acompañamiento Fase Coformación Empresarial',
        'Acta de las reuniones de seguimiento (INICIO/MITAD/CIERRE) entre estudiante, tutor empresarial y profesor acompañante.',
        true, DATE '2023-11-15', 'Coformación · Seed inicial');
INSERT INTO seccion_plantilla (plantilla_id, orden, codigo, titulo)
SELECT id, n, c, t FROM plantilla_formulario p
CROSS JOIN (VALUES
    (1::smallint, 'DATOS_REUNION', 'Datos generales de la reunión'),
    (2::smallint, 'ASISTENTES',    'Asistentes'),
    (3::smallint, 'ASPECTOS',      'Aspectos de la reunión (temas y compromisos)'),
    (4::smallint, 'OBSERVACIONES', 'Otras observaciones'),
    (5::smallint, 'FIRMAS',        'Firma de asistentes')
) AS items(n, c, t)
WHERE p.codigo='GAC-FM-11' AND p.version='2.0';

-- ---------- PLAN_ACTIVIDADES · GAC-FM-10 v2.0 (15/11/2023) ----------
INSERT INTO plantilla_formulario (codigo, version, tipo, nombre, descripcion, vigente, fecha_vigencia, creado_por_nombre)
VALUES ('GAC-FM-10', '2.0', 'PLAN_ACTIVIDADES',
        'Plan de Actividades Fase Empresarial',
        'Plan mensual de actividades del practicante en la empresa, alineado con los objetivos de aprendizaje del programa.',
        true, DATE '2023-11-15', 'Coformación · Seed inicial');
INSERT INTO seccion_plantilla (plantilla_id, orden, codigo, titulo)
SELECT id, n, c, t FROM plantilla_formulario p
CROSS JOIN (VALUES
    (1::smallint, 'IDENT_PEM',     'Identificación del Plan Especial de Mejora'),
    (2::smallint, 'OBJETIVOS',     'Objetivos de aprendizaje fase empresarial'),
    (3::smallint, 'PLAN_MENSUAL',  'Plan de actividades mensual (mes 1 a mes 6)'),
    (4::smallint, 'FIRMAS',        'Firmas (estudiante, tutor, profesor)')
) AS items(n, c, t)
WHERE p.codigo='GAC-FM-10' AND p.version='2.0';

-- ---------- INFORME_FINAL · GTC-FM-16 v3.0 (03/04/2025) ----------
INSERT INTO plantilla_formulario (codigo, version, tipo, nombre, descripcion, vigente, fecha_vigencia, creado_por_nombre)
VALUES ('GTC-FM-16', '3.0', 'INFORME_FINAL',
        'Informe Final del Plan de Mejora — Nivel 3',
        'Informe académico de cierre del Plan Especial de Mejora (máx 15 págs). 12 secciones obligatorias.',
        true, DATE '2025-04-03', 'Coformación · Seed inicial');
INSERT INTO seccion_plantilla (plantilla_id, orden, codigo, titulo)
SELECT id, n, c, t FROM plantilla_formulario p
CROSS JOIN (VALUES
    ( 1::smallint, 'RESUMEN_EJEC',      '1. Resumen Ejecutivo'),
    ( 2::smallint, 'CONTEXTUALIZACION', '2. Contextualización de la Empresa Coformadora'),
    ( 3::smallint, 'PLANTEAMIENTO',     '3. Planteamiento del Problema'),
    ( 4::smallint, 'MARCO_TEORICO',     '4. Marco Teórico'),
    ( 5::smallint, 'OBJ_GENERAL',       '5. Objetivo General'),
    ( 6::smallint, 'OBJ_ESPECIFICOS',   '6. Objetivos Específicos'),
    ( 7::smallint, 'DIAGNOSTICO',       '7. Diagnóstico'),
    ( 8::smallint, 'METODOLOGIA',       '8. Metodología'),
    ( 9::smallint, 'PROPUESTA',         '9. Propuesta de Solución'),
    (10::smallint, 'FACTIBILIDAD',      '10. Factibilidad'),
    (11::smallint, 'CONCLUSIONES',      '11. Conclusiones'),
    (12::smallint, 'ANEXOS',            '12. Anexos')
) AS items(n, c, t)
WHERE p.codigo='GTC-FM-16' AND p.version='3.0';
