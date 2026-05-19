package co.uempresarial.sivu.fabricasoluciones.service;

import co.uempresarial.sivu.automatizacion.service.MatchingService;
import co.uempresarial.sivu.automatizacion.service.NotificacionService;
import co.uempresarial.sivu.cohorte.persistence.CohorteEstudianteRepository;
import co.uempresarial.sivu.estudiante.domain.Estudiante;
import co.uempresarial.sivu.estudiante.persistence.EstudianteRepository;
import co.uempresarial.sivu.hojavida.domain.EstadoHojaVida;
import co.uempresarial.sivu.hojavida.persistence.HojaVidaRepository;
import co.uempresarial.sivu.postulacion.domain.EstadoPostulacion;
import co.uempresarial.sivu.postulacion.domain.Postulacion;
import co.uempresarial.sivu.postulacion.persistence.PostulacionRepository;
import co.uempresarial.sivu.solicitudfabrica.domain.EstadoSolicitudFabrica;
import co.uempresarial.sivu.solicitudfabrica.persistence.SolicitudFabricaRepository;
import co.uempresarial.sivu.vacante.domain.EstadoVacante;
import co.uempresarial.sivu.vacante.domain.Vacante;
import co.uempresarial.sivu.vacante.persistence.VacanteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
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

    private static final String CODIGO_MODALIDAD_INTERNA = "INTERNA_UNIVERSIDAD";
    private static final Set<EstadoPostulacion> ESTADOS_ACTIVOS = Set.of(
        EstadoPostulacion.POSTULADA,
        EstadoPostulacion.EN_REVISION,
        EstadoPostulacion.ENTREVISTA_PROGRAMADA,
        EstadoPostulacion.ENTREVISTA_REALIZADA,
        EstadoPostulacion.PRESELECCIONADA,
        EstadoPostulacion.ACEPTADA);

    private final HojaVidaRepository hojaVidaRepository;
    @SuppressWarnings("unused")
    private final EstudianteRepository estudianteRepository;
    private final VacanteRepository vacanteRepository;
    private final PostulacionRepository postulacionRepository;
    private final MatchingService matchingService;
    private final NotificacionService notificacionService;
    private final CohorteEstudianteRepository cohorteEstudianteRepository;
    private final SolicitudFabricaRepository solicitudFabricaRepository;

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

    /**
     * Estudiantes elegibles. Dos rutas (se acumulan en orden y sin duplicar):
     *   1) Estudiantes con solicitud APROBADA por Coordinación que aún no
     *      tienen colocación activa (vía dominante: justificación explícita).
     *   2) Estudiantes con HV APROBADA inscritos a una cohorte cuya
     *      fecha_apertura ya pasó (= inició el periodo de prácticas) y
     *      que no tienen postulación activa ni convenio en curso.
     *
     * El criterio (2) reemplaza al antiguo "≥30 días sin postular": ya no
     * importa cuánto tiempo lleva el estudiante intentando, importa que
     * el calendario académico ya empezó y aún no tiene cupo.
     */
    private List<Estudiante> listarEstudiantesElegibles() {
        Map<Long, Estudiante> resultado = new LinkedHashMap<>();
        LocalDate hoy = LocalDate.now();

        // (1) Solicitudes APROBADAS sin colocación activa
        solicitudFabricaRepository.findByEstadoOrderByFechaSolicitudAsc(EstadoSolicitudFabrica.APROBADA)
            .forEach(s -> {
                Estudiante est = s.getEstudiante();
                if (est == null) return;
                if (!sinPostulacionActiva(est.getId())) return;
                resultado.putIfAbsent(est.getId(), est);
            });

        // (2) HV aprobada + cohorte iniciada + sin postulación activa
        hojaVidaRepository.findByEstadoOrderByEnviadaAtAsc(EstadoHojaVida.APROBADA).forEach(hv -> {
            Estudiante est = hv.getEstudiante();
            if (est == null) return;
            if (resultado.containsKey(est.getId())) return;
            if (!cohorteIniciada(est.getId(), hoy)) return;
            if (!sinPostulacionActiva(est.getId())) return;
            resultado.put(est.getId(), est);
        });

        return List.copyOf(resultado.values());
    }

    private boolean sinPostulacionActiva(Long estudianteId) {
        return postulacionRepository.findByEstudianteId(estudianteId).stream()
            .noneMatch(p -> ESTADOS_ACTIVOS.contains(p.getEstado()));
    }

    /**
     * Verdadero si el estudiante pertenece a una cohorte cuya fecha_apertura
     * ya llegó (es decir, el periodo de prácticas ya inició o está iniciando).
     */
    private boolean cohorteIniciada(Long estudianteId, LocalDate hoy) {
        return cohorteEstudianteRepository.findByEstudianteIdOrderByCreatedAtDesc(estudianteId).stream()
            .anyMatch(ce -> {
                LocalDate apertura = ce.getCohorte() == null ? null : ce.getCohorte().getFechaApertura();
                return apertura != null && !apertura.isAfter(hoy);
            });
    }

    public record ResultadoVinculacion(List<String> vinculados, List<String> sinVacante) {}
}
