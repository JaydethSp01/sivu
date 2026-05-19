package co.uempresarial.sivu.solicitudfabrica.web.dto;

import co.uempresarial.sivu.solicitudfabrica.domain.EstadoSolicitudFabrica;

import java.time.OffsetDateTime;

public record SolicitudFabricaResponse(
    Long id,
    Long estudianteId,
    String estudianteNombreCompleto,
    String estudianteEmail,
    String programaAcademico,
    String motivo,
    EstadoSolicitudFabrica estado,
    String observacionesCoord,
    OffsetDateTime fechaSolicitud,
    OffsetDateTime fechaResolucion,
    String resueltoPorNombre,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {}
