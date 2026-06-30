package co.uempresarial.sivu.trimestre.web.dto;

import co.uempresarial.sivu.trimestre.domain.PlanActividadesComentario;
import co.uempresarial.sivu.trimestre.domain.PlanActividadesComentario.TipoComentarioPlan;

import java.time.OffsetDateTime;

public record PlanActividadesComentarioResponse(
    Long id,
    Long planActividadesId,
    String autorNombre,
    String autorRol,
    TipoComentarioPlan tipo,
    String mensaje,
    OffsetDateTime createdAt
) {
    public static PlanActividadesComentarioResponse from(PlanActividadesComentario c) {
        return new PlanActividadesComentarioResponse(
            c.getId(),
            c.getPlanActividadesId(),
            c.getAutorNombre(),
            c.getAutorRol(),
            c.getTipo(),
            c.getMensaje(),
            c.getCreatedAt());
    }
}
