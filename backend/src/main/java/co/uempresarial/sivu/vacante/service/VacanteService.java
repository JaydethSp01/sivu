package co.uempresarial.sivu.vacante.service;

import co.uempresarial.sivu.empresa.domain.Empresa;
import co.uempresarial.sivu.empresa.domain.EstadoEmpresa;
import co.uempresarial.sivu.empresa.persistence.EmpresaRepository;
import co.uempresarial.sivu.security.service.CurrentUserService;
import co.uempresarial.sivu.shared.exception.BusinessException;
import co.uempresarial.sivu.shared.exception.ResourceNotFoundException;
import co.uempresarial.sivu.shared.pagination.PageResponse;
import co.uempresarial.sivu.vacante.domain.EstadoVacante;
import co.uempresarial.sivu.vacante.domain.Vacante;
import co.uempresarial.sivu.vacante.persistence.VacanteRepository;
import co.uempresarial.sivu.vacante.web.VacanteMapper;
import co.uempresarial.sivu.vacante.web.dto.VacanteRequest;
import co.uempresarial.sivu.vacante.web.dto.VacanteResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class VacanteService {

    private final VacanteRepository repository;
    private final EmpresaRepository empresaRepository;
    private final VacanteMapper mapper;
    private final CurrentUserService currentUser;

    public VacanteResponse crear(VacanteRequest request) {
        // Si el usuario es EMPRESA pura, no puede crear vacantes para otra empresa.
        Long empresaIdEffective = request.empresaId();
        if (currentUser.esEmpresaPura()) {
            Long propia = currentUser.currentEmpresaId().orElse(null);
            if (propia == null) {
                throw new BusinessException("Tu usuario no está vinculado a una empresa.");
            }
            empresaIdEffective = propia;
        }
        Empresa empresa = resolverEmpresa(empresaIdEffective);

        // Solo empresas COFORMADORAS (estado ACTIVA) pueden publicar vacantes.
        if (empresa.getEstado() != EstadoEmpresa.ACTIVA) {
            throw new BusinessException(
                "La empresa '" + empresa.getRazonSocial() + "' debe estar APROBADA por "
                    + "coordinación (estado ACTIVA) para publicar vacantes. Estado actual: "
                    + empresa.getEstado() + ".");
        }

        Vacante entity = mapper.toEntity(request);
        entity.setEmpresa(empresa);
        if (entity.getEstado() == null) {
            entity.setEstado(EstadoVacante.BORRADOR);
        }
        return mapper.toResponse(repository.save(entity));
    }

    public VacanteResponse actualizar(Long id, VacanteRequest request) {
        Vacante existing = obtener(id);
        // EMPRESA pura no puede mover la vacante a otra empresa.
        if (currentUser.esEmpresaPura()) {
            Long propia = currentUser.currentEmpresaId().orElse(-1L);
            if (!propia.equals(existing.getEmpresa().getId())) {
                throw new BusinessException("No puedes editar vacantes de otra empresa.");
            }
        } else if (request.empresaId() != null
            && !request.empresaId().equals(existing.getEmpresa().getId())) {
            existing.setEmpresa(resolverEmpresa(request.empresaId()));
        }
        mapper.updateEntity(request, existing);
        return mapper.toResponse(existing);
    }

    public void eliminar(Long id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Vacante", id);
        }
        repository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public VacanteResponse buscarPorId(Long id) {
        return mapper.toResponse(obtener(id));
    }

    @Transactional(readOnly = true)
    public PageResponse<VacanteResponse> listar(String q, EstadoVacante estado, Long empresaId, Pageable pageable) {
        // Auto-scope: EMPRESA pura solo ve sus propias vacantes (independiente del filtro
        // que venga en la URL).
        Long empresaIdEffective = empresaId;
        if (currentUser.esEmpresaPura()) {
            empresaIdEffective = currentUser.currentEmpresaId().orElse(-1L);
        }
        return PageResponse.of(repository.buscar(q, estado, empresaIdEffective, pageable).map(mapper::toResponse));
    }

    public Vacante obtener(Long id) {
        return repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Vacante", id));
    }

    private Empresa resolverEmpresa(Long empresaId) {
        return empresaRepository.findById(empresaId)
            .orElseThrow(() -> new ResourceNotFoundException("Empresa", empresaId));
    }
}
