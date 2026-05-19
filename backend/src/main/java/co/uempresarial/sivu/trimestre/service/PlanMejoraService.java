package co.uempresarial.sivu.trimestre.service;

import co.uempresarial.sivu.shared.exception.BusinessException;
import co.uempresarial.sivu.shared.exception.ResourceNotFoundException;
import co.uempresarial.sivu.trimestre.domain.EstadoPlanMejora;
import co.uempresarial.sivu.trimestre.domain.PlanMejora;
import co.uempresarial.sivu.trimestre.domain.Trimestre;
import co.uempresarial.sivu.trimestre.persistence.PlanMejoraRepository;
import co.uempresarial.sivu.trimestre.persistence.TrimestreRepository;
import co.uempresarial.sivu.trimestre.web.TrimestreMapper;
import co.uempresarial.sivu.trimestre.web.dto.PlanMejoraRequest;
import co.uempresarial.sivu.trimestre.web.dto.PlanMejoraResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class PlanMejoraService {

    private final PlanMejoraRepository repository;
    private final TrimestreRepository trimestreRepository;
    private final TrimestreMapper mapper;

    @Transactional(readOnly = true)
    public List<PlanMejoraResponse> listarPorTrimestre(Long trimestreId) {
        if (!trimestreRepository.existsById(trimestreId)) {
            throw new ResourceNotFoundException("Trimestre", trimestreId);
        }
        return repository.findByTrimestreIdOrderByNumeroAsc(trimestreId).stream()
            .map(mapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public PlanMejoraResponse obtener(Long id) {
        return mapper.toResponse(obtenerEntidad(id));
    }

    public PlanMejora obtenerEntidad(Long id) {
        return repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("PlanMejora", id));
    }

    public PlanMejoraResponse crear(Long trimestreId, PlanMejoraRequest request) {
        Trimestre trimestre = trimestreRepository.findById(trimestreId)
            .orElseThrow(() -> new ResourceNotFoundException("Trimestre", trimestreId));
        if (repository.existsByTrimestreIdAndNumero(trimestreId, request.numero())) {
            throw new BusinessException("Ya existe el plan de mejora número " + request.numero()
                + " en este trimestre");
        }
        PlanMejora pm = PlanMejora.builder()
            .trimestre(trimestre)
            .numero(request.numero())
            .titulo(request.titulo())
            .problema(request.problema())
            .objetivo(request.objetivo())
            .actividades(request.actividades())
            .indicadores(request.indicadores())
            .estado(request.estado() != null ? request.estado() : EstadoPlanMejora.BORRADOR)
            .build();
        return mapper.toResponse(repository.save(pm));
    }

    public PlanMejoraResponse actualizar(Long id, PlanMejoraRequest request) {
        PlanMejora pm = obtenerEntidad(id);
        if (request.numero() != null && !request.numero().equals(pm.getNumero())) {
            if (repository.existsByTrimestreIdAndNumero(pm.getTrimestre().getId(), request.numero())) {
                throw new BusinessException("Ya existe el plan de mejora número " + request.numero()
                    + " en este trimestre");
            }
            pm.setNumero(request.numero());
        }
        pm.setTitulo(request.titulo());
        pm.setProblema(request.problema());
        pm.setObjetivo(request.objetivo());
        pm.setActividades(request.actividades());
        pm.setIndicadores(request.indicadores());
        if (request.estado() != null) pm.setEstado(request.estado());
        return mapper.toResponse(pm);
    }

    public void eliminar(Long id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("PlanMejora", id);
        }
        repository.deleteById(id);
    }
}
