package co.uempresarial.sivu.evaluacion.web.dto;

import co.uempresarial.sivu.evaluacion.domain.Recomendacion;
import co.uempresarial.sivu.evaluacion.domain.TipoEvaluacion;
import co.uempresarial.sivu.tutor.domain.TipoTutor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public record EvaluacionResponse(
    Long id,
    Long convenioId,
    String convenioNumero,
    Long tutorId,
    String tutorNombre,
    TipoEvaluacion tipo,
    TipoTutor evaluadorTipo,
    LocalDate fechaEvaluacion,
    BigDecimal calificacion,
    BigDecimal competenciasTecnicas,
    BigDecimal competenciasBlandas,
    Recomendacion recomendacion,
    String observaciones,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {}
