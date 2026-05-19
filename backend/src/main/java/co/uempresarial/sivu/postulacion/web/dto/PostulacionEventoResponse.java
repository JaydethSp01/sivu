package co.uempresarial.sivu.postulacion.web.dto;

import co.uempresarial.sivu.postulacion.domain.EstadoPostulacion;

import java.time.OffsetDateTime;

public record PostulacionEventoResponse(
    Long id,
    Long postulacionId,
    String tipoEvento,
    EstadoPostulacion estadoAnterior,
    EstadoPostulacion estadoNuevo,
    String detalle,
    String actor,
    OffsetDateTime ocurridoEn
) {}
