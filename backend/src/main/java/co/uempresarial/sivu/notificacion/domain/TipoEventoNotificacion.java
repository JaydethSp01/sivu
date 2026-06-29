package co.uempresarial.sivu.notificacion.domain;

/**
 * Tipos de evento del flujo documental y de agendamiento que generan una
 * notificación auditable (BI-01 / RF-D01-D02).
 */
public enum TipoEventoNotificacion {
    PLAN_ENVIADO,
    CORTE_CALIFICADO,
    DOCUMENTO_FIRMADO,
    EXPEDIENTE_COMPLETO,
    REUNION_PROPUESTA,
    REUNION_CONFIRMADA,
    RECORDATORIO_CIERRE,
    RECORDATORIO_REUNION,
    REUNION_CANCELADA
}
