package co.uempresarial.sivu.trimestre.web.dto;

import co.uempresarial.sivu.tutoracceso.domain.PropositoTokenTutor;

/**
 * Respuesta del acceso externo del tutor (sin cuenta institucional): combina el
 * contexto validado del token con la evaluación actual del trimestre.
 */
public record EvaluacionTutorExternoResponse(
    Long tutorId,
    Long convenioId,
    PropositoTokenTutor proposito,
    EvaluacionTutorResponse evaluacion
) {}
