-- =====================================================================
-- SIVU V10 — Solicitudes al Programa Interno (Fábrica de Soluciones)
-- =====================================================================
-- El estudiante puede solicitar explícitamente entrar al programa interno
-- cuando ve que las fechas avanzan y aún no tiene cupo en empresa externa.
-- Coordinación aprueba o rechaza con observaciones.
--
-- El motor de asignación (FabricaSolucionesService.vincularElegibles)
-- ahora considera elegibles a:
--   1) Estudiantes con HV APROBADA + cohorte cuya fecha_apertura <= hoy
--      (= el periodo de prácticas ya inició) y sin convenio activo.
--   2) Estudiantes con solicitud APROBADA pendiente de vincular.

CREATE TABLE solicitud_fabrica (
    id                     BIGSERIAL PRIMARY KEY,
    estudiante_id          BIGINT       NOT NULL REFERENCES estudiantes(id) ON DELETE CASCADE,
    motivo                 TEXT         NOT NULL,
    estado                 VARCHAR(20)  NOT NULL DEFAULT 'PENDIENTE'
        CHECK (estado IN ('PENDIENTE','APROBADA','RECHAZADA')),
    observaciones_coord    TEXT,
    fecha_solicitud        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    fecha_resolucion       TIMESTAMPTZ,
    resuelto_por_mongo_id  VARCHAR(36),
    resuelto_por_nombre    VARCHAR(160),
    created_at             TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at             TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_solicitud_fabrica_estado      ON solicitud_fabrica(estado);
CREATE INDEX idx_solicitud_fabrica_estudiante  ON solicitud_fabrica(estudiante_id);

-- Solo una solicitud PENDIENTE por estudiante a la vez.
CREATE UNIQUE INDEX uq_solicitud_fabrica_pendiente_por_est
    ON solicitud_fabrica(estudiante_id)
    WHERE estado = 'PENDIENTE';
