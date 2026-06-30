-- V33: agrega la modalidad (Virtual/Presencial) al Acta de Acompañamiento GAC-FM-11.
-- En el PDF la fila "Tipo de reunión" muestra la modalidad legible (Virtual/Presencial),
-- según el template oficial. Idempotente para no romper actas existentes.
ALTER TABLE acta_reunion ADD COLUMN IF NOT EXISTS modalidad VARCHAR(20) NOT NULL DEFAULT 'PRESENCIAL';
