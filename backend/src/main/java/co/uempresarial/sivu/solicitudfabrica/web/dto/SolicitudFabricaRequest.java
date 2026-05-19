package co.uempresarial.sivu.solicitudfabrica.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SolicitudFabricaRequest(
    @NotBlank
    @Size(min = 20, max = 2000,
        message = "Cuéntanos en al menos 20 caracteres por qué necesitas entrar al programa interno")
    String motivo
) {}
