package co.uempresarial.sivu.trimestre.web.dto;

import co.uempresarial.sivu.trimestre.domain.EstadoTrimestre;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record TrimestreRequest(
    @NotNull @Min(1) @Max(3) Short numero,
    @NotBlank String materiaNucleo,
    LocalDate fechaInicio,
    LocalDate fechaFin,
    EstadoTrimestre estado
) {}
