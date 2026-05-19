package co.uempresarial.sivu.catalogo.modalidad.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ModalidadRequest(
    @NotBlank @Size(max = 60) String codigo,
    @NotBlank @Size(max = 160) String nombre,
    String descripcion,
    Boolean activo
) {}
