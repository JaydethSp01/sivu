package co.uempresarial.sivu.entrevista.web.dto;

import co.uempresarial.sivu.entrevista.domain.ModalidadEntrevista;
import jakarta.validation.constraints.NotNull;

import java.time.OffsetDateTime;

public record EntrevistaRequest(
    @NotNull Long postulacionId,
    @NotNull OffsetDateTime fechaProgramada,
    @NotNull ModalidadEntrevista modalidad,
    String lugar,
    String enlaceVirtual,
    String entrevistadorNombre,
    String entrevistadorCargo,
    String observaciones
) {}
