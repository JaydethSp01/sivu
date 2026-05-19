package co.uempresarial.sivu.trimestre.web.dto;

import co.uempresarial.sivu.trimestre.domain.EstadoPlanMejora;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record PlanMejoraRequest(
    @NotNull @Min(1) @Max(2) Short numero,
    @NotBlank String titulo,
    String problema,
    String objetivo,
    String actividades,
    String indicadores,
    EstadoPlanMejora estado
) {}
