package co.uempresarial.sivu.solicitudfabrica.web.dto;

import jakarta.validation.constraints.NotNull;

public record AsignarProyectoRequest(
    @NotNull(message = "La vacante es obligatoria")
    Long vacanteId
) {}
