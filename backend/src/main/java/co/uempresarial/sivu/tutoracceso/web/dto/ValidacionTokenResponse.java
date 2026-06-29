package co.uempresarial.sivu.tutoracceso.web.dto;

import co.uempresarial.sivu.tutoracceso.domain.PropositoTokenTutor;

/** Resultado de validar un token de acceso externo del tutor. */
public record ValidacionTokenResponse(
    boolean valido,
    Long tutorId,
    Long convenioId,
    PropositoTokenTutor proposito
) {}
