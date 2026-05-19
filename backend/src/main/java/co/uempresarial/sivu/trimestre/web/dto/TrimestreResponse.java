package co.uempresarial.sivu.trimestre.web.dto;

import co.uempresarial.sivu.trimestre.domain.EstadoTrimestre;

import java.time.LocalDate;
import java.time.OffsetDateTime;

public record TrimestreResponse(
    Long id,
    Long convenioId,
    String convenioNumero,
    Short numero,
    String materiaNucleo,
    LocalDate fechaInicio,
    LocalDate fechaFin,
    EstadoTrimestre estado,
    boolean tienePlanActividades,
    long totalActas,
    long totalPlanesMejora,
    boolean tieneEvaluacionTutor,
    boolean tieneEvaluacionProfesor,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {}
