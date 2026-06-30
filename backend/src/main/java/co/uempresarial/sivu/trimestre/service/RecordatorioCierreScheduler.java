package co.uempresarial.sivu.trimestre.service;

import co.uempresarial.sivu.convenio.domain.Convenio;
import co.uempresarial.sivu.estudiante.domain.Estudiante;
import co.uempresarial.sivu.notificacion.service.NotificacionCoformacionService;
import co.uempresarial.sivu.trimestre.domain.EstadoPlanActividades;
import co.uempresarial.sivu.trimestre.domain.PlanActividades;
import co.uempresarial.sivu.trimestre.domain.Trimestre;
import co.uempresarial.sivu.trimestre.persistence.PlanActividadesRepository;
import co.uempresarial.sivu.trimestre.persistence.TrimestreRepository;
import co.uempresarial.sivu.tutor.domain.Tutor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * GAP 2 — RF-D01 #5: recordatorio automático "5 días antes del cierre del corte".
 *
 * <p>Cada día revisa los trimestres cuya {@code fechaCierre} cae dentro de los próximos
 * 5 días y que aún no tienen el recordatorio enviado ({@code recordatorioCierreEnviado = false}).
 * Si los documentos del corte siguen pendientes (el Plan de Actividades no está aprobado
 * por las 3 partes), notifica a estudiante y docente y marca el trimestre como recordado
 * (idempotencia entre corridas).
 *
 * <p>Sigue el patrón del {@code RecordatorioReunionScheduler}. Es aditivo y graceful:
 * los fallos de notificación/resolución se registran sin tumbar el job ni el resto del lote.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RecordatorioCierreScheduler {

    private static final int DIAS_ANTES = 5;

    private final TrimestreRepository trimestreRepository;
    private final PlanActividadesRepository planActividadesRepository;
    private final NotificacionCoformacionService notificacionCoformacion;

    @Value("${app.recordatorios.cierres.enabled:true}")
    private boolean habilitado;

    /** Job diario (08:00 por defecto). */
    @Scheduled(cron = "${app.recordatorios.cierres.cron:0 0 8 * * *}")
    public void ejecutarRecordatorios() {
        if (!habilitado) {
            log.info("[RecordatorioCierre] deshabilitado por configuración");
            return;
        }
        ResultadoCierres r = enviarRecordatoriosCierre();
        log.info("[RecordatorioCierre] revisados={}, recordados={}, sinPendientes={}",
            r.revisados(), r.recordados(), r.sinPendientes());
    }

    /**
     * Núcleo reutilizable (job + disparo manual). Busca trimestres con cierre dentro de
     * los próximos {@value #DIAS_ANTES} días aún sin recordatorio enviado y con documentos
     * del corte pendientes; notifica a estudiante y docente.
     */
    @Transactional
    public ResultadoCierres enviarRecordatoriosCierre() {
        LocalDate hoy = LocalDate.now();
        LocalDate limite = hoy.plusDays(DIAS_ANTES);

        List<Trimestre> candidatos = trimestreRepository
            .findByRecordatorioCierreEnviadoFalseAndFechaCierreBetween(hoy, limite);

        int revisados = 0;
        int recordados = 0;
        int sinPendientes = 0;

        for (Trimestre t : candidatos) {
            revisados++;
            if (!documentosPendientes(t)) {
                // El corte ya está completo: no se recuerda (ni se marca, por si reabre).
                sinPendientes++;
                continue;
            }
            boolean notificado = notificarParticipantes(t);
            if (notificado) {
                recordados++;
            }
            // Idempotencia entre corridas: se marca recordado aunque no haya destinatario resoluble.
            t.setRecordatorioCierreEnviado(true);
            trimestreRepository.save(t);
        }

        return new ResultadoCierres(revisados, recordados, sinPendientes);
    }

    /** Documentos del corte pendientes = no existe el PA o no está aprobado por las 3 partes. */
    private boolean documentosPendientes(Trimestre t) {
        Optional<PlanActividades> pa = planActividadesRepository.findByTrimestreId(t.getId());
        return pa.isEmpty() || pa.get().getEstado() != EstadoPlanActividades.APROBADO_PROFESOR;
    }

    private boolean notificarParticipantes(Trimestre t) {
        Convenio c = t.getConvenio();
        if (c == null) {
            return false;
        }
        String fechaCierre = t.getFechaCierre() != null ? t.getFechaCierre().toString() : "próximamente";
        String detalle = "El cierre del trimestre T" + (t.getNumero() == null ? "" : t.getNumero())
            + " está programado para el " + fechaCierre
            + ". Aún hay documentos del corte pendientes por completar/firmar.";
        boolean alguno = false;

        Estudiante est = c.getEstudiante();
        if (est != null && est.getEmail() != null && !est.getEmail().isBlank()) {
            notificacionCoformacion.notificarRecordatorioCierre(
                est.getEmail(), nombre(est.getNombres(), est.getApellidos()),
                detalle, NotificacionCoformacionService.REF_TRIMESTRE, null);
            alguno = true;
        } else {
            log.warn("[RecordatorioCierre] trimestre {} sin email de estudiante", t.getId());
        }

        Tutor docente = c.getTutorAcademico();
        if (docente != null && docente.getEmail() != null && !docente.getEmail().isBlank()) {
            notificacionCoformacion.notificarRecordatorioCierre(
                docente.getEmail(), nombre(docente.getNombres(), docente.getApellidos()),
                detalle, NotificacionCoformacionService.REF_TRIMESTRE, null);
            alguno = true;
        }

        return alguno;
    }

    private String nombre(String nombres, String apellidos) {
        return "%s %s".formatted(nombres == null ? "" : nombres, apellidos == null ? "" : apellidos).trim();
    }

    public record ResultadoCierres(int revisados, int recordados, int sinPendientes) {}
}
