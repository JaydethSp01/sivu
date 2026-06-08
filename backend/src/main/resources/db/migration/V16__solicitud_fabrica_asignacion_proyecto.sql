-- Cierre del flujo de programa interno: Coformación ya no solo aprueba la
-- solicitud, sino que también ELIGE manualmente qué vacante interna le toca
-- al estudiante. Antes la asignación era automática (FabricaSolucionesService)
-- y sin control de la coordinadora.
--
-- Campos nuevos:
--   * vacante_asignada_id   -> vacante interna concreta que se asignó
--   * postulacion_creada_id -> postulación generada al asignar (para rastreo)
--   * estado nuevo 'ASIGNADA' (la solicitud pasó de APROBADA → ASIGNADA cuando
--     hay vacante elegida + postulación creada)

ALTER TABLE solicitud_fabrica
    ADD COLUMN vacante_asignada_id BIGINT NULL,
    ADD COLUMN postulacion_creada_id BIGINT NULL,
    ADD CONSTRAINT fk_solicitud_fabrica_vacante
        FOREIGN KEY (vacante_asignada_id) REFERENCES vacantes(id)
        ON DELETE SET NULL,
    ADD CONSTRAINT fk_solicitud_fabrica_postulacion
        FOREIGN KEY (postulacion_creada_id) REFERENCES postulaciones(id)
        ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_solicitud_fabrica_vacante
    ON solicitud_fabrica(vacante_asignada_id);
