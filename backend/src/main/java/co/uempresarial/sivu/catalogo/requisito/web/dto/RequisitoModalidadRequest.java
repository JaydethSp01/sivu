package co.uempresarial.sivu.catalogo.requisito.web.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record RequisitoModalidadRequest(
    @NotNull Long modalidadId,
    @NotNull Long tipoRequisitoId,
    Boolean obligatorio,
    @Min(0) Short orden,
    String instrucciones
) {}
