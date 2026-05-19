package co.uempresarial.sivu.solicitudfabrica.service;

import co.uempresarial.sivu.automatizacion.service.NotificacionService;
import co.uempresarial.sivu.estudiante.domain.Estudiante;
import co.uempresarial.sivu.estudiante.persistence.EstudianteRepository;
import co.uempresarial.sivu.security.service.CurrentUserService;
import co.uempresarial.sivu.shared.exception.BusinessException;
import co.uempresarial.sivu.shared.exception.ResourceNotFoundException;
import co.uempresarial.sivu.solicitudfabrica.domain.EstadoSolicitudFabrica;
import co.uempresarial.sivu.solicitudfabrica.domain.SolicitudFabrica;
import co.uempresarial.sivu.solicitudfabrica.persistence.SolicitudFabricaRepository;
import co.uempresarial.sivu.solicitudfabrica.web.dto.ResolverSolicitudRequest;
import co.uempresarial.sivu.solicitudfabrica.web.dto.SolicitudFabricaRequest;
import co.uempresarial.sivu.solicitudfabrica.web.dto.SolicitudFabricaResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class SolicitudFabricaService {

    private final SolicitudFabricaRepository repository;
    private final EstudianteRepository estudianteRepository;
    private final NotificacionService notificacionService;
    private final CurrentUserService currentUser;

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

    private SolicitudFabricaResponse toResponse(SolicitudFabrica s) {
        Estudiante e = s.getEstudiante();
        String nombre = (e.getNombres() + " " + e.getApellidos()).trim();
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
            s.getCreatedAt(),
            s.getUpdatedAt());
    }
}
