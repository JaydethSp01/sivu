package co.uempresarial.sivu.automatizacion.service;

import co.uempresarial.sivu.estudiante.domain.Estudiante;
import co.uempresarial.sivu.plantilla.domain.EstadoRespuesta;
import co.uempresarial.sivu.plantilla.domain.RespuestaFormulario;
import co.uempresarial.sivu.plantilla.persistence.RespuestaFormularioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * Alertas automáticas por plazos — cierra el gap §6.2 del doc para
 * Coformación. Cada día revisa los formularios asignados cuya fecha
 * límite está próxima y notifica al estudiante por correo. El paso
 * "X" (días de anticipación) se configura por property.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AlertaPlazosService {

    private static final Set<EstadoRespuesta> ABIERTOS = Set.of(
        EstadoRespuesta.PENDIENTE, EstadoRespuesta.EN_PROGRESO);
    private static final DateTimeFormatter FECHA =
        DateTimeFormatter.ofPattern("d 'de' MMMM 'de' yyyy", new Locale("es", "CO"));

    private final RespuestaFormularioRepository respuestaRepository;
    private final NotificacionService notificacionService;

    @Value("${app.alertas.plazos.dias-anticipacion:3}")
    private int diasAnticipacion;

    @Value("${app.alertas.plazos.enabled:true}")
    private boolean habilitado;

    /**
     * Job diario 8 AM. Recorre los formularios próximos a vencer
     * (fecha límite entre HOY y HOY + diasAnticipacion) y manda email.
     * Idempotente en el día: si se ejecuta dos veces se mandan dos correos
     * (mejor cubrir de más que de menos para la entrega académica).
     */
    @Scheduled(cron = "${app.alertas.plazos.cron:0 0 8 * * *}")
    @Transactional(readOnly = true)
    public void ejecutarDiario() {
        if (!habilitado) {
            log.info("[AlertaPlazos] deshabilitado por configuración");
            return;
        }
        ResultadoAlertas r = enviarAlertasPendientes();
        log.info("[AlertaPlazos] revisados={}, notificados={}, sinEmail={}",
            r.revisados(), r.notificados(), r.sinEmail());
    }

    /** Endpoint manual para que Coformación dispare el job ahora mismo. */
    @Transactional(readOnly = true)
    public ResultadoAlertas enviarAlertasPendientes() {
        LocalDate hoy = LocalDate.now();
        LocalDate corte = hoy.plusDays(diasAnticipacion);

        List<RespuestaFormulario> formularios = respuestaRepository.findProximosAVencer(hoy, corte, ABIERTOS);
        int notificados = 0;
        int sinEmail = 0;

        for (RespuestaFormulario r : formularios) {
            Estudiante est = r.getEstudiante();
            String email = est != null ? est.getEmail() : null;
            if (email == null || email.isBlank()) {
                sinEmail++;
                continue;
            }
            long diasRestantes = java.time.temporal.ChronoUnit.DAYS.between(hoy, r.getFechaLimite());
            String urgencia = diasRestantes <= 0 ? "hoy mismo"
                : diasRestantes == 1 ? "mañana"
                : "en " + diasRestantes + " días";
            String nombrePlantilla = r.getPlantilla() != null ? r.getPlantilla().getNombre() : "tu formulario";
            String cuerpo = "Hola " + est.getNombres() + ",\n\n"
                + "Te recordamos que tu formulario \"" + nombrePlantilla + "\" vence "
                + urgencia + " (" + r.getFechaLimite().format(FECHA) + ").\n\n"
                + "Estado actual: " + r.getEstado() + ".\n\n"
                + "Por favor ingresa al portal SIVU y complétalo a tiempo.\n\nEquipo SIVU";
            notificacionService.enviarTexto(email,
                "[SIVU] Recordatorio: tu formulario vence " + urgencia, cuerpo);
            notificados++;
        }
        return new ResultadoAlertas(formularios.size(), notificados, sinEmail);
    }

    public record ResultadoAlertas(int revisados, int notificados, int sinEmail) {}
}
