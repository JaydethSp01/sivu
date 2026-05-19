package co.uempresarial.sivu.postulacion.service;

import co.uempresarial.sivu.automatizacion.service.MatchingService;
import co.uempresarial.sivu.automatizacion.service.NotificacionService;
import co.uempresarial.sivu.estudiante.domain.Estudiante;
import co.uempresarial.sivu.estudiante.persistence.EstudianteRepository;
import co.uempresarial.sivu.postulacion.domain.EstadoPostulacion;
import co.uempresarial.sivu.postulacion.domain.Postulacion;
import co.uempresarial.sivu.postulacion.domain.PostulacionEvento;
import co.uempresarial.sivu.postulacion.persistence.PostulacionEventoRepository;
import co.uempresarial.sivu.postulacion.persistence.PostulacionRepository;
import co.uempresarial.sivu.postulacion.web.PostulacionMapper;
import co.uempresarial.sivu.postulacion.web.dto.*;
import co.uempresarial.sivu.security.service.CurrentUserService;
import co.uempresarial.sivu.shared.exception.BusinessException;
import co.uempresarial.sivu.shared.exception.ResourceNotFoundException;
import co.uempresarial.sivu.shared.pagination.PageResponse;
import co.uempresarial.sivu.vacante.domain.EstadoVacante;
import co.uempresarial.sivu.vacante.domain.Vacante;
import co.uempresarial.sivu.vacante.persistence.VacanteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional
public class PostulacionService {

    private final PostulacionRepository postulacionRepository;
    private final PostulacionEventoRepository eventoRepository;
    private final EstudianteRepository estudianteRepository;
    private final VacanteRepository vacanteRepository;
    private final MatchingService matchingService;
    private final NotificacionService notificacionService;
    private final PostulacionMapper mapper;
    private final CurrentUserService currentUser;

    private static final Map<EstadoPostulacion, Set<EstadoPostulacion>> TRANSICIONES = new EnumMap<>(EstadoPostulacion.class);
    static {
        TRANSICIONES.put(EstadoPostulacion.POSTULADA, Set.of(EstadoPostulacion.EN_REVISION, EstadoPostulacion.RECHAZADA, EstadoPostulacion.RETIRADA));
        TRANSICIONES.put(EstadoPostulacion.EN_REVISION, Set.of(EstadoPostulacion.PRESELECCIONADA, EstadoPostulacion.RECHAZADA, EstadoPostulacion.RETIRADA));
        TRANSICIONES.put(EstadoPostulacion.PRESELECCIONADA, Set.of(EstadoPostulacion.ACEPTADA, EstadoPostulacion.RECHAZADA, EstadoPostulacion.RETIRADA));
        TRANSICIONES.put(EstadoPostulacion.RECHAZADA, Set.of());
        TRANSICIONES.put(EstadoPostulacion.ACEPTADA, Set.of());
        TRANSICIONES.put(EstadoPostulacion.RETIRADA, Set.of());
    }

    public PostulacionResponse crear(PostulacionRequest request) {
        Estudiante estudiante = estudianteRepository.findById(request.estudianteId())
            .orElseThrow(() -> new ResourceNotFoundException("Estudiante", request.estudianteId()));
        Vacante vacante = vacanteRepository.findById(request.vacanteId())
            .orElseThrow(() -> new ResourceNotFoundException("Vacante", request.vacanteId()));

        if (vacante.getEstado() != EstadoVacante.PUBLICADA) {
            throw new BusinessException("La vacante no está publicada (estado actual: " + vacante.getEstado() + ")");
        }
        postulacionRepository.findByEstudianteIdAndVacanteId(estudiante.getId(), vacante.getId())
            .ifPresent(p -> { throw new BusinessException("El estudiante ya se postuló a esta vacante"); });
        if (vacante.getFechaCierrePostulaciones() != null
            && OffsetDateTime.now().toLocalDate().isAfter(vacante.getFechaCierrePostulaciones())) {
            throw new BusinessException("La vacante ya cerró postulaciones el " + vacante.getFechaCierrePostulaciones());
        }

        MatchingService.ResultadoMatching match = matchingService.calcular(estudiante, vacante);

        Postulacion postulacion = Postulacion.builder()
            .estudiante(estudiante)
            .vacante(vacante)
            .estado(EstadoPostulacion.POSTULADA)
            .scoreMatching(match.score())
            .justificacionMatching(match.justificacion())
            .mensajeEstudiante(request.mensajeEstudiante())
            .fechaPostulacion(OffsetDateTime.now())
            .build();
        postulacion = postulacionRepository.save(postulacion);

        registrarEvento(postulacion, "CREACION", null, EstadoPostulacion.POSTULADA,
            "Postulación creada (score: " + match.score() + ")", estudiante.getEmail());

        notificacionService.enviarCambioEstadoPostulacion(
            estudiante.getEmail(),
            estudiante.getNombres(),
            vacante.getTitulo(),
            vacante.getEmpresa().getRazonSocial(),
            EstadoPostulacion.POSTULADA.name(),
            null);

        return mapper.toResponse(postulacion);
    }

