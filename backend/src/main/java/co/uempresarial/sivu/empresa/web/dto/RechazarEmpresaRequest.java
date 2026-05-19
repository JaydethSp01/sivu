package co.uempresarial.sivu.empresa.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RechazarEmpresaRequest(
    @NotBlank @Size(max = 2000) String motivo
) {}
