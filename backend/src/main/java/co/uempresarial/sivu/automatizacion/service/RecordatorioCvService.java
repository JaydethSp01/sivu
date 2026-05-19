package co.uempresarial.sivu.automatizacion.service;

import co.uempresarial.sivu.convenio.domain.EstadoConvenio;
import co.uempresarial.sivu.convenio.persistence.ConvenioRepository;
import co.uempresarial.sivu.estudiante.domain.EstadoEstudiante;
import co.uempresarial.sivu.estudiante.domain.Estudiante;
import co.uempresarial.sivu.estudiante.persistence.EstudianteRepository;
import co.uempresarial.sivu.hojavida.persistence.HojaVidaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

/**
 * Recordatorio automático "actualiza tu CV" para estudiantes próximos a prácticas:
 *  - Están ACTIVOS
 *  - Cumplen créditos y promedio mínimos académicos
 *  - No tienen un convenio ACTIVO o FORMALIZADO en curso
 *  - Su HV no está completa (perfil, habilidades, idiomas, educación)
 *
 * Por defecto se ejecuta lunes 9am (cron `0 0 9 * * MON`). En `application*.yml` se
 * puede sobrescribir `app.recordatorios.cv.cron` y `app.recordatorios.cv.enabled`.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RecordatorioCvService {

    private final EstudianteRepository estudianteRepository;
    private final ConvenioRepository convenioRepository;
    private final HojaVidaRepository hojaVidaRepository;
    private final NotificacionService notificacionService;

    @Value("${app.universidad.creditos-minimos:120}")
    private int creditosMinimos;

    @Value("${app.universidad.promedio-minimo:3.5}")
    private BigDecimal promedioMinimo;

    @Value("${app.recordatorios.cv.enabled:true}")
    private boolean habilitado;

    /**
     * Ejecuta el job semanal. Configurable vía {@code app.recordatorios.cv.cron}.
     * Default: lunes a las 9:00am hora del servidor.
     */
    @Scheduled(cron = "${app.recordatorios.cv.cron:0 0 9 * * MON}")
    @Transactional(readOnly = true)
    public void ejecutarRecordatorioSemanal() {
        if (!habilitado) {
            log.info("Recordatorio CV deshabilitado por configuración.");
            return;
        }
        ResumenRecordatorios r = enviarRecordatoriosPendientes();
        log.info("Recordatorio CV ejecutado: revisados={}, notificados={}", r.revisados(), r.notificados());
    }

    /**
     * Variante manual: el admin puede dispararla desde un endpoint para forzar la
     * corrida fuera del cron.
     */
    @Transactional(readOnly = true)
    public ResumenRecordatorios enviarRecordatoriosPendientes() {
        List<Estudiante> activos = estudianteRepository.findAll().stream()
            .filter(e -> e.getEstado() == EstadoEstudiante.ACTIVO)
            .toList();

        int notificados = 0;
        for (Estudiante e : activos) {
            if (!esElegible(e)) continue;
            if (tieneConvenioActivoEnCurso(e)) continue;
            if (tieneHojaVidaCompleta(e)) continue;
            notificacionService.enviarRecordatorioActualizarCv(e.getEmail(), e.getNombres());
            notificados++;
        }
        return new ResumenRecordatorios(activos.size(), notificados);
    }

    private boolean esElegible(Estudiante e) {
        return e.getCreditosAprobados() != null && e.getCreditosAprobados() >= creditosMinimos
            && e.getPromedioAcumulado() != null && e.getPromedioAcumulado().compareTo(promedioMinimo) >= 0;
    }

    private boolean tieneConvenioActivoEnCurso(Estudiante e) {
        // Implementación pragmática: buscamos cualquier convenio del estudiante que NO esté en
        // estado terminal (FINALIZADO/CANCELADO). Si tiene uno en curso, no necesita recordatorio.
        return convenioRepository.findAll().stream()
            .filter(c -> c.getEstudiante() != null && c.getEstudiante().getId().equals(e.getId()))
            .anyMatch(c -> c.getEstado() != EstadoConvenio.FINALIZADO
                && c.getEstado() != EstadoConvenio.CANCELADO);
    }

    private boolean tieneHojaVidaCompleta(Estudiante e) {
        return hojaVidaRepository.findByEstudianteId(e.getId())
            .map(h -> h.estaCompleta())
            .orElse(false);
    }

    public record ResumenRecordatorios(int revisados, int notificados) {}
}
