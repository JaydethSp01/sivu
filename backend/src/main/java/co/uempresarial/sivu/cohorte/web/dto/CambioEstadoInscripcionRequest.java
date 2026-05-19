package co.uempresarial.sivu.cohorte.web.dto;

import co.uempresarial.sivu.cohorte.domain.EstadoCohorteEstudiante;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CambioEstadoInscripcionRequest(
    @NotNull EstadoCohorteEstudiante nuevoEstado,
    @Size(max = 2000) String observaciones
) {}
