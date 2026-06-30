package co.uempresarial.sivu.informefinalpm.web.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

/** BI-07 / RF-A04 — Registro de una nota individual (tutor o profesor) del Informe Final. */
public record RegistrarNotaRequest(
    @NotNull(message = "La nota es obligatoria")
    @DecimalMin(value = "0.0", message = "La nota mínima es 0.0")
    @DecimalMax(value = "5.0", message = "La nota máxima es 5.0")
    BigDecimal nota
) {}
