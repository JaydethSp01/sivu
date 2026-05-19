package co.uempresarial.sivu.catalogo.requisito.service;

import co.uempresarial.sivu.catalogo.requisito.domain.AplicaA;
import co.uempresarial.sivu.catalogo.requisito.domain.TipoRequisitoDocumental;
import co.uempresarial.sivu.catalogo.requisito.persistence.RequisitoModalidadRepository;
import co.uempresarial.sivu.catalogo.requisito.persistence.TipoRequisitoDocumentalRepository;
import co.uempresarial.sivu.catalogo.requisito.web.TipoRequisitoMapper;
import co.uempresarial.sivu.catalogo.requisito.web.dto.TipoRequisitoRequest;
import co.uempresarial.sivu.catalogo.requisito.web.dto.TipoRequisitoResponse;
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
public class TipoRequisitoService {

    private final TipoRequisitoDocumentalRepository repository;
    private final RequisitoModalidadRepository requisitoModalidadRepository;
    private final TipoRequisitoMapper mapper;

    public TipoRequisitoResponse crear(TipoRequisitoRequest request) {
        if (repository.existsByCodigoIgnoreCase(request.codigo())) {
            throw new BusinessException("Ya existe un tipo de requisito con ese código");
        }
        TipoRequisitoDocumental entity = mapper.toEntity(request);
        if (entity.getActivo() == null) {
            entity.setActivo(true);
        }
        return mapper.toResponse(repository.save(entity));
    }

    public TipoRequisitoResponse actualizar(Long id, TipoRequisitoRequest request) {
        TipoRequisitoDocumental existing = obtener(id);
        if (!existing.getCodigo().equalsIgnoreCase(request.codigo())
            && repository.existsByCodigoIgnoreCase(request.codigo())) {
            throw new BusinessException("Ya existe un tipo de requisito con ese código");
        }
        mapper.updateEntity(request, existing);
        return mapper.toResponse(existing);
    }

    public void eliminar(Long id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Tipo de requisito", id);
        }
        if (requisitoModalidadRepository.existsByTipoRequisitoId(id)) {
            throw new BusinessException("No se puede eliminar el tipo de requisito porque está asociado a una o más modalidades");
        }
        repository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public TipoRequisitoResponse buscarPorId(Long id) {
        return mapper.toResponse(obtener(id));
    }

    @Transactional(readOnly = true)
    public PageResponse<TipoRequisitoResponse> listar(String q, AplicaA aplicaA, Boolean activo, Pageable pageable) {
        return PageResponse.of(repository.buscar(q, aplicaA, activo, pageable).map(mapper::toResponse));
    }

    @Transactional(readOnly = true)
    public List<TipoRequisitoResponse> listarActivos(AplicaA aplicaA) {
        return repository.findByActivoTrueOrderByNombreAsc().stream()
            .filter(t -> aplicaA == null
                || t.getAplicaA() == aplicaA
                || t.getAplicaA() == AplicaA.AMBOS)
            .map(mapper::toResponse)
            .toList();
    }

    public TipoRequisitoDocumental obtener(Long id) {
        return repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Tipo de requisito", id));
    }
}
