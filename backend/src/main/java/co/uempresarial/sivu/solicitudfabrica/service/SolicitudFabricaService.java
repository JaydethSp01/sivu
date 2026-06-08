package co.uempresarial.sivu.solicitudfabrica.service;

import co.uempresarial.sivu.automatizacion.service.NotificacionService;
import co.uempresarial.sivu.estudiante.domain.Estudiante;
import co.uempresarial.sivu.estudiante.persistence.EstudianteRepository;
import co.uempresarial.sivu.postulacion.domain.EstadoPostulacion;
import co.uempresarial.sivu.postulacion.domain.Postulacion;
import co.uempresarial.sivu.postulacion.persistence.PostulacionRepository;
import co.uempresarial.sivu.security.service.CurrentUserService;
import co.uempresarial.sivu.shared.exception.BusinessException;
import co.uempresarial.sivu.shared.exception.ResourceNotFoundException;
import co.uempresarial.sivu.solicitudfabrica.domain.EstadoSolicitudFabrica;
import co.uempresarial.sivu.solicitudfabrica.domain.SolicitudFabrica;
import co.uempresarial.sivu.solicitudfabrica.persistence.SolicitudFabricaRepository;
import co.uempresarial.sivu.solicitudfabrica.web.dto.ResolverSolicitudRequest;
import co.uempresarial.sivu.solicitudfabrica.web.dto.SolicitudFabricaRequest;
import co.uempresarial.sivu.solicitudfabrica.web.dto.SolicitudFabricaResponse;
import co.uempresarial.sivu.solicitudfabrica.web.dto.VacanteInternaDisponibleResponse;
import co.uempresarial.sivu.vacante.domain.EstadoVacante;
import co.uempresarial.sivu.vacante.domain.Vacante;
import co.uempresarial.sivu.vacante.persistence.VacanteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional
public class SolicitudFabricaService {

    private static final String CODIGO_MODALIDAD_INTERNA = "INTERNA_UNIVERSIDAD";
    private static final Set<EstadoPostulacion> POSTULACIONES_ACTIVAS = Set.of(
        EstadoPostulacion.POSTULADA,
        EstadoPostulacion.EN_REVISION,
        EstadoPostulacion.ENTREVISTA_PROGRAMADA,
        EstadoPostulacion.ENTREVISTA_REALIZADA,
        EstadoPostulacion.PRESELECCIONADA,
        EstadoPostulacion.ACEPTADA);

    private final SolicitudFabricaRepository repository;
    private final EstudianteRepository estudianteRepository;
    private final NotificacionService notificacionService;
    private final CurrentUserService currentUser;
    private final VacanteRepository vacanteRepository;
    private final PostulacionRepository postulacionRepository;

    public SolicitudFabricaResponse crearComoEstudiante(SolicitudFabricaRequest request) {
        Long estudianteId = currentUser.currentEstudianteId()
            .orElseThrow(() -> new BusinessException(
                "Tu usuario no está vinculado a un estudiante; no puedes solicitar el programa interno"));

        if (repository.existsByEstudianteIdAndEstado(estudianteId, EstadoSolicitudFabrica.PENDIENTE)) {
            throw new BusinessException(
                "Ya tienes una solicitud PENDIENTE. Espera la respuesta de Coordinación.");
        }

        Estudiante est = estudianteRepository.findById(estudianteId)
            .orElseThrow(() -> new ResourceNotFoundException("Estudiante", estudianteId));

        SolicitudFabrica s = SolicitudFabrica.builder()
            .estudiante(est)
            .motivo(request.motivo().trim())
            .estado(EstadoSolicitudFabrica.PENDIENTE)
            .fechaSolicitud(OffsetDateTime.now())
            .build();
        s = repository.save(s);

        return toResponse(s);
    }

