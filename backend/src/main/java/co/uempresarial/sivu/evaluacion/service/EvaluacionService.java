package co.uempresarial.sivu.evaluacion.service;

import co.uempresarial.sivu.convenio.domain.Convenio;
import co.uempresarial.sivu.convenio.persistence.ConvenioRepository;
import co.uempresarial.sivu.evaluacion.domain.Evaluacion;
import co.uempresarial.sivu.evaluacion.domain.TipoEvaluacion;
import co.uempresarial.sivu.evaluacion.persistence.EvaluacionRepository;
import co.uempresarial.sivu.evaluacion.web.EvaluacionMapper;
import co.uempresarial.sivu.evaluacion.web.dto.EvaluacionRequest;
import co.uempresarial.sivu.evaluacion.web.dto.EvaluacionResponse;
import co.uempresarial.sivu.evaluacion.web.dto.ResumenEvaluacionesResponse;
import co.uempresarial.sivu.shared.exception.BusinessException;
import co.uempresarial.sivu.shared.exception.ResourceNotFoundException;
import co.uempresarial.sivu.tutor.domain.TipoTutor;
import co.uempresarial.sivu.tutor.domain.Tutor;
import co.uempresarial.sivu.tutor.persistence.TutorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class EvaluacionService {

    private final EvaluacionRepository repository;
    private final ConvenioRepository convenioRepository;
    private final TutorRepository tutorRepository;
    private final EvaluacionMapper mapper;

    public EvaluacionResponse crear(EvaluacionRequest request) {
        Convenio convenio = convenioRepository.findById(request.convenioId())
            .orElseThrow(() -> new ResourceNotFoundException("Convenio", request.convenioId()));
        Tutor tutor = tutorRepository.findById(request.tutorId())
            .orElseThrow(() -> new ResourceNotFoundException("Tutor", request.tutorId()));

        repository.findByConvenioIdAndTipoAndEvaluadorTipo(
            request.convenioId(), request.tipo(), tutor.getTipo())
            .ifPresent(e -> { throw new BusinessException(
                "Ya existe una evaluación " + request.tipo() + " del tipo " + tutor.getTipo()
                + " para este convenio (id=" + e.getId() + ")"); });

        Evaluacion ev = Evaluacion.builder()
            .convenio(convenio)
            .tutor(tutor)
            .tipo(request.tipo())
            .evaluadorTipo(tutor.getTipo())
            .fechaEvaluacion(request.fechaEvaluacion() != null ? request.fechaEvaluacion() : LocalDate.now())
            .calificacion(request.calificacion())
            .competenciasTecnicas(request.competenciasTecnicas())
            .competenciasBlandas(request.competenciasBlandas())
            .recomendacion(request.recomendacion())
            .observaciones(request.observaciones())
            .build();
        return mapper.toResponse(repository.save(ev));
    }

    public EvaluacionResponse actualizar(Long id, EvaluacionRequest request) {
        Evaluacion ev = obtener(id);
        ev.setCalificacion(request.calificacion());
        ev.setCompetenciasTecnicas(request.competenciasTecnicas());
        ev.setCompetenciasBlandas(request.competenciasBlandas());
        ev.setRecomendacion(request.recomendacion());
        ev.setObservaciones(request.observaciones());
        if (request.fechaEvaluacion() != null) {
            ev.setFechaEvaluacion(request.fechaEvaluacion());
        }
        return mapper.toResponse(ev);
    }

    public void eliminar(Long id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Evaluacion", id);
        }
        repository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public EvaluacionResponse buscarPorId(Long id) {
        return mapper.toResponse(obtener(id));
    }

    @Transactional(readOnly = true)
    public ResumenEvaluacionesResponse resumenPorConvenio(Long convenioId) {
        if (!convenioRepository.existsById(convenioId)) {
            throw new ResourceNotFoundException("Convenio", convenioId);
        }
        List<Evaluacion> lista = repository.findByConvenioIdOrderByFechaEvaluacionAsc(convenioId);

        if (lista.isEmpty()) {
            return new ResumenEvaluacionesResponse(
                convenioId, 0, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                false, false, null, List.of());
        }

        BigDecimal sumCal = lista.stream().map(Evaluacion::getCalificacion).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal sumTec = lista.stream().map(Evaluacion::getCompetenciasTecnicas).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal sumBla = lista.stream().map(Evaluacion::getCompetenciasBlandas).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal n = BigDecimal.valueOf(lista.size());
        BigDecimal promCal = sumCal.divide(n, 2, RoundingMode.HALF_UP);
        BigDecimal promTec = sumTec.divide(n, 2, RoundingMode.HALF_UP);
        BigDecimal promBla = sumBla.divide(n, 2, RoundingMode.HALF_UP);

        boolean finalAcad = lista.stream().anyMatch(e -> e.getTipo() == TipoEvaluacion.FINAL && e.getEvaluadorTipo() == TipoTutor.ACADEMICO);
        boolean finalEmp = lista.stream().anyMatch(e -> e.getTipo() == TipoEvaluacion.FINAL && e.getEvaluadorTipo() == TipoTutor.EMPRESARIAL);

        BigDecimal sugerida = null;
        if (finalAcad && finalEmp) {
            BigDecimal acad = lista.stream()
                .filter(e -> e.getTipo() == TipoEvaluacion.FINAL && e.getEvaluadorTipo() == TipoTutor.ACADEMICO)
                .map(Evaluacion::getCalificacion).findFirst().orElse(BigDecimal.ZERO);
            BigDecimal emp = lista.stream()
                .filter(e -> e.getTipo() == TipoEvaluacion.FINAL && e.getEvaluadorTipo() == TipoTutor.EMPRESARIAL)
                .map(Evaluacion::getCalificacion).findFirst().orElse(BigDecimal.ZERO);
            // Promedio ponderado 50/50 entre tutor académico y empresarial.
            sugerida = acad.add(emp).divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);
        }

        List<EvaluacionResponse> responses = lista.stream().map(mapper::toResponse).toList();
        return new ResumenEvaluacionesResponse(convenioId, lista.size(), promCal, promTec, promBla,
            finalAcad, finalEmp, sugerida, responses);
    }

    public Evaluacion obtener(Long id) {
        return repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Evaluacion", id));
    }
}
