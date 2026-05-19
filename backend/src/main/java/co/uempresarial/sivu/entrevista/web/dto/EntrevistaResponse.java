package co.uempresarial.sivu.entrevista.web.dto;

import co.uempresarial.sivu.entrevista.domain.ModalidadEntrevista;
import co.uempresarial.sivu.entrevista.domain.ResultadoEntrevista;

import java.time.OffsetDateTime;

public record EntrevistaResponse(
    Long id,
    Long postulacionId,
    String estudianteNombre,
    String empresaRazonSocial,
    String vacanteCargo,
    OffsetDateTime fechaProgramada,
    ModalidadEntrevista modalidad,
    String lugar,
    String enlaceVirtual,
    String entrevistadorNombre,
    String entrevistadorCargo,
    String observaciones,
    ResultadoEntrevista resultado,
    OffsetDateTime fechaResultado,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {}
