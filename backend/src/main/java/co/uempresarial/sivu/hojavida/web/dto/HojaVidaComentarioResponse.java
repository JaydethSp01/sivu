package co.uempresarial.sivu.hojavida.web.dto;

import co.uempresarial.sivu.hojavida.domain.HojaVidaComentario;

import java.time.OffsetDateTime;

public record HojaVidaComentarioResponse(
    Long id,
    Long hojaVidaId,
    String autorNombre,
    HojaVidaComentario.AutorRol autorRol,
    HojaVidaComentario.TipoComentario tipo,
    String mensaje,
    OffsetDateTime createdAt
) {
    public static HojaVidaComentarioResponse from(HojaVidaComentario c) {
        return new HojaVidaComentarioResponse(
            c.getId(),
            c.getHojaVidaId(),
            c.getAutorNombre(),
            c.getAutorRol(),
            c.getTipo(),
            c.getMensaje(),
            c.getCreatedAt());
    }
}
