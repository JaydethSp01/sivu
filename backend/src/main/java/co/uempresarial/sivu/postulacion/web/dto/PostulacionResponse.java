package co.uempresarial.sivu.postulacion.web.dto;

import co.uempresarial.sivu.postulacion.domain.EstadoPostulacion;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record PostulacionResponse(
    Long id,
    Long estudianteId,
    String estudianteNombreCompleto,
    Long vacanteId,
    String vacanteTitulo,
    Long empresaId,
    String empresaRazonSocial,
    EstadoPostulacion estado,
    BigDecimal scoreMatching,
    String justificacionMatching,
    String mensajeEstudiante,
    String observacionesEmpresa,
    OffsetDateTime fechaPostulacion,
    OffsetDateTime fechaDecision,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {}
