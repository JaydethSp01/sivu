package co.uempresarial.sivu.trimestre.web.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * GAC-FM-1 v3 — evaluación del profesor en dos cortes.
 * Cada corte aporta 25% del total del proceso (50% combinado).
 *
 * Los campos sin sufijo (capacidades, actitudes...) representan el
 * <strong>corte 1</strong> por compatibilidad con escrituras viejas;
 * los nuevos clientes deben usar los campos {@code *C2} para el 2° corte.
 */
public record EvaluacionProfesorRequest(
    // Corte 1
    @DecimalMin("0.0") @DecimalMax("5.0") BigDecimal capacidades,
    @DecimalMin("0.0") @DecimalMax("5.0") BigDecimal actitudes,
    @DecimalMin("0.0") @DecimalMax("5.0") BigDecimal aplicacionDesempeno,
    @DecimalMin("0.0") @DecimalMax("5.0") BigDecimal aplicacionElaboracionPem,
    @DecimalMin("0.0") @DecimalMax("5.0") BigDecimal aplicacionSustentacionPem,
    String observacionesC1,
    LocalDate fechaC1,

    // Corte 2
    @DecimalMin("0.0") @DecimalMax("5.0") BigDecimal capacidadesC2,
    @DecimalMin("0.0") @DecimalMax("5.0") BigDecimal actitudesC2,
    @DecimalMin("0.0") @DecimalMax("5.0") BigDecimal aplicacionDesempenoC2,
    @DecimalMin("0.0") @DecimalMax("5.0") BigDecimal aplicacionElaboracionPemC2,
    @DecimalMin("0.0") @DecimalMax("5.0") BigDecimal aplicacionSustentacionPemC2,
    String observacionesC2,
    LocalDate fechaC2,

    // Legacy: mantiene compatibilidad con clientes que solo enviaban un campo
    String observaciones,
    LocalDate fechaElaboracion
) {}
