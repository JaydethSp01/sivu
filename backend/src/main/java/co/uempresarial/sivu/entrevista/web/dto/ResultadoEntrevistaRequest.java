package co.uempresarial.sivu.entrevista.web.dto;

import co.uempresarial.sivu.entrevista.domain.ResultadoEntrevista;
import jakarta.validation.constraints.NotNull;

public record ResultadoEntrevistaRequest(
    @NotNull ResultadoEntrevista resultado,
    String observaciones
) {}
