package co.uempresarial.sivu.agendamiento.domain;

/** Estado de una franja de disponibilidad del docente/tutor. */
public enum EstadoDisponibilidad {
    /** Disponible para que un estudiante proponga una reunión. */
    ACTIVA,
    /** Reservada por una reunión confirmada. */
    OCUPADA,
    /** Anulada por el docente; ya no es agendable. */
    CANCELADA
}
