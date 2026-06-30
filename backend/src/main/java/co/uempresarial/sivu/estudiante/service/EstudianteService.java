package co.uempresarial.sivu.estudiante.service;

import co.uempresarial.sivu.estudiante.domain.EstadoEstudiante;
import co.uempresarial.sivu.estudiante.domain.Estudiante;
import co.uempresarial.sivu.estudiante.persistence.EstudianteRepository;
import co.uempresarial.sivu.estudiante.web.EstudianteMapper;
import co.uempresarial.sivu.estudiante.web.dto.EstudianteRequest;
import co.uempresarial.sivu.estudiante.web.dto.EstudianteResponse;
import co.uempresarial.sivu.security.service.CurrentUserService;
import co.uempresarial.sivu.shared.exception.BusinessException;
import co.uempresarial.sivu.shared.exception.ResourceNotFoundException;
import co.uempresarial.sivu.shared.pagination.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class EstudianteService {

    private final EstudianteRepository repository;
    private final EstudianteMapper mapper;
    private final CurrentUserService currentUser;

    public EstudianteResponse crear(EstudianteRequest request) {
        if (repository.existsByNumeroDocumento(request.numeroDocumento())) {
            throw new BusinessException("Ya existe un estudiante con ese número de documento");
        }
        if (repository.existsByEmailIgnoreCase(request.email())) {
            throw new BusinessException("Ya existe un estudiante con ese email");
        }
        Estudiante entity = mapper.toEntity(request);
        if (entity.getEstado() == null) {
            entity.setEstado(EstadoEstudiante.ACTIVO);
        }
        return mapper.toResponse(repository.save(entity));
    }

    public EstudianteResponse actualizar(Long id, EstudianteRequest request) {
        Estudiante existing = obtener(id);
        // Validar conflictos solo si cambia el campo único
        if (!existing.getNumeroDocumento().equals(request.numeroDocumento())
            && repository.existsByNumeroDocumento(request.numeroDocumento())) {
            throw new BusinessException("Ya existe un estudiante con ese número de documento");
        }
        if (!existing.getEmail().equalsIgnoreCase(request.email())
            && repository.existsByEmailIgnoreCase(request.email())) {
            throw new BusinessException("Ya existe un estudiante con ese email");
        }
        mapper.updateEntity(request, existing);
        return mapper.toResponse(existing);
    }

    public void eliminar(Long id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Estudiante", id);
        }
        repository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public EstudianteResponse buscarPorId(Long id) {
        return mapper.toResponse(obtener(id));
    }

    @Transactional(readOnly = true)
    public PageResponse<EstudianteResponse> listar(String q, EstadoEstudiante estado, Pageable pageable) {
        // Auto-scope estricto: el tutor empresarial solo ve a sus practicantes (por empresa);
        // el docente acompañante solo a sus estudiantes asignados (por convenio.tutorAcademico).
        // Si la entidad propia es null devolvemos vacío (-1 garantiza que el filtro no matchee).
        Long empresaId = null;
        Long tutorAcademicoId = null;
        if (currentUser.esEmpresaPura()) {
            empresaId = currentUser.currentEmpresaId().orElse(-1L);
        } else if (currentUser.esDocentePuro()) {
            tutorAcademicoId = currentUser.currentTutorId().orElse(-1L);
        }
        return PageResponse.of(repository.buscar(q, estado, empresaId, tutorAcademicoId, pageable).map(mapper::toResponse));
    }

    public Estudiante obtener(Long id) {
        return repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Estudiante", id));
    }
}
