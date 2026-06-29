package co.uempresarial.sivu.agendamiento.domain;

/** Estados del flujo colaborativo de agendamiento estudiante ↔ docente. */
public enum EstadoAgendamiento {
    /** El estudiante propuso una fecha/hora dentro de una franja activa del tutor. */
    PROPUESTO,
    /** El docente aceptó la propuesta (estado intermedio opcional). */
    ACEPTADO,
    /** El docente rechazó la propuesta. */
    RECHAZADO,
    /** El docente propuso una nueva fecha/hora; el estudiante debe responder. */
    CONTRAOFERTA,
    /** Reunión confirmada; la disponibilidad queda OCUPADA. */
    CONFIRMADO,
    /** Reunión cancelada; libera la disponibilidad asociada. */
    CANCELADO
}
