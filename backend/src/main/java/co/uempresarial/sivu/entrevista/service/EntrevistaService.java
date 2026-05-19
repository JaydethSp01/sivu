package co.uempresarial.sivu.entrevista.service;

import co.uempresarial.sivu.automatizacion.service.NotificacionService;
import co.uempresarial.sivu.entrevista.domain.Entrevista;
import co.uempresarial.sivu.entrevista.domain.ResultadoEntrevista;
import co.uempresarial.sivu.entrevista.persistence.EntrevistaRepository;
import co.uempresarial.sivu.entrevista.web.EntrevistaMapper;
import co.uempresarial.sivu.entrevista.web.dto.EntrevistaRequest;
import co.uempresarial.sivu.entrevista.web.dto.EntrevistaResponse;
import co.uempresarial.sivu.entrevista.web.dto.ResultadoEntrevistaRequest;
import co.uempresarial.sivu.postulacion.domain.EstadoPostulacion;
import co.uempresarial.sivu.postulacion.domain.Postulacion;
import co.uempresarial.sivu.postulacion.persistence.PostulacionRepository;
import co.uempresarial.sivu.security.service.CurrentUserService;
import co.uempresarial.sivu.shared.exception.BusinessException;
import co.uempresarial.sivu.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional
public class EntrevistaService {

    private static final Set<EstadoPostulacion> ESTADOS_PROGRAMABLES = Set.of(
        EstadoPostulacion.EN_REVISION,
        EstadoPostulacion.POSTULADA);

    private final EntrevistaRepository repository;
    private final PostulacionRepository postulacionRepository;
    private final NotificacionService notificacionService;
    private final CurrentUserService currentUser;
    private final EntrevistaMapper mapper;

    public EntrevistaResponse programar(EntrevistaRequest request) {
        Postulacion postulacion = postulacionRepository.findById(request.postulacionId())
            .orElseThrow(() -> new ResourceNotFoundException("Postulación", request.postulacionId()));

        if (!ESTADOS_PROGRAMABLES.contains(postulacion.getEstado())) {
            throw new BusinessException(
                "No se puede programar entrevista en estado " + postulacion.getEstado());
        }

        Entrevista entrevista = Entrevista.builder()
            .postulacion(postulacion)
            .fechaProgramada(request.fechaProgramada())
            .modalidad(request.modalidad())
            .lugar(request.lugar())
            .enlaceVirtual(request.enlaceVirtual())
            .entrevistadorNombre(request.entrevistadorNombre())
            .entrevistadorCargo(request.entrevistadorCargo())
            .observaciones(request.observaciones())
            .resultado(ResultadoEntrevista.PENDIENTE)
            .build();
        entrevista = repository.save(entrevista);

        postulacion.setEstado(EstadoPostulacion.ENTREVISTA_PROGRAMADA);

        notificacionService.enviarTexto(
            postulacion.getEstudiante().getEmail(),
            "[SIVU] Entrevista programada para tu postulación",
            cuerpoProgramada(entrevista));

        return mapper.toResponse(entrevista);
    }

    public EntrevistaResponse registrarResultado(Long id, ResultadoEntrevistaRequest request) {
        Entrevista entrevista = repository.findWithRelationsById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Entrevista", id));

        if (entrevista.getResultado() != ResultadoEntrevista.PENDIENTE) {
            throw new BusinessException(
                "La entrevista ya tiene resultado registrado (" + entrevista.getResultado() + ")");
        }

        entrevista.setResultado(request.resultado());
        entrevista.setFechaResultado(OffsetDateTime.now());
        if (request.observaciones() != null && !request.observaciones().isBlank()) {
            String prev = entrevista.getObservaciones() == null ? "" : entrevista.getObservaciones() + "\n";
            entrevista.setObservaciones(prev + "[Resultado] " + request.observaciones());
        }

        Postulacion postulacion = entrevista.getPostulacion();
        postulacion.setEstado(EstadoPostulacion.ENTREVISTA_REALIZADA);
        if (request.resultado() == ResultadoEntrevista.APROBADA) {
            postulacion.setEstado(EstadoPostulacion.PRESELECCIONADA);
        } else if (request.resultado() == ResultadoEntrevista.RECHAZADA) {
            postulacion.setEstado(EstadoPostulacion.RECHAZADA);
            postulacion.setFechaDecision(OffsetDateTime.now());
        }

        notificacionService.enviarTexto(
            postulacion.getEstudiante().getEmail(),
            "[SIVU] Resultado de tu entrevista: " + request.resultado(),
            cuerpoResultado(entrevista, request.observaciones()));

        return mapper.toResponse(entrevista);
    }

