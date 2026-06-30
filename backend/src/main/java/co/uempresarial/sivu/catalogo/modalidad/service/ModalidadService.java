package co.uempresarial.sivu.catalogo.modalidad.service;

import co.uempresarial.sivu.catalogo.modalidad.domain.ModalidadVinculacion;
import co.uempresarial.sivu.catalogo.modalidad.persistence.ModalidadVinculacionRepository;
import co.uempresarial.sivu.catalogo.modalidad.web.ModalidadMapper;
import co.uempresarial.sivu.catalogo.modalidad.web.dto.ModalidadRequest;
import co.uempresarial.sivu.catalogo.modalidad.web.dto.ModalidadResponse;
import co.uempresarial.sivu.shared.exception.BusinessException;
import co.uempresarial.sivu.shared.exception.ResourceNotFoundException;
import co.uempresarial.sivu.shared.pagination.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ModalidadService {

    private final ModalidadVinculacionRepository repository;
    private final ModalidadMapper mapper;

    public ModalidadResponse crear(ModalidadRequest request) {
        if (repository.existsByCodigoIgnoreCase(request.codigo())) {
            throw new BusinessException("Ya existe una modalidad con ese código");
        }
        ModalidadVinculacion entity = mapper.toEntity(request);
        if (entity.getActivo() == null) {
            entity.setActivo(true);
        }
        return mapper.toResponse(repository.save(entity));
    }

    public ModalidadResponse actualizar(Long id, ModalidadRequest request) {
        ModalidadVinculacion existing = obtener(id);
        if (!existing.getCodigo().equalsIgnoreCase(request.codigo())
            && repository.existsByCodigoIgnoreCase(request.codigo())) {
            throw new BusinessException("Ya existe una modalidad con ese código");
        }
        mapper.updateEntity(request, existing);
        return mapper.toResponse(existing);
    }

    public void eliminar(Long id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Modalidad", id);
        }
        repository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public ModalidadResponse buscarPorId(Long id) {
        return mapper.toResponse(obtener(id));
    }

    @Transactional(readOnly = true)
    public PageResponse<ModalidadResponse> listar(String q, Boolean activo, Pageable pageable) {
        return PageResponse.of(repository.buscar(q, activo, pageable).map(mapper::toResponse));
    }

    @Transactional(readOnly = true)
    public List<ModalidadResponse> listarActivas() {
        return repository.findByActivoTrueOrderByNombreAsc().stream()
            .map(mapper::toResponse)
            .toList();
    }

    public ModalidadVinculacion obtener(Long id) {
        return repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Modalidad", id));
    }
}
