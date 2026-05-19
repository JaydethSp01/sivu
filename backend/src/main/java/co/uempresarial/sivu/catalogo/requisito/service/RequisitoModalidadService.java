package co.uempresarial.sivu.catalogo.requisito.service;

import co.uempresarial.sivu.catalogo.modalidad.domain.ModalidadVinculacion;
import co.uempresarial.sivu.catalogo.modalidad.persistence.ModalidadVinculacionRepository;
import co.uempresarial.sivu.catalogo.requisito.domain.RequisitoModalidad;
import co.uempresarial.sivu.catalogo.requisito.domain.TipoRequisitoDocumental;
import co.uempresarial.sivu.catalogo.requisito.persistence.RequisitoModalidadRepository;
import co.uempresarial.sivu.catalogo.requisito.persistence.TipoRequisitoDocumentalRepository;
import co.uempresarial.sivu.catalogo.requisito.web.RequisitoModalidadMapper;
import co.uempresarial.sivu.catalogo.requisito.web.dto.RequisitoModalidadRequest;
import co.uempresarial.sivu.catalogo.requisito.web.dto.RequisitoModalidadResponse;
import co.uempresarial.sivu.shared.exception.BusinessException;
import co.uempresarial.sivu.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class RequisitoModalidadService {

    private final RequisitoModalidadRepository repository;
    private final ModalidadVinculacionRepository modalidadRepository;
    private final TipoRequisitoDocumentalRepository tipoRequisitoRepository;
    private final RequisitoModalidadMapper mapper;

    public RequisitoModalidadResponse agregar(RequisitoModalidadRequest request) {
        if (repository.existsByModalidadIdAndTipoRequisitoId(request.modalidadId(), request.tipoRequisitoId())) {
            throw new BusinessException("Ya existe un requisito para esa combinación de modalidad y tipo de requisito");
        }
        ModalidadVinculacion modalidad = resolverModalidad(request.modalidadId());
        TipoRequisitoDocumental tipo = resolverTipoRequisito(request.tipoRequisitoId());

        RequisitoModalidad entity = RequisitoModalidad.builder()
            .modalidad(modalidad)
            .tipoRequisito(tipo)
            .obligatorio(request.obligatorio() != null ? request.obligatorio() : Boolean.TRUE)
            .orden(request.orden() != null ? request.orden() : (short) 0)
            .instrucciones(request.instrucciones())
            .build();

        return mapper.toResponse(repository.save(entity));
    }

    public RequisitoModalidadResponse actualizar(Long id, RequisitoModalidadRequest request) {
        RequisitoModalidad existing = obtener(id);
        // No se permite cambiar la combinación (modalidad, tipoRequisito); se ignora silenciosamente.
        if (request.obligatorio() != null) {
            existing.setObligatorio(request.obligatorio());
        }
        if (request.orden() != null) {
            existing.setOrden(request.orden());
        }
        if (request.instrucciones() != null) {
            existing.setInstrucciones(request.instrucciones());
        }
        return mapper.toResponse(existing);
    }

    public void eliminar(Long id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Requisito de modalidad", id);
        }
        repository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<RequisitoModalidadResponse> listarPorModalidad(Long modalidadId) {
        if (!modalidadRepository.existsById(modalidadId)) {
            throw new ResourceNotFoundException("Modalidad", modalidadId);
        }
        return repository.findByModalidadIdOrderByOrdenAsc(modalidadId).stream()
            .map(mapper::toResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public RequisitoModalidadResponse buscarPorId(Long id) {
        return mapper.toResponse(obtener(id));
    }

    public RequisitoModalidad obtener(Long id) {
        return repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Requisito de modalidad", id));
    }

    private ModalidadVinculacion resolverModalidad(Long id) {
        return modalidadRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Modalidad", id));
    }

    private TipoRequisitoDocumental resolverTipoRequisito(Long id) {
        return tipoRequisitoRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Tipo de requisito", id));
    }
}
