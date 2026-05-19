package co.uempresarial.sivu.cohorte.web.dto;

import co.uempresarial.sivu.cohorte.domain.EstadoCohorteEstudiante;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record CohorteEstudianteResponse(
    Long id,
    Long cohorteId,
    String semestreAcademico,
    Long estudianteId,
    String estudianteNombreCompleto,
    String estudianteEmail,
    String programaAcademico,
    Short semestre,
    Short creditosAprobados,
    BigDecimal promedioAcumulado,
    EstadoCohorteEstudiante estado,
    String observaciones,
    OffsetDateTime fechaInscripcion,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {}
