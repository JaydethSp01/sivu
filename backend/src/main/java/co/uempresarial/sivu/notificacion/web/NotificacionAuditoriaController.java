package co.uempresarial.sivu.notificacion.web;

import co.uempresarial.sivu.notificacion.domain.TipoEventoNotificacion;
import co.uempresarial.sivu.notificacion.service.NotificacionCoformacionService;
import co.uempresarial.sivu.notificacion.web.dto.NotificacionAuditoriaResponse;
import co.uempresarial.sivu.shared.pagination.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/notificaciones")
@RequiredArgsConstructor
@Tag(name = "Notificaciones", description = "Auditoría de notificaciones del flujo documental y de agendamiento (BI-01 / RF-D01-D02)")
public class NotificacionAuditoriaController {

    private final NotificacionCoformacionService service;

    @GetMapping("/auditoria")
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR')")
    @Operation(summary = "Listar la auditoría de notificaciones con filtros básicos (destinatario, tipo de evento)")
    public ResponseEntity<PageResponse<NotificacionAuditoriaResponse>> listarAuditoria(
        @RequestParam(required = false) String destinatario,
        @RequestParam(required = false) TipoEventoNotificacion tipoEvento,
        @ParameterObject Pageable pageable) {
        return ResponseEntity.ok(service.listarAuditoria(destinatario, tipoEvento, pageable));
    }
}
