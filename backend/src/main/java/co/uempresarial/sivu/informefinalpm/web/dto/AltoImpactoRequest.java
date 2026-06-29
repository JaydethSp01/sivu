package co.uempresarial.sivu.informefinalpm.web.dto;

import jakarta.validation.constraints.NotNull;

/** BI-07 / RF-A04 — Marca de "Alto Impacto" del Informe Final (la fija el coordinador/admin). */
public record AltoImpactoRequest(
    @NotNull(message = "El valor de alto impacto es obligatorio")
    Boolean altoImpacto
) {}