    public PostulacionResponse cambiarEstado(Long id, CambioEstadoRequest request, String actor) {
        Postulacion p = obtener(id);
        EstadoPostulacion anterior = p.getEstado();
        EstadoPostulacion nuevo = request.nuevoEstado();

        if (anterior == nuevo) {
            throw new BusinessException("La postulación ya está en estado " + nuevo);
        }
        Set<EstadoPostulacion> permitidos = TRANSICIONES.getOrDefault(anterior, Set.of());
        if (!permitidos.contains(nuevo)) {
            throw new BusinessException("Transición no permitida de " + anterior + " a " + nuevo);
        }

        p.setEstado(nuevo);
        p.setObservacionesEmpresa(request.observaciones());
        if (nuevo == EstadoPostulacion.ACEPTADA || nuevo == EstadoPostulacion.RECHAZADA) {
            p.setFechaDecision(OffsetDateTime.now());
        }

        registrarEvento(p, "CAMBIO_ESTADO", anterior, nuevo, request.observaciones(), actor);

        notificacionService.enviarCambioEstadoPostulacion(
            p.getEstudiante().getEmail(),
            p.getEstudiante().getNombres(),
            p.getVacante().getTitulo(),
            p.getVacante().getEmpresa().getRazonSocial(),
            nuevo.name(),
            request.observaciones());

        return mapper.toResponse(p);
    }

    public void eliminar(Long id) {
        if (!postulacionRepository.existsById(id)) {
            throw new ResourceNotFoundException("Postulación", id);
        }
        postulacionRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public PostulacionResponse buscarPorId(Long id) {
        return mapper.toResponse(obtener(id));
    }

    @Transactional(readOnly = true)
    public PageResponse<PostulacionResponse> listar(EstadoPostulacion estado, Long estudianteId, Long vacanteId, Pageable pageable) {
        // Auto-scope EMPRESA pura: solo postulaciones a vacantes de su propia empresa.
        Long empresaId = null;
        if (currentUser.esEmpresaPura()) {
            empresaId = currentUser.currentEmpresaId().orElse(-1L);
        }
        return PageResponse.of(postulacionRepository.buscar(estado, estudianteId, vacanteId, empresaId, pageable)
            .map(mapper::toResponse));
    }

    @Transactional(readOnly = true)
    public List<PostulacionEventoResponse> historial(Long postulacionId) {
        if (!postulacionRepository.existsById(postulacionId)) {
            throw new ResourceNotFoundException("Postulación", postulacionId);
        }
        return eventoRepository.findByPostulacionIdOrderByOcurridoEnAsc(postulacionId).stream()
            .map(mapper::toEventoResponse)
            .toList();
    }

    public Postulacion obtener(Long id) {
        return postulacionRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Postulación", id));
    }

    private void registrarEvento(Postulacion p, String tipo, EstadoPostulacion anterior, EstadoPostulacion nuevo, String detalle, String actor) {
        PostulacionEvento evt = PostulacionEvento.builder()
            .postulacion(p)
            .tipoEvento(tipo)
            .estadoAnterior(anterior)
            .estadoNuevo(nuevo)
            .detalle(detalle)
            .actor(actor)
            .ocurridoEn(OffsetDateTime.now())
            .build();
        eventoRepository.save(evt);
    }
}
