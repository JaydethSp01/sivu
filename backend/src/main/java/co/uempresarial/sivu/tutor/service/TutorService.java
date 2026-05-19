package co.uempresarial.sivu.tutor.service;

import co.uempresarial.sivu.empresa.domain.Empresa;
import co.uempresarial.sivu.empresa.persistence.EmpresaRepository;
import co.uempresarial.sivu.security.service.CurrentUserService;
import co.uempresarial.sivu.shared.exception.BusinessException;
import co.uempresarial.sivu.shared.exception.ResourceNotFoundException;
import co.uempresarial.sivu.shared.pagination.PageResponse;
import co.uempresarial.sivu.tutor.domain.EstadoTutor;
import co.uempresarial.sivu.tutor.domain.TipoTutor;
import co.uempresarial.sivu.tutor.domain.Tutor;
import co.uempresarial.sivu.tutor.persistence.TutorRepository;
import co.uempresarial.sivu.tutor.web.TutorMapper;
import co.uempresarial.sivu.tutor.web.dto.TutorRequest;
import co.uempresarial.sivu.tutor.web.dto.TutorResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class TutorService {

    private final TutorRepository repository;
    private final EmpresaRepository empresaRepository;
    private final TutorMapper mapper;
    private final CurrentUserService currentUser;

    public TutorResponse crear(TutorRequest request) {
        validar(request, null);
        Tutor entity = mapper.toEntity(request);
        if (request.tipo() == TipoTutor.EMPRESARIAL && request.empresaId() != null) {
            entity.setEmpresa(obtenerEmpresa(request.empresaId()));
        }
        if (entity.getEstado() == null) entity.setEstado(EstadoTutor.ACTIVO);
        return mapper.toResponse(repository.save(entity));
    }

    public TutorResponse actualizar(Long id, TutorRequest request) {
        Tutor existing = obtener(id);
        validar(request, existing);
        mapper.updateEntity(request, existing);
        if (request.tipo() == TipoTutor.EMPRESARIAL && request.empresaId() != null) {
            existing.setEmpresa(obtenerEmpresa(request.empresaId()));
        } else if (request.tipo() == TipoTutor.ACADEMICO) {
            existing.setEmpresa(null);
        }
        return mapper.toResponse(existing);
    }

    public void eliminar(Long id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Tutor", id);
        }
        repository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public TutorResponse buscarPorId(Long id) {
        return mapper.toResponse(obtener(id));
    }

    @Transactional(readOnly = true)
    public PageResponse<TutorResponse> listar(String q, TipoTutor tipo, EstadoTutor estado, Long empresaId, Pageable pageable) {
        // Auto-scope: EMPRESA pura solo ve sus tutores empresariales.
        Long empresaIdEffective = empresaId;
        if (currentUser.esEmpresaPura()) {
            empresaIdEffective = currentUser.currentEmpresaId().orElse(-1L);
        }
        return PageResponse.of(repository.buscar(q, tipo, estado, empresaIdEffective, pageable).map(mapper::toResponse));
    }

    public Tutor obtener(Long id) {
        return repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Tutor", id));
    }

    private Empresa obtenerEmpresa(Long id) {
        return empresaRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Empresa", id));
    }

    private void validar(TutorRequest request, Tutor existing) {
        if (request.tipo() == TipoTutor.EMPRESARIAL && request.empresaId() == null) {
            throw new BusinessException("Un tutor EMPRESARIAL debe estar asociado a una empresa");
        }
        if (request.tipo() == TipoTutor.ACADEMICO && request.empresaId() != null) {
            throw new BusinessException("Un tutor ACADEMICO no debe tener empresa asignada");
        }
        if ((existing == null || !existing.getEmail().equalsIgnoreCase(request.email()))
            && repository.existsByEmailIgnoreCase(request.email())) {
            throw new BusinessException("Ya existe un tutor con ese email");
        }
    }
}
