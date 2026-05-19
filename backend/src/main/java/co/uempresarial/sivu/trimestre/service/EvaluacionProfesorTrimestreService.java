package co.uempresarial.sivu.trimestre.service;

import co.uempresarial.sivu.shared.exception.BusinessException;
import co.uempresarial.sivu.shared.exception.ResourceNotFoundException;
import co.uempresarial.sivu.trimestre.domain.EvaluacionProfesorTrimestre;
import co.uempresarial.sivu.trimestre.domain.ParteFirmaTrimestre;
import co.uempresarial.sivu.trimestre.domain.Trimestre;
import co.uempresarial.sivu.trimestre.persistence.EvaluacionProfesorTrimestreRepository;
import co.uempresarial.sivu.trimestre.persistence.TrimestreRepository;
import co.uempresarial.sivu.trimestre.web.TrimestreMapper;
import co.uempresarial.sivu.trimestre.web.dto.EvaluacionProfesorRequest;
import co.uempresarial.sivu.trimestre.web.dto.EvaluacionProfesorResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
@RequiredArgsConstructor
@Transactional
public class EvaluacionProfesorTrimestreService {

    private final EvaluacionProfesorTrimestreRepository repository;
    private final TrimestreRepository trimestreRepository;
    private final TrimestreMapper mapper;

    @Transactional(readOnly = true)
    public EvaluacionProfesorResponse obtener(Long trimestreId) {
        return mapper.toResponse(obtenerEntidad(trimestreId));
    }

    public EvaluacionProfesorTrimestre obtenerEntidad(Long trimestreId) {
        return repository.findByTrimestreId(trimestreId)
            .orElseThrow(() -> new ResourceNotFoundException(
                "No existe Evaluación del Profesor para el trimestre " + trimestreId));
    }

    public EvaluacionProfesorResponse guardar(Long trimestreId, EvaluacionProfesorRequest request) {
        Trimestre trimestre = trimestreRepository.findById(trimestreId)
            .orElseThrow(() -> new ResourceNotFoundException("Trimestre", trimestreId));

        EvaluacionProfesorTrimestre e = repository.findByTrimestreId(trimestreId)
            .orElseGet(() -> EvaluacionProfesorTrimestre.builder().trimestre(trimestre).build());

        e.setCapacidades(request.capacidades());
        e.setActitudes(request.actitudes());
        e.setAplicacionDesempeno(request.aplicacionDesempeno());
        e.setAplicacionElaboracionPem(request.aplicacionElaboracionPem());
        e.setAplicacionSustentacionPem(request.aplicacionSustentacionPem());
        e.setObservaciones(request.observaciones());
        e.setFechaElaboracion(request.fechaElaboracion());

        e.setNotaPonderada(calcularNotaPonderada(request));

        return mapper.toResponse(repository.save(e));
    }

    public EvaluacionProfesorResponse firmar(Long trimestreId, ParteFirmaTrimestre parte) {
        EvaluacionProfesorTrimestre e = obtenerEntidad(trimestreId);
        switch (parte) {
            case PROFESOR -> {
                if (Boolean.TRUE.equals(e.getFirmadoProfesor())) {
                    throw new BusinessException("El profesor ya firmó esta evaluación");
                }
                e.setFirmadoProfesor(true);
            }
            case ESTUDIANTE -> {
                if (Boolean.TRUE.equals(e.getFirmadoEstudiante())) {
                    throw new BusinessException("El estudiante ya firmó esta evaluación");
                }
                e.setFirmadoEstudiante(true);
            }
            case TUTOR -> throw new BusinessException(
                "La evaluación del profesor solo la firman PROFESOR y ESTUDIANTE");
        }
        return mapper.toResponse(e);
    }

    /** Capacidades*0.10 + Actitudes*0.10 + (Desemp*0.20 + ElabPEM*0.50 + SustPEM*0.10). */
    static BigDecimal calcularNotaPonderada(EvaluacionProfesorRequest r) {
        BigDecimal total = BigDecimal.ZERO;
        total = total.add(mul(r.capacidades(), "0.10"));
        total = total.add(mul(r.actitudes(), "0.10"));
        total = total.add(mul(r.aplicacionDesempeno(), "0.20"));
        total = total.add(mul(r.aplicacionElaboracionPem(), "0.50"));
        total = total.add(mul(r.aplicacionSustentacionPem(), "0.10"));
        return total.setScale(2, RoundingMode.HALF_UP);
    }

    private static BigDecimal mul(BigDecimal v, String factor) {
        if (v == null) return BigDecimal.ZERO;
        return v.multiply(new BigDecimal(factor));
    }
}
