package co.uempresarial.sivu.solicitudfabrica.web.dto;

import jakarta.validation.constraints.Size;

public record ResolverSolicitudRequest(
    @Size(max = 2000)
    String observaciones
) {}
