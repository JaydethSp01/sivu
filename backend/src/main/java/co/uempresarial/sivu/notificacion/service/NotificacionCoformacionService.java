package co.uempresarial.sivu.notificacion.service;

import co.uempresarial.sivu.automatizacion.service.NotificacionService;
import co.uempresarial.sivu.notificacion.domain.NotificacionAuditoria;
import co.uempresarial.sivu.notificacion.domain.TipoEventoNotificacion;
import co.uempresarial.sivu.notificacion.persistence.NotificacionAuditoriaRepository;
import co.uempresarial.sivu.notificacion.web.dto.NotificacionAuditoriaResponse;
import co.uempresarial.sivu.shared.pagination.PageResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

/**
 * Capa de notificaciones de dominio para el flujo documental y de agendamiento
 * de co-formación (BI-01 / RF-D01-D02).
 *
 * <p>Envuelve el {@link NotificacionService} de correo existente, construye los
 * mensajes en español por tipo de evento y registra CADA intento en
 * {@link NotificacionAuditoria} (éxito o fallo). Es aditiva: ningún flujo
 * existente cambia, otros módulos pueden delegar aquí cuando lo necesiten.
 *
 * <p>Es <b>graceful</b>: si el correo o la auditoría fallan, se registra un WARN
 * y nunca se propaga la excepción al llamador (no debe tumbar el flujo de negocio).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificacionCoformacionService {

    private final NotificacionService notificacionService;
    private final NotificacionAuditoriaRepository auditoriaRepository;

    public static final String REF_POSTULACION = "POSTULACION";
    public static final String REF_CONVENIO = "CONVENIO";
    public static final String REF_TRIMESTRE = "TRIMESTRE";

    // ------------------------------------------------------------------
    // Flujo documental / académico
    // ------------------------------------------------------------------

    public void notificarPlanEnviado(String estudianteEmail,
                                     String docenteEmail,
                                     String tutorEmail,
                                     String nombreEstudiante,
                                     String trimestre,
                                     String referenciaTipo,
                                     Long referenciaId) {
        String asunto = "[SIVU] Plan de trabajo del trimestre %s enviado".formatted(trimestre);
        String cuerpo = """
            Hola,

            El estudiante %s ha enviado el plan de trabajo correspondiente al trimestre %s.
            Queda disponible en el portal SIVU para su revisión y aprobación.

            Equipo SIVU - Universidad Empresarial
            """.formatted(nombreEstudiante, trimestre);
        enviarYRegistrar(TipoEventoNotificacion.PLAN_ENVIADO, estudianteEmail, asunto, cuerpo, referenciaTipo, referenciaId);
        enviarYRegistrar(TipoEventoNotificacion.PLAN_ENVIADO, docenteEmail, asunto, cuerpo, referenciaTipo, referenciaId);
        enviarYRegistrar(TipoEventoNotificacion.PLAN_ENVIADO, tutorEmail, asunto, cuerpo, referenciaTipo, referenciaId);
    }

    public void notificarCorteCalificado(String estudianteEmail,
                                         String nombreEstudiante,
                                         String corte,
                                         String nota,
                                         String referenciaTipo,
                                         Long referenciaId) {
        String asunto = "[SIVU] Tu corte %s fue calificado".formatted(corte);
        String cuerpo = """
            Hola %s,

            Tu evaluación del corte %s ya fue calificada.
            Nota obtenida: %s / 5.00

            Consulta el detalle en el portal SIVU.

            Equipo SIVU - Universidad Empresarial
            """.formatted(nombreEstudiante, corte, nota);
        enviarYRegistrar(TipoEventoNotificacion.CORTE_CALIFICADO, estudianteEmail, asunto, cuerpo, referenciaTipo, referenciaId);
    }

    public void notificarDocumentoFirmado(String email,
                                          String nombreDestinatario,
                                          String documento,
                                          String referenciaTipo,
                                          Long referenciaId) {
        String asunto = "[SIVU] El documento \"%s\" fue firmado".formatted(documento);
        String cuerpo = """
            Hola %s,

            Te confirmamos que el documento "%s" ya fue firmado y quedó registrado
            en el portal SIVU.

            Equipo SIVU - Universidad Empresarial
            """.formatted(nombreDestinatario, documento);
        enviarYRegistrar(TipoEventoNotificacion.DOCUMENTO_FIRMADO, email, asunto, cuerpo, referenciaTipo, referenciaId);
    }

    public void notificarExpedienteCompleto(String coformacionEmail,
                                            String estudiante,
                                            String corte,
                                            String referenciaTipo,
                                            Long referenciaId) {
        String asunto = "[SIVU] Expediente completo de %s (%s)".formatted(estudiante, corte);
        String cuerpo = """
            Hola equipo de Co-formación,

            El expediente del estudiante %s correspondiente al %s está completo:
            todos los documentos y evaluaciones requeridos han sido registrados.

            Puede proceder con el cierre/validación en el portal SIVU.

            Equipo SIVU - Universidad Empresarial
            """.formatted(estudiante, corte);
        enviarYRegistrar(TipoEventoNotificacion.EXPEDIENTE_COMPLETO, coformacionEmail, asunto, cuerpo, referenciaTipo, referenciaId);
    }

    public void notificarRecordatorioCierre(String email,
                                            String nombreDestinatario,
                                            String detalle,
                                            String referenciaTipo,
                                            Long referenciaId) {
        String asunto = "[SIVU] Recordatorio: cierre próximo";
        String cuerpo = """
            Hola %s,

            Te recordamos que se aproxima el cierre del proceso.
            %s

            Por favor completa las acciones pendientes en el portal SIVU.

            Equipo SIVU - Universidad Empresarial
            """.formatted(nombreDestinatario, detalle == null ? "" : detalle);
        enviarYRegistrar(TipoEventoNotificacion.RECORDATORIO_CIERRE, email, asunto, cuerpo, referenciaTipo, referenciaId);
    }

    // ------------------------------------------------------------------
    // Flujo de agendamiento de reuniones
    // ------------------------------------------------------------------

    public void notificarReunionPropuesta(String email,
                                          String nombreDestinatario,
                                          String fechaHora,
                                          String modalidad,
                                          String referenciaTipo,
                                          Long referenciaId) {
        String asunto = "[SIVU] Nueva reunión propuesta";
        String cuerpo = """
            Hola %s,

            Se ha propuesto una reunión:
            Fecha y hora: %s
            Modalidad: %s

            Ingresa al portal SIVU para confirmar o reprogramar.

            Equipo SIVU - Universidad Empresarial
            """.formatted(nombreDestinatario, fechaHora, modalidad);
        enviarYRegistrar(TipoEventoNotificacion.REUNION_PROPUESTA, email, asunto, cuerpo, referenciaTipo, referenciaId);
    }

    public void notificarReunionConfirmada(String email,
                                           String nombreDestinatario,
                                           String fechaHora,
                                           String modalidad,
                                           String referenciaTipo,
                                           Long referenciaId) {
        String asunto = "[SIVU] Reunión confirmada";
        String cuerpo = """
            Hola %s,

            Tu reunión ha sido confirmada:
            Fecha y hora: %s
            Modalidad: %s

            Equipo SIVU - Universidad Empresarial
            """.formatted(nombreDestinatario, fechaHora, modalidad);
        enviarYRegistrar(TipoEventoNotificacion.REUNION_CONFIRMADA, email, asunto, cuerpo, referenciaTipo, referenciaId);
    }

    public void notificarReunionCancelada(String email,
                                          String nombreDestinatario,
                                          String fechaHora,
                                          String motivo,
                                          String referenciaTipo,
                                          Long referenciaId) {
        String asunto = "[SIVU] Reunión cancelada";
        String cuerpo = """
            Hola %s,

            La reunión programada para %s ha sido cancelada.
            %s

            Puedes proponer una nueva fecha en el portal SIVU.

            Equipo SIVU - Universidad Empresarial
            """.formatted(nombreDestinatario, fechaHora,
                motivo == null || motivo.isBlank() ? "" : "Motivo: " + motivo);
        enviarYRegistrar(TipoEventoNotificacion.REUNION_CANCELADA, email, asunto, cuerpo, referenciaTipo, referenciaId);
    }

    public void notificarRecordatorioReunion(String email,
                                             String nombreDestinatario,
                                             String fechaHora,
                                             String modalidad,
                                             String referenciaTipo,
                                             Long referenciaId) {
        String asunto = "[SIVU] Recordatorio: reunión próxima";
        String cuerpo = """
            Hola %s,

            Te recordamos que tienes una reunión próxima:
            Fecha y hora: %s
            Modalidad: %s

            Equipo SIVU - Universidad Empresarial
            """.formatted(nombreDestinatario, fechaHora, modalidad);
        enviarYRegistrar(TipoEventoNotificacion.RECORDATORIO_REUNION, email, asunto, cuerpo, referenciaTipo, referenciaId);
    }

    // ------------------------------------------------------------------
    // Consulta de auditoría (Co-formación)
    // ------------------------------------------------------------------

    public PageResponse<NotificacionAuditoriaResponse> listarAuditoria(String destinatario,
                                                                       TipoEventoNotificacion tipoEvento,
                                                                       Pageable pageable) {
        String filtro = destinatario == null || destinatario.isBlank() ? null : destinatario.trim();
        return PageResponse.of(
            auditoriaRepository.buscar(filtro, tipoEvento, pageable)
                .map(NotificacionAuditoriaResponse::from));
    }

    // ------------------------------------------------------------------
    // Núcleo: envío + auditoría (graceful, idempotente)
    // ------------------------------------------------------------------

    private void enviarYRegistrar(TipoEventoNotificacion tipoEvento,
                                    String destinatario,
                                    String asunto,
                                    String cuerpo,
                                    String referenciaTipo,
                                    Long referenciaId) {
        if (destinatario == null || destinatario.isBlank()) {
            return;
        }

        // Idempotencia básica: no reenviar el mismo evento ya confirmado para la
        // misma referencia de dominio.
        if (referenciaTipo != null && referenciaId != null) {
            try {
                if (auditoriaRepository.existsByReferenciaTipoAndReferenciaIdAndTipoEventoAndEnviadoExitosoTrue(
                        referenciaTipo, referenciaId, tipoEvento)) {
                    log.info("Notificación {} para {}#{} ya registrada con éxito; se omite",
                        tipoEvento, referenciaTipo, referenciaId);
                    return;
                }
            } catch (Exception ex) {
                log.warn("No se pudo verificar idempotencia de notificación {}: {}", tipoEvento, ex.getMessage());
            }
        }

        boolean exito = false;
        String error = null;
        try {
            notificacionService.enviarTexto(destinatario, asunto, cuerpo);
            exito = true;
        } catch (Exception ex) {
            error = ex.getMessage();
            log.warn("Falló el despacho de la notificación {} a {}: {}", tipoEvento, destinatario, error);
        }

        try {
            auditoriaRepository.save(NotificacionAuditoria.builder()
                .tipoEvento(tipoEvento)
                .destinatarioEmail(destinatario)
                .asunto(asunto)
                .enviadoExitoso(exito)
                .error(error != null && error.length() > 1000 ? error.substring(0, 1000) : error)
                .referenciaTipo(referenciaTipo)
                .referenciaId(referenciaId)
                .build());
        } catch (Exception ex) {
            log.warn("No se pudo registrar la auditoría de notificación {} a {}: {}",
                tipoEvento, destinatario, ex.getMessage());
        }
    }
}
