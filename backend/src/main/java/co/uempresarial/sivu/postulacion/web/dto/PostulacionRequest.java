package co.uempresarial.sivu.postulacion.web.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record PostulacionRequest(
    @NotNull Long estudianteId,
    @NotNull Long vacanteId,
    @Size(max = 2000) String mensajeEstudiante
) {}
