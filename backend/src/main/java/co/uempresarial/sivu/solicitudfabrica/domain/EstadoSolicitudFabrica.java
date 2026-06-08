package co.uempresarial.sivu.solicitudfabrica.domain;

/**
 * Estado de una solicitud del estudiante para ingresar al Programa Interno
 * (Fábrica de Soluciones).
 */
public enum EstadoSolicitudFabrica {
    PENDIENTE,
    APROBADA,
    /** APROBADA + Coformación ya eligió la vacante interna concreta y se creó la postulación. */
    ASIGNADA,
    RECHAZADA
}
