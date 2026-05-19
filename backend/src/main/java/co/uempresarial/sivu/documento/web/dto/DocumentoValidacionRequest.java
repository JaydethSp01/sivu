package co.uempresarial.sivu.documento.web.dto;

import jakarta.validation.constraints.NotNull;

public record DocumentoValidacionRequest(
    @NotNull Boolean validar,
    String observaciones
) {}
