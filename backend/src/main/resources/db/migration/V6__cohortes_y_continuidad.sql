-- =====================================================================
-- SIVU V6 — Cohortes de práctica + continuidad entre semestres
-- =====================================================================
-- Modela:
--  * Semestre académico al que pertenece cada convenio (e.g. "2026-1")
--  * Continuidad: convenio que es continuación de otro previo (mismo
--    estudiante, suele ser misma empresa cuando el ET marcó "SI")
--  * Cohorte: conjunto de estudiantes considerados para un semestre,
--    con su estado en el proceso (ELEGIBLE, INSCRITO, PRACTICA_ACTIVA,
--    FINALIZADO, NO_APLICA)

-- Convenio: dos campos nuevos
ALTER TABLE convenios
    ADD COLUMN semestre_academico   VARCHAR(10),
    ADD COLUMN convenio_anterior_id BIGINT REFERENCES convenios(id) ON DELETE SET NULL,
    ADD COLUMN es_continuidad       BOOLEAN NOT NULL DEFAULT FALSE;
CREATE INDEX idx_convenios_semestre     ON convenios(semestre_academico);
CREATE INDEX idx_convenios_anterior     ON convenios(convenio_anterior_id);

-- Cohortes: semestre académico configurable con sus fechas
CREATE TABLE cohorte (
    id                  BIGSERIAL PRIMARY KEY,
    semestre_academico  VARCHAR(10)  NOT NULL UNIQUE,
    nombre              VARCHAR(120) NOT NULL,
    fecha_apertura      DATE,
    fecha_cierre        DATE,
    descripcion         TEXT,
    activa              BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_cohorte_activa ON cohorte(activa);

-- Inscripción del estudiante a una cohorte
CREATE TABLE cohorte_estudiante (
    id              BIGSERIAL PRIMARY KEY,
    cohorte_id      BIGINT       NOT NULL REFERENCES cohorte(id) ON DELETE CASCADE,
    estudiante_id   BIGINT       NOT NULL REFERENCES estudiantes(id) ON DELETE CASCADE,
    estado          VARCHAR(20)  NOT NULL DEFAULT 'ELEGIBLE'
        CHECK (estado IN ('ELEGIBLE','INSCRITO','PRACTICA_ACTIVA','FINALIZADO','NO_APLICA')),
    observaciones   TEXT,
    fecha_inscripcion TIMESTAMPTZ,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_cohorte_estudiante UNIQUE (cohorte_id, estudiante_id)
);
CREATE INDEX idx_cohorte_est_cohorte    ON cohorte_estudiante(cohorte_id);
CREATE INDEX idx_cohorte_est_estudiante ON cohorte_estudiante(estudiante_id);
CREATE INDEX idx_cohorte_est_estado     ON cohorte_estudiante(estado);

-- Cohorte demo para 2026-2 (siguiente semestre desde hoy)
INSERT INTO cohorte (semestre_academico, nombre, fecha_apertura, fecha_cierre, descripcion)
VALUES (
    '2026-2',
    'Cohorte 2026-2',
    '2026-07-01',
    '2026-12-15',
    'Cohorte de prácticas del segundo semestre de 2026.'
) ON CONFLICT (semestre_academico) DO NOTHING;
