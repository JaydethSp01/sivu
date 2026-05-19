package co.uempresarial.sivu.trimestre.service;

import co.uempresarial.sivu.shared.exception.BusinessException;
import co.uempresarial.sivu.shared.exception.ResourceNotFoundException;
import co.uempresarial.sivu.trimestre.domain.EstadoPlanMejora;
import co.uempresarial.sivu.trimestre.domain.EvaluacionProfesorTrimestre;
import co.uempresarial.sivu.trimestre.domain.EvaluacionTutorTrimestre;
import co.uempresarial.sivu.trimestre.domain.PlanMejora;
import co.uempresarial.sivu.trimestre.domain.Trimestre;
import co.uempresarial.sivu.trimestre.persistence.EvaluacionProfesorTrimestreRepository;
import co.uempresarial.sivu.trimestre.persistence.EvaluacionTutorTrimestreRepository;
import co.uempresarial.sivu.trimestre.persistence.PlanMejoraRepository;
import co.uempresarial.sivu.trimestre.persistence.TrimestreRepository;
import co.uempresarial.sivu.trimestre.web.TrimestreMapper;
import co.uempresarial.sivu.trimestre.web.dto.PlanMejoraRequest;
import co.uempresarial.sivu.trimestre.web.dto.PlanMejoraResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class PlanMejoraService {

    private static final BigDecimal NOTA_MINIMA_APROBACION = new BigDecimal("3.00");
    private static final int PAGINAS_MAX = 15;

    private final PlanMejoraRepository repository;
    private final TrimestreRepository trimestreRepository;
    private final EvaluacionTutorTrimestreRepository evalTutorRepository;
    private final EvaluacionProfesorTrimestreRepository evalProfRepository;
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

    /* ============================================================
       F7 #54 — Aprobación PM con validación de nota ≥ 3.0
                + flag opción de grado + páginas ≤ 15
       ============================================================ */

    public PlanMejoraResponse aprobar(Long id) {
        PlanMejora pm = obtenerEntidad(id);
        if (pm.getEstado() == EstadoPlanMejora.APROBADO) {
            throw new BusinessException("El PM ya está APROBADO");
        }
        if (pm.getNumeroPaginas() != null && pm.getNumeroPaginas() > PAGINAS_MAX) {
            throw new BusinessException("El PM excede el máximo de " + PAGINAS_MAX
                + " páginas (actual: " + pm.getNumeroPaginas() + ")");
        }
        BigDecimal promedio = calcularNotaPromedio(pm.getTrimestre().getId());
        if (promedio.compareTo(NOTA_MINIMA_APROBACION) < 0) {
            throw new BusinessException("Nota promedio insuficiente para aprobar el PM (mínimo "
                + NOTA_MINIMA_APROBACION + ", actual: " + promedio + ")");
        }
        pm.setEstado(EstadoPlanMejora.APROBADO);
        pm.setNotaFinal(promedio);
        return mapper.toResponse(pm);
    }

    public PlanMejoraResponse marcarComoOpcionDeGrado(Long id, boolean esOpcion) {
        PlanMejora pm = obtenerEntidad(id);
        if (esOpcion && pm.getEstado() != EstadoPlanMejora.APROBADO) {
            throw new BusinessException(
                "Solo un PM APROBADO puede marcarse como opción de grado (actual: " + pm.getEstado() + ")");
        }
        pm.setEsOpcionDeGrado(esOpcion);
        return mapper.toResponse(pm);
    }

    private BigDecimal calcularNotaPromedio(Long trimestreId) {
        BigDecimal notaTutor = evalTutorRepository.findByTrimestreId(trimestreId)
            .map(EvaluacionTutorTrimestre::getNotaPonderada)
            .orElse(BigDecimal.ZERO);
        BigDecimal notaProf = evalProfRepository.findByTrimestreId(trimestreId)
            .map(EvaluacionProfesorTrimestre::getNotaPonderada)
            .orElse(BigDecimal.ZERO);
        if (notaTutor.signum() == 0 && notaProf.signum() == 0) {
            throw new BusinessException(
                "No hay evaluaciones registradas del Tutor ni del Profesor para este trimestre");
        }
        int divisor = (notaTutor.signum() > 0 ? 1 : 0) + (notaProf.signum() > 0 ? 1 : 0);
        return notaTutor.add(notaProf).divide(BigDecimal.valueOf(divisor), 2, RoundingMode.HALF_UP);
    }
}
