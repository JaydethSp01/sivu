package co.uempresarial.sivu.automatizacion.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificacionService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String from;

    @Value("${app.mail.enabled:true}")
    private boolean enabled;

    @Async("notificacionExecutor")
    public void enviarCambioEstadoPostulacion(String destinatario,
                                              String nombreDestinatario,
                                              String tituloVacante,
                                              String empresa,
                                              String estadoNuevo,
                                              String observaciones) {
        if (!enabled) {
            log.info("[NOTIFICACIONES DESHABILITADAS] No se envía email a {}", destinatario);
            return;
        }
        String asunto = "[SIVU] Tu postulación a \"%s\" cambió a %s".formatted(tituloVacante, estadoNuevo);
        String cuerpo = """
            Hola %s,

            Te informamos que tu postulación a la vacante "%s" de la empresa %s
            ha cambiado de estado a: %s

            %s

            Puedes consultar el detalle en el portal SIVU.

            Equipo SIVU - Universidad Empresarial
            """.formatted(
                nombreDestinatario,
                tituloVacante,
                empresa,
                estadoNuevo,
                observaciones == null || observaciones.isBlank() ? "" : "Observaciones: " + observaciones);

        enviar(destinatario, asunto, cuerpo);
    }

    @Async("notificacionExecutor")
    public void enviarRecordatorioActualizarCv(String destinatario, String nombreDestinatario) {
        if (!enabled) return;
        String asunto = "[SIVU] Tu próxima práctica se acerca — actualiza tu CV";
        String cuerpo = """
            Hola %s,

            Detectamos que estás próximo(a) a iniciar tu práctica profesional pero
            aún no tienes la Hoja de Vida institucional completa.

            Por favor ingresa al portal SIVU, ve a "Mi Hoja de Vida" y completa tu
            perfil (SABER / HACER / SER), habilidades, idiomas, educación y experiencia.

            Cuando esté completa, el sistema podrá generarte automáticamente tu HV
            en el formato Uniempresarial y la considerará cumplida en el checklist
            de requisitos para postular.

            Equipo SIVU - Universidad Empresarial
            """.formatted(nombreDestinatario);
        enviar(destinatario, asunto, cuerpo);
    }

    @Async("notificacionExecutor")
    public void enviarValidacionDocumento(String destinatario,
                                          String nombreDestinatario,
                                          String tipoDocumento,
                                          boolean aprobado,
                                          String observaciones) {
        if (!enabled) return;
        String estado = aprobado ? "VALIDADO" : "RECHAZADO";
        String asunto = "[SIVU] Tu documento %s fue %s".formatted(tipoDocumento, estado);
        String cuerpo = """
            Hola %s,

            Tu documento "%s" fue %s por el equipo de prácticas.

            %s

            Equipo SIVU
            """.formatted(
                nombreDestinatario,
                tipoDocumento,
                estado,
                observaciones == null || observaciones.isBlank() ? "" : "Observaciones: " + observaciones);
        enviar(destinatario, asunto, cuerpo);
    }

    @Async("notificacionExecutor")
    public void enviarCertificadoEmitido(String destinatario,
                                         String nombreDestinatario,
                                         String numeroConvenio,
                                         String calificacionFinal) {
        if (!enabled) return;
        String asunto = "[SIVU] Tu certificado de práctica %s está disponible".formatted(numeroConvenio);
        String cuerpo = """
            Hola %s,

            ¡Felicitaciones! Hemos emitido tu certificado oficial de práctica profesional.
            Convenio: %s
            Calificación final obtenida: %s / 5.00

            Ingresa al portal SIVU para descargarlo.

            Equipo SIVU - Universidad Empresarial
            """.formatted(nombreDestinatario, numeroConvenio, calificacionFinal);
        enviar(destinatario, asunto, cuerpo);
    }

    @Async("notificacionExecutor")
    public void enviarFormalizacion(String destinatario,
                                    String nombreDestinatario,
                                    String numeroConvenio,
                                    String empresa) {
        if (!enabled) return;
        String asunto = "[SIVU] Tu convenio de práctica %s está listo para firma".formatted(numeroConvenio);
        String cuerpo = """
            Hola %s,

            Hemos generado el documento de formalización de tu práctica con %s.
            Número de convenio: %s.

            Por favor revísalo en el portal SIVU y procede con la firma.

            Equipo SIVU
            """.formatted(nombreDestinatario, empresa, numeroConvenio);
        enviar(destinatario, asunto, cuerpo);
    }

    /**
     * Envío genérico para features que no tienen una plantilla específica
     * (ej. entrevista programada, HV aprobada, carta de presentación).
     */
    @Async("notificacionExecutor")
    public void enviarTexto(String destinatario, String asunto, String cuerpo) {
        if (!enabled) {
            log.info("[NOTIFICACIONES DESHABILITADAS] No se envía email a {}", destinatario);
            return;
        }
        enviar(destinatario, asunto, cuerpo);
    }

    private void enviar(String to, String subject, String body) {
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(from);
            msg.setTo(to);
            msg.setSubject(subject);
            msg.setText(body);
            mailSender.send(msg);
            log.info("Email enviado a {} | {}", to, subject);
        } catch (Exception ex) {
            log.warn("No se pudo enviar email a {}: {}", to, ex.getMessage());
        }
    }
}