    public void cancelar(Long id) {
        Entrevista entrevista = repository.findWithRelationsById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Entrevista", id));
        if (entrevista.getResultado() != ResultadoEntrevista.PENDIENTE) {
            throw new BusinessException("Solo se pueden cancelar entrevistas PENDIENTES");
        }
        Postulacion postulacion = entrevista.getPostulacion();
        repository.delete(entrevista);
        if (postulacion.getEstado() == EstadoPostulacion.ENTREVISTA_PROGRAMADA) {
            postulacion.setEstado(EstadoPostulacion.EN_REVISION);
        }
    }

    @Transactional(readOnly = true)
    public EntrevistaResponse obtener(Long id) {
        Entrevista e = repository.findWithRelationsById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Entrevista", id));
        return mapper.toResponse(e);
    }

    /**
     * Listado con auto-scope por rol:
     *   ESTUDIANTE puro → solo sus entrevistas
     *   EMPRESA puro    → entrevistas de sus vacantes
     *   COORD/ADMIN     → todas (o filtradas por postulación)
     */
    @Transactional(readOnly = true)
    public List<EntrevistaResponse> listar(Long postulacionId) {
        if (postulacionId != null) {
            return repository.findByPostulacionIdOrderByFechaProgramadaDesc(postulacionId)
                .stream().map(mapper::toResponse).toList();
        }
        if (currentUser.esEstudiantePuro()) {
            Long estId = currentUser.currentEstudianteId().orElse(-1L);
            return repository.findByPostulacionEstudianteIdOrderByFechaProgramadaDesc(estId)
                .stream().map(mapper::toResponse).toList();
        }
        if (currentUser.esEmpresaPura()) {
            Long empId = currentUser.currentEmpresaId().orElse(-1L);
            return repository.findByPostulacionVacanteEmpresaIdOrderByFechaProgramadaDesc(empId)
                .stream().map(mapper::toResponse).toList();
        }
        return repository.findAll().stream().map(mapper::toResponse).toList();
    }

    private String cuerpoProgramada(Entrevista e) {
        Postulacion p = e.getPostulacion();
        return """
            Hola %s,

            Se programó una entrevista para tu postulación a la vacante "%s" en %s.

            Fecha: %s
            Modalidad: %s
            %s
            %s

            Equipo SIVU - Universidad Empresarial
            """.formatted(
                p.getEstudiante().getNombres(),
                p.getVacante().getTitulo(),
                p.getVacante().getEmpresa().getRazonSocial(),
                e.getFechaProgramada(),
                e.getModalidad(),
                e.getLugar() == null ? "" : "Lugar: " + e.getLugar(),
                e.getEnlaceVirtual() == null ? "" : "Enlace: " + e.getEnlaceVirtual());
    }

    private String cuerpoResultado(Entrevista e, String observaciones) {
        Postulacion p = e.getPostulacion();
        return """
            Hola %s,

            Tu entrevista para la vacante "%s" en %s tiene resultado: %s.

            %s

            Puedes consultar el detalle en el portal SIVU.

            Equipo SIVU - Universidad Empresarial
            """.formatted(
                p.getEstudiante().getNombres(),
                p.getVacante().getTitulo(),
                p.getVacante().getEmpresa().getRazonSocial(),
                e.getResultado(),
                observaciones == null ? "" : "Observaciones: " + observaciones);
    }
}
