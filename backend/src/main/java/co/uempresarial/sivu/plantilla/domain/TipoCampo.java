package co.uempresarial.sivu.plantilla.domain;

/**
 * Tipo de valor que captura un criterio en el formulario dinámico.
 *
 * NUMBER     — Calificación 0–5 (suele tener peso para nota ponderada)
 * TEXT       — Texto libre / observaciones
 * BOOL       — Verdadero/Falso (SI/NO)
 * DATE       — Fecha
 * SELECT     — Combo con valores predefinidos en opciones (CSV)
 * SIGNATURE  — Firma electrónica (booleana firmado + nombre del firmante)
 */
public enum TipoCampo {
    NUMBER,
    TEXT,
    BOOL,
    DATE,
    SELECT,
    SIGNATURE
}
