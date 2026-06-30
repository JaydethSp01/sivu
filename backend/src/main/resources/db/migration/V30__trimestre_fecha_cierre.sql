-- GAP 2 (RF-D01 #5): fecha límite de cierre del corte/trimestre + flag de idempotencia
-- para el recordatorio automático "5 días antes del cierre".
ALTER TABLE trimestre ADD COLUMN IF NOT EXISTS fecha_cierre DATE;
ALTER TABLE trimestre ADD COLUMN IF NOT EXISTS recordatorio_cierre_enviado BOOLEAN NOT NULL DEFAULT FALSE;
