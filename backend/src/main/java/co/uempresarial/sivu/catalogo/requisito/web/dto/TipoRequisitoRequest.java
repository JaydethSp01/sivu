package co.uempresarial.sivu.catalogo.requisito.web.dto;

import co.uempresarial.sivu.catalogo.requisito.domain.AplicaA;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record TipoRequisitoRequest(
    @NotBlank @Size(max = 60) String codigo,
    @NotBlank @Size(max = 160) String nombre,
    String descripcion,
    @NotNull AplicaA aplicaA,
    Boolean activo
) {}
