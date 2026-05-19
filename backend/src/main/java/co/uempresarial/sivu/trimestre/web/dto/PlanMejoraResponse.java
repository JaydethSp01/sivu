package co.uempresarial.sivu.trimestre.web.dto;

import co.uempresarial.sivu.trimestre.domain.EstadoPlanMejora;

import java.time.OffsetDateTime;

public record PlanMejoraResponse(
    Long id,
    Long trimestreId,
    Short numero,
    String titulo,
    String problema,
    String objetivo,
    String actividades,
    String indicadores,
    EstadoPlanMejora estado,
    Long documentoPdfId,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {}
