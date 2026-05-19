package co.uempresarial.sivu.evaluacion.web.dto;

import co.uempresarial.sivu.evaluacion.domain.Recomendacion;
import co.uempresarial.sivu.evaluacion.domain.TipoEvaluacion;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;

public record EvaluacionRequest(
    @NotNull Long convenioId,
    @NotNull Long tutorId,
    @NotNull TipoEvaluacion tipo,
    LocalDate fechaEvaluacion,
    @NotNull @DecimalMin("0.0") @DecimalMax("5.0") BigDecimal calificacion,
    @NotNull @DecimalMin("0.0") @DecimalMax("5.0") BigDecimal competenciasTecnicas,
    @NotNull @DecimalMin("0.0") @DecimalMax("5.0") BigDecimal competenciasBlandas,
    @NotNull Recomendacion recomendacion,
    @Size(max = 5000) String observaciones
) {}
