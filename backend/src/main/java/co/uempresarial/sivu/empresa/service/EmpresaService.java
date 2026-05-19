package co.uempresarial.sivu.empresa.service;

import co.uempresarial.sivu.empresa.domain.Empresa;
import co.uempresarial.sivu.empresa.domain.EstadoEmpresa;
import co.uempresarial.sivu.empresa.persistence.EmpresaRepository;
import co.uempresarial.sivu.empresa.web.EmpresaMapper;
import co.uempresarial.sivu.empresa.web.dto.EmpresaRequest;
import co.uempresarial.sivu.empresa.web.dto.EmpresaResponse;
import co.uempresarial.sivu.empresa.web.dto.ProponerEmpresaRequest;
import co.uempresarial.sivu.estudiante.domain.Estudiante;
import co.uempresarial.sivu.estudiante.persistence.EstudianteRepository;
import co.uempresarial.sivu.security.service.CurrentUserService;
import co.uempresarial.sivu.shared.exception.BusinessException;
import co.uempresarial.sivu.shared.exception.ResourceNotFoundException;
import co.uempresarial.sivu.shared.pagination.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class EmpresaService {

    private final EmpresaRepository repository;
    private final EstudianteRepository estudianteRepository;
    private final EmpresaMapper mapper;
    private final CurrentUserService currentUser;

    public EmpresaResponse crear(EmpresaRequest request) {
        if (repository.existsByNit(request.nit())) {
            throw new BusinessException("Ya existe una empresa con ese NIT");
        }
        Empresa entity = mapper.toEntity(request);
        if (entity.getEstado() == null) {
            entity.setEstado(EstadoEmpresa.EN_REVISION);
        }
        return mapper.toResponse(repository.save(entity));
    }

    public EmpresaResponse actualizar(Long id, EmpresaRequest request) {
        Empresa existing = obtener(id);
        if (!existing.getNit().equals(request.nit())
            && repository.existsByNit(request.nit())) {
            throw new BusinessException("Ya existe una empresa con ese NIT");
        }
        mapper.updateEntity(request, existing);
        return mapper.toResponse(existing);
    }

    /**
     * Un estudiante propone una empresa nueva para alianza. La empresa queda en estado
     * EN_REVISION; coordinación valida los documentos legales y luego aprueba o rechaza.
     */
    public EmpresaResponse proponer(ProponerEmpresaRequest request) {
        if (repository.existsByNit(request.nit())) {
            throw new BusinessException(
                "Ya existe una empresa con ese NIT. Si ya está en el catálogo, busca su vacante directamente.");
        }
        Estudiante estudiante = estudianteRepository.findById(request.estudianteId())
            .orElseThrow(() -> new ResourceNotFoundException("Estudiante", request.estudianteId()));

        Empresa empresa = Empresa.builder()
            .nit(request.nit())
            .razonSocial(request.razonSocial())
            .nombreComercial(request.nombreComercial())
            .sector(request.sector())
            .ciudad(request.ciudad())
            .direccion(request.direccion())
            .emailContacto(request.emailContacto())
            .telefonoContacto(request.telefonoContacto())
            .contactoNombre(request.contactoNombre())
            .contactoCargo(request.contactoCargo())
            .estado(EstadoEmpresa.EN_REVISION)
            .propuestaPorEstudiante(estudiante)
            .build();
        return mapper.toResponse(repository.save(empresa));
    }

    public EmpresaResponse aprobar(Long id) {
        Empresa empresa = obtener(id);
        if (empresa.getEstado() == EstadoEmpresa.ACTIVA) {
            throw new BusinessException("La empresa ya está aprobada (ACTIVA)");
        }
        empresa.setEstado(EstadoEmpresa.ACTIVA);
        empresa.setFechaAprobacion(OffsetDateTime.now());
        empresa.setMotivoRechazo(null);
        return mapper.toResponse(empresa);
    }

    public EmpresaResponse rechazar(Long id, String motivo) {
        Empresa empresa = obtener(id);
        if (motivo == null || motivo.isBlank()) {
            throw new BusinessException("Debes indicar el motivo del rechazo");
        }
        empresa.setEstado(EstadoEmpresa.INACTIVA);
        empresa.setMotivoRechazo(motivo);
        empresa.setFechaAprobacion(null);
        return mapper.toResponse(empresa);
    }

    public void eliminar(Long id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Empresa", id);
        }
        repository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public EmpresaResponse buscarPorId(Long id) {
        return mapper.toResponse(obtener(id));
    }

    @Transactional(readOnly = true)
    public PageResponse<EmpresaResponse> listar(String q, EstadoEmpresa estado, Pageable pageable) {
        // Auto-scope: EMPRESA pura solo ve su propia empresa.
        if (currentUser.esEmpresaPura()) {
            Long propia = currentUser.currentEmpresaId().orElse(null);
            if (propia == null) {
                return PageResponse.of(new PageImpl<>(List.of(), pageable, 0));
            }
            Page<EmpresaResponse> page = repository.findById(propia)
                .map(e -> (Page<EmpresaResponse>) new PageImpl<>(
                    List.of(mapper.toResponse(e)), pageable, 1))
                .orElseGet(() -> new PageImpl<>(List.of(), pageable, 0));
            return PageResponse.of(page);
        }
        return PageResponse.of(repository.buscar(q, estado, pageable).map(mapper::toResponse));
    }

    public Empresa obtener(Long id) {
        return repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Empresa", id));
    }
}
