package co.uempresarial.sivu.tutoracceso.web.dto;

import co.uempresarial.sivu.tutoracceso.domain.PropositoTokenTutor;

import java.time.OffsetDateTime;

/** Token emitido (incluye el valor del token para construir el enlace). */
public record TokenAccesoResponse(
    Long id,
    Long tutorId,
    Long convenioId,
    String token,
    PropositoTokenTutor proposito,
    OffsetDateTime expiraEn,
    boolean usado
) {}
