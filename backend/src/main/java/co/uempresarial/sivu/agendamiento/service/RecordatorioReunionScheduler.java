package co.uempresarial.sivu.agendamiento.service;

import co.uempresarial.sivu.agendamiento.domain.AgendamientoReunion;
import co.uempresarial.sivu.agendamiento.domain.EstadoAgendamiento;
import co.uempresarial.sivu.agendamiento.persistence.AgendamientoReunionRepository;
import co.uempresarial.sivu.estudiante.domain.Estudiante;
import co.uempresarial.sivu.estudiante.persistence.EstudianteRepository;
import co.uempresarial.sivu.notificacion.service.NotificacionCoformacionService;
import co.uempresarial.sivu.tutor.domain.Tutor;
import co.uempresarial.sivu.tutor.persistence.TutorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

/**
 * BI-11 / RF-D01: scheduler de recordatorios automáticos de reuniones próximas.
 *
 * <p>Cada hora revisa las reuniones en estado {@link EstadoAgendamiento#CONFIRMADO}
 * cuya fecha/hora cae dentro de las próximas 24 horas y que aún no tienen el
 * recordatorio enviado ({@code recordatorioEnviado = false}). Para cada una
 * notifica a estudiante y tutor reusando la capa de notificaciones de co-formación
 * y marca la reunión como recordada (idempotencia entre corridas del job).
 *
 * <p>Es <b>aditivo</b> y <b>graceful</b>: ningún flujo existente cambia y los fallos
 * de notificación/resolución se registran sin tumbar el job ni el resto del lote.
 *
 * <p>TODO (RF-D02 recordatorio "5 días antes del cierre del corte"): el modelo de
 * {@code Trimestre} actual no expone una fecha límite de cierre clara para el corte,
 * por lo que ese recordatorio se omite deliberadamente en lugar de inventar la fecha.
 * Cuando exista un campo de fecha límite de corte/trimestre se puede añadir aquí un
 * segundo barrido que use {@code notificarRecordatorioCierre(...)}.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RecordatorioReunionScheduler {

    private static final String REF_AGENDAMIENTO = "AGENDAMIENTO";
    private static final DateTimeFormatter FECHA_HORA =
        DateTimeFormatter.ofPattern("d 'de' MMMM 'de' yyyy 'a las' HH:mm", new Locale("es", "CO"));

    private final AgendamientoReunionRepository reunionRepository;
    private final EstudianteRepository estudianteRepository;
    private final TutorRepository tutorRepository;
    private final NotificacionCoformacionService notificacionCoformacionService;

    @Value("${app.recordatorios.reuniones.enabled:true}")
    private boolean habilitado;

    /**
     * Job horario. Recorre las reuniones CONFIRMADAS con inicio dentro de las
     * próximas 24h sin recordatorio enviado y despacha el aviso a estudiante y tutor.
     */
    @Scheduled(cron = "${app.recordatorios.reuniones.cron:0 0 * * * *}")
    public void ejecutarRecordatorios() {
        if (!habilitado) {
            log.info("[RecordatorioReunion] deshabilitado por configuración");
            return;
        }
        ResultadoRecordatorios r = enviarRecordatoriosProximos();
        log.info("[RecordatorioReunion] revisadas={}, recordadas={}, sinDestinatario={}",
            r.revisadas(), r.recordadas(), r.sinDestinatario());
    }

    /**
     * Núcleo reutilizable (job + disparo manual). Busca reuniones CONFIRMADAS cuyo
     * inicio (fecha + hora) esté entre ahora y ahora + 24h y aún no recordadas.
     */
    @Transactional
    public ResultadoRecordatorios enviarRecordatoriosProximos() {
        LocalDateTime ahora = LocalDateTime.now();
        LocalDateTime limite = ahora.plusHours(24);

        // El rango por fecha cubre hoy y mañana; el filtro fino por hora se aplica abajo.
        List<AgendamientoReunion> candidatas = reunionRepository
            .findByEstadoAndRecordatorioEnviadoFalseAndFechaPropuestaBetween(
                EstadoAgendamiento.CONFIRMADO, ahora.toLocalDate(), limite.toLocalDate());

        int recordadas = 0;
        int sinDestinatario = 0;
        int revisadas = 0;

        for (AgendamientoReunion reunion : candidatas) {
            LocalDateTime inicio = LocalDateTime.of(reunion.getFechaPropuesta(), reunion.getHoraInicio());
            // Ventana exacta de 24h: la reunión todavía no empezó y empieza dentro del límite.
            if (inicio.isBefore(ahora) || inicio.isAfter(limite)) {
                continue;
            }
            revisadas++;

            String fechaHora = inicio.format(FECHA_HORA);
            String modalidad = reunion.getModalidad() != null ? reunion.getModalidad().name() : "PRESENCIAL";
            boolean notificado = notificarParticipantes(reunion, fechaHora, modalidad);

            if (notificado) {
                recordadas++;
            } else {
                sinDestinatario++;
            }

            // Idempotencia entre corridas: se marca recordada aunque no haya destinatario,
            // para no reintentar indefinidamente una reunión sin emails resolubles.
            reunion.setRecordatorioEnviado(true);
            reunionRepository.save(reunion);
        }

        return new ResultadoRecordatorios(revisadas, recordadas, sinDestinatario);
    }

    /**
     * Notifica a estudiante y tutor. Devuelve true si al menos un destinatario válido
     * fue contactado. Se pasa referencia nula a la auditoría a propósito: así ambos
     * participantes reciben el correo (la dedupe por referencia es por evento, no por
     * destinatario); la idempotencia entre corridas la garantiza el flag de la reunión.
     */
    private boolean notificarParticipantes(AgendamientoReunion reunion, String fechaHora, String modalidad) {
        boolean alguno = false;

        Estudiante estudiante = estudianteRepository.findById(reunion.getEstudianteId()).orElse(null);
        if (estudiante != null && estudiante.getEmail() != null && !estudiante.getEmail().isBlank()) {
            notificacionCoformacionService.notificarRecordatorioReunion(
                estudiante.getEmail(), nombreCompleto(estudiante.getNombres(), estudiante.getApellidos()),
                fechaHora, modalidad, REF_AGENDAMIENTO, reunion.getId());
            alguno = true;
        } else {
            log.warn("[RecordatorioReunion] reunión {} sin email de estudiante {}",
                reunion.getId(), reunion.getEstudianteId());
        }

        Tutor tutor = tutorRepository.findById(reunion.getTutorId()).orElse(null);
        if (tutor != null && tutor.getEmail() != null && !tutor.getEmail().isBlank()) {
            notificacionCoformacionService.notificarRecordatorioReunion(
                tutor.getEmail(), nombreCompleto(tutor.getNombres(), tutor.getApellidos()),
                fechaHora, modalidad, REF_AGENDAMIENTO, reunion.getId());
            alguno = true;
        } else {
            log.warn("[RecordatorioReunion] reunión {} sin email de tutor {}",
                reunion.getId(), reunion.getTutorId());
        }

        return alguno;
    }

    private String nombreCompleto(String nombres, String apellidos) {
        return "%s %s".formatted(nombres == null ? "" : nombres, apellidos == null ? "" : apellidos).trim();
    }

    public record ResultadoRecordatorios(int revisadas, int recordadas, int sinDestinatario) {}
}
