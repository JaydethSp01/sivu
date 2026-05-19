package co.uempresarial.sivu.hojavida.domain;

/**
 * Ciclo de validación de la Hoja de Vida por la Oficina de Coformación:
 *   BORRADOR  → el estudiante la sigue editando
 *   ENVIADA   → enviada a Coformación, en espera de revisión
 *   APROBADA  → habilita postularse a vacantes
 *   RECHAZADA → el estudiante debe ajustarla y reenviarla
 */
public enum EstadoHojaVida {
    BORRADOR,
    ENVIADA,
    APROBADA,
    RECHAZADA
}
