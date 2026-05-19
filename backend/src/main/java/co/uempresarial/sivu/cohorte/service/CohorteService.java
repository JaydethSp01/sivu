package co.uempresarial.sivu.cohorte.service;

import co.uempresarial.sivu.cohorte.domain.Cohorte;
import co.uempresarial.sivu.cohorte.domain.CohorteEstudiante;
import co.uempresarial.sivu.cohorte.domain.EstadoCohorteEstudiante;
import co.uempresarial.sivu.cohorte.persistence.CohorteEstudianteRepository;
import co.uempresarial.sivu.cohorte.persistence.CohorteRepository;
import co.uempresarial.sivu.cohorte.web.dto.CohorteRequest;
import co.uempresarial.sivu.cohorte.web.dto.CohorteResponse;
import co.uempresarial.sivu.cohorte.web.dto.CohorteEstudianteResponse;
import co.uempresarial.sivu.estudiante.domain.EstadoEstudiante;
import co.uempresarial.sivu.estudiante.domain.Estudiante;
import co.uempresarial.sivu.estudiante.persistence.EstudianteRepository;
import co.uempresarial.sivu.shared.exception.BusinessException;
import co.uempresarial.sivu.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class CohorteService {

    private final CohorteRepository repository;
    private final CohorteEstudianteRepository inscripcionRepository;
    private final EstudianteRepository estudianteRepository;

    @Value("${app.universidad.creditos-minimos:120}")
    private int creditosMinimos;

    @Value("${app.universidad.promedio-minimo:3.5}")
    private BigDecimal promedioMinimo;

    // -----------------------------------------------------------------
    // CRUD de Cohorte
    // -----------------------------------------------------------------

    public CohorteResponse crear(CohorteRequest request) {
        if (repository.existsBySemestreAcademico(request.semestreAcademico())) {
            throw new BusinessException("Ya existe una cohorte para el semestre " + request.semestreAcademico());
        }
        Cohorte c = Cohorte.builder()
            .semestreAcademico(request.semestreAcademico())
            .nombre(request.nombre())
            .fechaApertura(request.fechaApertura())
            .fechaCierre(request.fechaCierre())
            .descripcion(request.descripcion())
            .activa(request.activa() == null ? true : request.activa())
            .build();
        return toResponse(repository.save(c));
    }

    public CohorteResponse actualizar(Long id, CohorteRequest request) {
        Cohorte c = obtener(id);
        if (!c.getSemestreAcademico().equals(request.semestreAcademico())
            && repository.existsBySemestreAcademico(request.semestreAcademico())) {
            throw new BusinessException("Ya existe otra cohorte con el semestre " + request.semestreAcademico());
        }
        c.setSemestreAcademico(request.semestreAcademico());
        c.setNombre(request.nombre());
        c.setFechaApertura(request.fechaApertura());
        c.setFechaCierre(request.fechaCierre());
        c.setDescripcion(request.descripcion());
        if (request.activa() != null) c.setActiva(request.activa());
        return toResponse(c);
    }

    public void eliminar(Long id) {
        if (!repository.existsById(id)) throw new ResourceNotFoundException("Cohorte", id);
        repository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public CohorteResponse buscarPorId(Long id) {
        return toResponse(obtener(id));
    }

    @Transactional(readOnly = true)
    public List<CohorteResponse> listarActivas() {
        return repository.findByActivaTrueOrderByFechaAperturaDesc().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<CohorteResponse> listar() {
        return repository.findAll().stream().map(this::toResponse).toList();
    }

    // -----------------------------------------------------------------
    // Inscripciones (estudiante x cohorte)
    // -----------------------------------------------------------------

    public CohorteEstudianteResponse inscribir(Long cohorteId, Long estudianteId) {
        Cohorte c = obtener(cohorteId);
        Estudiante e = estudianteRepository.findById(estudianteId)
            .orElseThrow(() -> new ResourceNotFoundException("Estudiante", estudianteId));
        if (inscripcionRepository.existsByCohorteIdAndEstudianteId(cohorteId, estudianteId)) {
            throw new BusinessException("El estudiante ya está en esta cohorte");
        }
        CohorteEstudiante ce = CohorteEstudiante.builder()
            .cohorte(c).estudiante(e)
            .estado(esElegible(e) ? EstadoCohorteEstudiante.ELEGIBLE : EstadoCohorteEstudiante.NO_APLICA)
            .fechaInscripcion(OffsetDateTime.now())
            .build();
        return toResponseInscripcion(inscripcionRepository.save(ce));
    }

    public CohorteEstudianteResponse cambiarEstado(Long inscripcionId, EstadoCohorteEstudiante nuevo,
                                                    String observaciones) {
        CohorteEstudiante ce = inscripcionRepository.findById(inscripcionId)
            .orElseThrow(() -> new ResourceNotFoundException("Inscripción", inscripcionId));
        ce.setEstado(nuevo);
        if (observaciones != null && !observaciones.isBlank()) {
            ce.setObservaciones(observaciones);
        }
        return toResponseInscripcion(ce);
    }

    public void quitar(Long inscripcionId) {
        if (!inscripcionRepository.existsById(inscripcionId)) {
            throw new ResourceNotFoundException("Inscripción", inscripcionId);
        }
        inscripcionRepository.deleteById(inscripcionId);
    }

    @Transactional(readOnly = true)
    public List<CohorteEstudianteResponse> listarPorCohorte(Long cohorteId, EstadoCohorteEstudiante estado) {
        return inscripcionRepository.listarPorCohorte(cohorteId, estado).stream()
            .map(this::toResponseInscripcion).toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Long> resumenCohorte(Long cohorteId) {
        return Map.of(
            "elegibles", inscripcionRepository.countByCohorteIdAndEstado(cohorteId, EstadoCohorteEstudiante.ELEGIBLE),
            "inscritos", inscripcionRepository.countByCohorteIdAndEstado(cohorteId, EstadoCohorteEstudiante.INSCRITO),
            "practicaActiva", inscripcionRepository.countByCohorteIdAndEstado(cohorteId, EstadoCohorteEstudiante.PRACTICA_ACTIVA),
            "finalizados", inscripcionRepository.countByCohorteIdAndEstado(cohorteId, EstadoCohorteEstudiante.FINALIZADO),
            "noAplica", inscripcionRepository.countByCohorteIdAndEstado(cohorteId, EstadoCohorteEstudiante.NO_APLICA));
    }

    /** Lista los estudiantes ACTIVOS que cumplen condiciones académicas y no están aún en la cohorte. */
    @Transactional(readOnly = true)
    public List<Long> candidatos(Long cohorteId) {
        return estudianteRepository.findAll().stream()
            .filter(this::esElegible)
            .filter(e -> !inscripcionRepository.existsByCohorteIdAndEstudianteId(cohorteId, e.getId()))
            .map(Estudiante::getId)
            .toList();
    }

    // -----------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------

    public Cohorte obtener(Long id) {
        return repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Cohorte", id));
    }

    private boolean esElegible(Estudiante e) {
        return e.getEstado() == EstadoEstudiante.ACTIVO
            && e.getCreditosAprobados() != null && e.getCreditosAprobados() >= creditosMinimos
            && e.getPromedioAcumulado() != null && e.getPromedioAcumulado().compareTo(promedioMinimo) >= 0;
    }

    private CohorteResponse toResponse(Cohorte c) {
        return new CohorteResponse(
            c.getId(), c.getSemestreAcademico(), c.getNombre(),
            c.getFechaApertura(), c.getFechaCierre(), c.getDescripcion(), c.getActiva(),
            c.getCreatedAt(), c.getUpdatedAt());
    }

    private CohorteEstudianteResponse toResponseInscripcion(CohorteEstudiante ce) {
        Estudiante e = ce.getEstudiante();
        return new CohorteEstudianteResponse(
            ce.getId(), ce.getCohorte().getId(), ce.getCohorte().getSemestreAcademico(),
            e.getId(), (e.getNombres() + " " + e.getApellidos()).trim(),
            e.getEmail(), e.getProgramaAcademico(), e.getSemestre(),
            e.getCreditosAprobados(), e.getPromedioAcumulado(),
            ce.getEstado(), ce.getObservaciones(), ce.getFechaInscripcion(),
            ce.getCreatedAt(), ce.getUpdatedAt());
    }
}
