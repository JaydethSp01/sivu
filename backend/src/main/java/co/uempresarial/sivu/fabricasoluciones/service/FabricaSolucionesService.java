package co.uempresarial.sivu.fabricasoluciones.service;

import co.uempresarial.sivu.automatizacion.service.MatchingService;
import co.uempresarial.sivu.automatizacion.service.NotificacionService;
import co.uempresarial.sivu.estudiante.domain.Estudiante;
import co.uempresarial.sivu.estudiante.persistence.EstudianteRepository;
import co.uempresarial.sivu.hojavida.domain.EstadoHojaVida;
import co.uempresarial.sivu.hojavida.persistence.HojaVidaRepository;
import co.uempresarial.sivu.postulacion.domain.EstadoPostulacion;
import co.uempresarial.sivu.postulacion.domain.Postulacion;
import co.uempresarial.sivu.postulacion.persistence.PostulacionRepository;
import co.uempresarial.sivu.vacante.domain.EstadoVacante;
import co.uempresarial.sivu.vacante.domain.Vacante;
import co.uempresarial.sivu.vacante.persistence.VacanteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Fábrica de Soluciones — fallback automático para estudiantes que tienen su HV
 * aprobada pero no encuentran cupo en empresas externas. Los vincula a vacantes
 * con modalidad INTERNA_UNIVERSIDAD que ofrece la propia universidad.
 *
 * Lineamiento institucional Uniempresarial: ningún estudiante elegible se queda
 * sin práctica; la Fábrica recoge los casos no colocados al cierre del proceso.
 */
@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class FabricaSolucionesService {

    private static final long DIAS_SIN_POSTULACION = 30L;
    private static final String CODIGO_MODALIDAD_INTERNA = "INTERNA_UNIVERSIDAD";
    private static final Set<EstadoPostulacion> ESTADOS_ACTIVOS = Set.of(
        EstadoPostulacion.POSTULADA,
        EstadoPostulacion.EN_REVISION,
        EstadoPostulacion.ENTREVISTA_PROGRAMADA,
        EstadoPostulacion.ENTREVISTA_REALIZADA,
        EstadoPostulacion.PRESELECCIONADA,
        EstadoPostulacion.ACEPTADA);

    private final HojaVidaRepository hojaVidaRepository;
    private final EstudianteRepository estudianteRepository;
    private final VacanteRepository vacanteRepository;
    private final PostulacionRepository postulacionRepository;
    private final MatchingService matchingService;
    private final NotificacionService notificacionService;

    /**
     * Job semanal: cada lunes 9am intenta vincular a estudiantes elegibles
     * que llevan ≥30 días con HV APROBADA pero sin postulación activa.
     */
    @Scheduled(cron = "0 0 9 * * MON")
    public void jobSemanal() {
        log.info("[FabricaSoluciones] Job semanal iniciado");
        ResultadoVinculacion r = vincularElegibles();
        log.info("[FabricaSoluciones] Resultado: {} vinculados, {} sin vacante interna disponible",
            r.vinculados().size(), r.sinVacante().size());
    }

    /**
     * Endpoint on-demand para que la Coordinación dispare el matching ahora mismo.
     */
    public ResultadoVinculacion vincularElegibles() {
        List<Vacante> vacantesInternas = vacanteRepository.findByEstado(EstadoVacante.PUBLICADA).stream()
            .filter(v -> v.getModalidadVinculacion() != null
                && CODIGO_MODALIDAD_INTERNA.equalsIgnoreCase(v.getModalidadVinculacion().getCodigo()))
            .toList();

        List<Estudiante> elegibles = listarEstudiantesElegibles();
        List<String> vinculados = new ArrayList<>();
        List<String> sinVacante = new ArrayList<>();
        Set<Long> vacantesUsadas = new HashSet<>();

        for (Estudiante est : elegibles) {
            Vacante objetivo = vacantesInternas.stream()
                .filter(v -> !vacantesUsadas.contains(v.getId()))
                .findFirst()
                .orElse(null);
            if (objetivo == null) {
                sinVacante.add(est.getEmail());
                continue;
            }
            try {
                MatchingService.ResultadoMatching match = matchingService.calcular(est, objetivo);
                Postulacion p = Postulacion.builder()
                    .estudiante(est)
                    .vacante(objetivo)
                    .estado(EstadoPostulacion.PRESELECCIONADA)
                    .scoreMatching(match.score() == null ? BigDecimal.ZERO : match.score())
                    .justificacionMatching("[Fábrica de Soluciones] " + match.justificacion())
                    .mensajeEstudiante("Asignación automática via Fábrica de Soluciones")
                    .fechaPostulacion(OffsetDateTime.now())
                    .build();
                postulacionRepository.save(p);
                vacantesUsadas.add(objetivo.getId());
                vinculados.add(est.getEmail());

                notificacionService.enviarTexto(
                    est.getEmail(),
                    "[SIVU] Vinculado a la Fábrica de Soluciones",
                    "Hola " + est.getNombres()
                        + ",\n\nHas sido vinculado automáticamente al programa interno"
                        + " Fábrica de Soluciones para la vacante \"" + objetivo.getTitulo()
                        + "\". Revisa el portal para los siguientes pasos.\n\nEquipo SIVU");
            } catch (Exception ex) {
                log.warn("[FabricaSoluciones] No se pudo vincular estudiante {}: {}",
                    est.getId(), ex.getMessage());
                sinVacante.add(est.getEmail());
            }
        }

        return new ResultadoVinculacion(vinculados, sinVacante);
    }

    private List<Estudiante> listarEstudiantesElegibles() {
        OffsetDateTime corte = OffsetDateTime.now().minusDays(DIAS_SIN_POSTULACION);
        return hojaVidaRepository.findByEstadoOrderByEnviadaAtAsc(EstadoHojaVida.APROBADA).stream()
            .filter(hv -> hv.getAprobadaAt() != null && hv.getAprobadaAt().isBefore(corte))
            .map(hv -> hv.getEstudiante())
            .filter(est -> est != null)
            .filter(est -> postulacionRepository.findByEstudianteId(est.getId()).stream()
                .noneMatch(p -> ESTADOS_ACTIVOS.contains(p.getEstado())))
            .toList();
    }

    public record ResultadoVinculacion(List<String> vinculados, List<String> sinVacante) {}
}
