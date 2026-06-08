package co.uempresarial.sivu.documento.domain;

import java.time.LocalDate;

/**
 * Estado de vigencia derivado de las fechas de inicio/fin del documento.
 * No se persiste: se calcula on-the-fly contra la fecha actual.
 *
 * Ejemplo motivador: dos documentos EPS subidos por el estudiante; uno
 * vence hoy ({@code VENCIDO}) y otro vence en 6 meses ({@code ACTIVO}).
 */
public enum EstadoVigencia {
    SIN_VIGENCIA,
    ACTIVO,
    POR_VENCER,
    VENCIDO;

    /** Umbral de "por vencer" en días antes de la fecha fin. */
    public static final int DIAS_POR_VENCER = 30;

    public static EstadoVigencia calcular(LocalDate inicio, LocalDate fin) {
        LocalDate hoy = LocalDate.now();
        if (fin == null && inicio == null) return SIN_VIGENCIA;
        if (inicio != null && hoy.isBefore(inicio)) return ACTIVO;
        if (fin == null) return ACTIVO;
        if (hoy.isAfter(fin)) return VENCIDO;
        long diasRestantes = java.time.temporal.ChronoUnit.DAYS.between(hoy, fin);
        if (diasRestantes <= DIAS_POR_VENCER) return POR_VENCER;
        return ACTIVO;
    }
}
