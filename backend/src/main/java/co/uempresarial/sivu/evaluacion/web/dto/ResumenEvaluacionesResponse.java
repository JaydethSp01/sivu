package co.uempresarial.sivu.evaluacion.web.dto;

import java.math.BigDecimal;
import java.util.List;

public record ResumenEvaluacionesResponse(
    Long convenioId,
    int totalEvaluaciones,
    BigDecimal promedioCalificacion,
    BigDecimal promedioCompetenciasTecnicas,
    BigDecimal promedioCompetenciasBlandas,
    boolean tieneEvaluacionFinalAcademica,
    boolean tieneEvaluacionFinalEmpresarial,
    BigDecimal calificacionFinalSugerida,
    List<EvaluacionResponse> evaluaciones
) {}
