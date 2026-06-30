-- BI-11 / RF-D01: flag de idempotencia para el recordatorio automático de reunión próxima.
-- El scheduler RecordatorioReunionScheduler lo pone en TRUE tras avisar a estudiante y tutor.
ALTER TABLE agendamiento_reunion
    ADD COLUMN recordatorio_enviado BOOLEAN NOT NULL DEFAULT FALSE;
