package co.uempresarial.sivu.tutoracceso.web.dto;

import co.uempresarial.sivu.tutoracceso.domain.PropositoTokenTutor;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/** Solicitud para emitir un token de acceso externo a un tutor. */
public record GenerarTokenRequest(
    @NotNull Long tutorId,
    Long convenioId,
    @NotNull PropositoTokenTutor proposito,
    @Positive Integer diasValidez
) {}
