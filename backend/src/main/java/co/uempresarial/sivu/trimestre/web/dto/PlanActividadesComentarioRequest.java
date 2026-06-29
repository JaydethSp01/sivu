package co.uempresarial.sivu.trimestre.web.dto;

import co.uempresarial.sivu.trimestre.domain.PlanActividadesComentario.TipoComentarioPlan;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record PlanActividadesComentarioRequest(
    @NotBlank(message = "El mensaje es obligatorio")
    @Size(max = 4000, message = "El mensaje no puede superar 4000 caracteres")
    String mensaje,

    @NotNull(message = "El tipo de comentario es obligatorio")
    TipoComentarioPlan tipo
) {}
