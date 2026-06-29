package co.uempresarial.sivu.notificacion.web.dto;

import co.uempresarial.sivu.notificacion.domain.NotificacionAuditoria;
import co.uempresarial.sivu.notificacion.domain.TipoEventoNotificacion;

import java.time.OffsetDateTime;

public record NotificacionAuditoriaResponse(
    Long id,
    TipoEventoNotificacion tipoEvento,
    String destinatarioEmail,
    String asunto,
    boolean enviadoExitoso,
    String error,
    String referenciaTipo,
    Long referenciaId,
    OffsetDateTime createdAt
) {
    public static NotificacionAuditoriaResponse from(NotificacionAuditoria n) {
        return new NotificacionAuditoriaResponse(
            n.getId(),
            n.getTipoEvento(),
            n.getDestinatarioEmail(),
            n.getAsunto(),
            n.isEnviadoExitoso(),
            n.getError(),
            n.getReferenciaTipo(),
            n.getReferenciaId(),
            n.getCreatedAt());
    }
}
