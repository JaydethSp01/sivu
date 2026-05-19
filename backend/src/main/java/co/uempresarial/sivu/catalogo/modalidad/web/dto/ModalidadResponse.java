package co.uempresarial.sivu.catalogo.modalidad.web.dto;

import java.time.OffsetDateTime;

public record ModalidadResponse(
    Long id,
    String codigo,
    String nombre,
    String descripcion,
    Boolean activo,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {}
