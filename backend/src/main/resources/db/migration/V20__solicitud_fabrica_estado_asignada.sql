-- Bug fix descubierto durante el flujo end-to-end de Coformación:
-- la V16 añadió las columnas vacante_asignada_id / postulacion_creada_id
-- y el enum Java EstadoSolicitudFabrica.ASIGNADA, pero olvidó actualizar
-- el CHECK constraint de la columna estado. Resultado: al pasar de
-- APROBADA → ASIGNADA, Postgres rechazaba el UPDATE con violación de
-- check_constraint.

ALTER TABLE solicitud_fabrica
    DROP CONSTRAINT IF EXISTS solicitud_fabrica_estado_check;

ALTER TABLE solicitud_fabrica
    ADD CONSTRAINT solicitud_fabrica_estado_check
    CHECK (estado IN ('PENDIENTE', 'APROBADA', 'ASIGNADA', 'RECHAZADA'));
