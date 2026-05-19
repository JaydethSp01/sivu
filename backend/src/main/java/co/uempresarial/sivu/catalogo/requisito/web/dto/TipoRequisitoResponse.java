package co.uempresarial.sivu.catalogo.requisito.web.dto;

import co.uempresarial.sivu.catalogo.requisito.domain.AplicaA;

import java.time.OffsetDateTime;

public record TipoRequisitoResponse(
    Long id,
    String codigo,
    String nombre,
    String descripcion,
    AplicaA aplicaA,
    Boolean activo,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {}
