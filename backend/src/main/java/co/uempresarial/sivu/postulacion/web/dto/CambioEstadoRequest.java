package co.uempresarial.sivu.postulacion.web.dto;

import co.uempresarial.sivu.postulacion.domain.EstadoPostulacion;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CambioEstadoRequest(
    @NotNull EstadoPostulacion nuevoEstado,
    @Size(max = 2000) String observaciones
) {}