    @Transactional(readOnly = true)
    public List<SolicitudFabricaResponse> listarMias() {
        Long estudianteId = currentUser.currentEstudianteId()
            .orElseThrow(() -> new BusinessException(
                "Tu usuario no está vinculado a un estudiante"));
        return repository.findByEstudianteIdOrderByFechaSolicitudDesc(estudianteId).stream()
            .map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<SolicitudFabricaResponse> bandeja(EstadoSolicitudFabrica estado) {
        return repository.findByEstadoOrderByFechaSolicitudAsc(estado).stream()
            .map(this::toResponse).toList();
    }

    public SolicitudFabricaResponse aprobar(Long id, ResolverSolicitudRequest body) {
        SolicitudFabrica s = repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Solicitud", id));
        if (s.getEstado() != EstadoSolicitudFabrica.PENDIENTE) {
            throw new BusinessException("Solo se pueden aprobar solicitudes PENDIENTES (actual: " + s.getEstado() + ")");
        }
        s.setEstado(EstadoSolicitudFabrica.APROBADA);
        s.setFechaResolucion(OffsetDateTime.now());
        if (body != null && body.observaciones() != null && !body.observaciones().isBlank()) {
            s.setObservacionesCoord(body.observaciones().trim());
        }
        currentUser.current().ifPresent(u -> {
            s.setResueltoPorMongoId(u.getId());
            s.setResueltoPorNombre(u.getNombres() + " " + u.getApellidos());
        });

        notificacionService.enviarTexto(
            s.getEstudiante().getEmail(),
            "[SIVU] Tu solicitud al programa interno fue aprobada",
            "Hola " + s.getEstudiante().getNombres()
                + ",\n\nCoordinación aprobó tu solicitud para entrar al programa interno."
                + " Cuando haya cupo disponible serás asignado automáticamente.\n\nEquipo SIVU");

        return toResponse(s);
    }

    public SolicitudFabricaResponse rechazar(Long id, ResolverSolicitudRequest body) {
        if (body == null || body.observaciones() == null || body.observaciones().isBlank()) {
            throw new BusinessException("Debes indicar observaciones al rechazar una solicitud");
        }
        SolicitudFabrica s = repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Solicitud", id));
        if (s.getEstado() != EstadoSolicitudFabrica.PENDIENTE) {
            throw new BusinessException("Solo se pueden rechazar solicitudes PENDIENTES (actual: " + s.getEstado() + ")");
        }
        s.setEstado(EstadoSolicitudFabrica.RECHAZADA);
        s.setObservacionesCoord(body.observaciones().trim());
        s.setFechaResolucion(OffsetDateTime.now());
        currentUser.current().ifPresent(u -> {
            s.setResueltoPorMongoId(u.getId());
            s.setResueltoPorNombre(u.getNombres() + " " + u.getApellidos());
        });

        notificacionService.enviarTexto(
            s.getEstudiante().getEmail(),
            "[SIVU] Tu solicitud al programa interno fue rechazada",
            "Hola " + s.getEstudiante().getNombres()
                + ",\n\nCoordinación revisó tu solicitud y decidió no aprobarla por:\n\n"
                + body.observaciones()
                + "\n\nPuedes enviar una nueva solicitud cuando quieras.\n\nEquipo SIVU");

        return toResponse(s);
    }

    /**
     * Coformación elige manualmente qué vacante interna le toca al estudiante
     * tras haber aprobado su solicitud. Crea la postulación PRESELECCIONADA y
     * deja la solicitud en estado ASIGNADA con trazabilidad bidireccional.
     */
    public SolicitudFabricaResponse asignarProyecto(Long solicitudId, Long vacanteId) {
        SolicitudFabrica s = repository.findById(solicitudId)
            .orElseThrow(() -> new ResourceNotFoundException("Solicitud", solicitudId));
        if (s.getEstado() != EstadoSolicitudFabrica.APROBADA) {
            throw new BusinessException(
                "Solo se puede asignar proyecto a solicitudes APROBADAS (actual: " + s.getEstado() + ")");
        }
        Vacante v = vacanteRepository.findById(vacanteId)
            .orElseThrow(() -> new ResourceNotFoundException("Vacante", vacanteId));
        if (v.getEstado() != EstadoVacante.PUBLICADA) {
            throw new BusinessException("La vacante debe estar PUBLICADA");
        }
        if (v.getModalidadVinculacion() == null
            || !CODIGO_MODALIDAD_INTERNA.equalsIgnoreCase(v.getModalidadVinculacion().getCodigo())) {
            throw new BusinessException(
                "Solo se pueden asignar vacantes con modalidad " + CODIGO_MODALIDAD_INTERNA);
        }
        if (v.getCuposDisponibles() != null && v.getCuposDisponibles() <= 0) {
            throw new BusinessException("La vacante no tiene cupos disponibles");
        }
        Estudiante est = s.getEstudiante();
        boolean tieneActiva = postulacionRepository.findByEstudianteId(est.getId()).stream()
            .anyMatch(p -> POSTULACIONES_ACTIVAS.contains(p.getEstado()));
        if (tieneActiva) {
            throw new BusinessException(
                "El estudiante ya tiene una postulación activa; no se puede asignar otra");
        }

        Postulacion p = Postulacion.builder()
            .estudiante(est)
            .vacante(v)
            .estado(EstadoPostulacion.PRESELECCIONADA)
            .scoreMatching(BigDecimal.ZERO)
            .justificacionMatching("[Programa interno] Asignación manual por Coformación")
            .mensajeEstudiante("Asignación manual desde la solicitud al programa interno")
            .fechaPostulacion(OffsetDateTime.now())
            .build();
        p = postulacionRepository.save(p);

        s.setEstado(EstadoSolicitudFabrica.ASIGNADA);
        s.setVacanteAsignadaId(v.getId());
        s.setPostulacionCreadaId(p.getId());

        notificacionService.enviarTexto(
            est.getEmail(),
            "[SIVU] Te asignamos un proyecto del programa interno",
            "Hola " + est.getNombres()
                + ",\n\nCoformación te asignó al proyecto \"" + v.getTitulo()
                + "\" del programa interno. Revisa tu portal para los siguientes pasos.\n\nEquipo SIVU");

        return toResponse(s);
    }

    @Transactional(readOnly = true)
    public List<VacanteInternaDisponibleResponse> listarVacantesInternasDisponibles() {
        return vacanteRepository.findByEstado(EstadoVacante.PUBLICADA).stream()
            .filter(v -> v.getModalidadVinculacion() != null
                && CODIGO_MODALIDAD_INTERNA.equalsIgnoreCase(v.getModalidadVinculacion().getCodigo()))
            .filter(v -> v.getCuposDisponibles() == null || v.getCuposDisponibles() > 0)
            .map(v -> new VacanteInternaDisponibleResponse(
                v.getId(),
                v.getTitulo(),
                v.getAreaPractica() == null ? null : v.getAreaPractica().name(),
                v.getModalidad() == null ? null : v.getModalidad().name(),
                v.getCiudad(),
                v.getCuposDisponibles() == null ? null : v.getCuposDisponibles().intValue(),
                v.getProgramasDirigidos()))
            .toList();
    }

    private SolicitudFabricaResponse toResponse(SolicitudFabrica s) {
        Estudiante e = s.getEstudiante();
        String nombre = (e.getNombres() + " " + e.getApellidos()).trim();
        String vacanteTitulo = null;
        if (s.getVacanteAsignadaId() != null) {
            vacanteTitulo = vacanteRepository.findById(s.getVacanteAsignadaId())
                .map(Vacante::getTitulo).orElse(null);
        }
        return new SolicitudFabricaResponse(
            s.getId(),
            e.getId(),
            nombre,
            e.getEmail(),
            e.getProgramaAcademico(),
            s.getMotivo(),
            s.getEstado(),
            s.getObservacionesCoord(),
            s.getFechaSolicitud(),
            s.getFechaResolucion(),
            s.getResueltoPorNombre(),
            s.getVacanteAsignadaId(),
            vacanteTitulo,
            s.getPostulacionCreadaId(),
            s.getCreatedAt(),
            s.getUpdatedAt());
    }
}
