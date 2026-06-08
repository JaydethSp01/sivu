-- Bug de producción descubierto al sembrar el ciclo de vida completo:
-- la columna postulaciones.estado es VARCHAR(20), pero el valor del enum
-- 'ENTREVISTA_PROGRAMADA' tiene 21 caracteres. Al programar una entrevista,
-- EntrevistaService hace postulacion.setEstado(ENTREVISTA_PROGRAMADA) y
-- Postgres rechaza con "value too long for type character varying(20)".
--
-- Es decir: programar entrevistas NUNCA funcionó end-to-end. Ampliamos la
-- columna a VARCHAR(30) con margen para cualquier estado futuro.

ALTER TABLE postulaciones
    ALTER COLUMN estado TYPE VARCHAR(30);
