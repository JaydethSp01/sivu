package co.uempresarial.sivu.trimestre.service;

import co.uempresarial.sivu.security.service.CurrentUserService;
import co.uempresarial.sivu.shared.exception.BusinessException;
import co.uempresarial.sivu.shared.exception.ResourceNotFoundException;
import co.uempresarial.sivu.trimestre.domain.EvaluacionTutorTrimestre;
import co.uempresarial.sivu.trimestre.domain.ParteFirmaTrimestre;
import co.uempresarial.sivu.trimestre.domain.Trimestre;
import co.uempresarial.sivu.trimestre.pdf.EvaluacionTutorPdfGenerator;
import co.uempresarial.sivu.trimestre.persistence.EvaluacionTutorTrimestreRepository;
import co.uempresarial.sivu.trimestre.persistence.TrimestreRepository;
import co.uempresarial.sivu.trimestre.web.TrimestreMapper;
import co.uempresarial.sivu.trimestre.web.dto.EvaluacionTutorRequest;
import co.uempresarial.sivu.trimestre.web.dto.EvaluacionTutorResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
@RequiredArgsConstructor
@Transactional
public class EvaluacionTutorTrimestreService {

    private final EvaluacionTutorTrimestreRepository repository;
    private final TrimestreRepository trimestreRepository;
    private final TrimestreMapper mapper;
    private final CurrentUserService currentUser;
    private final EvaluacionTutorPdfGenerator pdfGenerator;

    @Transactional(readOnly = true)
    public EvaluacionTutorResponse obtener(Long trimestreId) {
        return mapper.toResponse(obtenerEntidad(trimestreId));
    }

    /** Genera el PDF DENTRO de la transacción para que las colecciones/proxies
     *  LAZY se carguen con la sesión abierta (open-in-view está en false). */
    @Transactional(readOnly = true)
    public byte[] generarPdf(Long trimestreId) {
        return pdfGenerator.generar(obtenerEntidad(trimestreId));
    }

    public EvaluacionTutorTrimestre obtenerEntidad(Long trimestreId) {
        return repository.findByTrimestreId(trimestreId)
            .orElseThrow(() -> new ResourceNotFoundException(
                "No existe Evaluación del Tutor para el trimestre " + trimestreId));
    }

    public EvaluacionTutorResponse guardar(Long trimestreId, EvaluacionTutorRequest request) {
        Trimestre trimestre = trimestreRepository.findById(trimestreId)
            .orElseThrow(() -> new ResourceNotFoundException("Trimestre", trimestreId));

        EvaluacionTutorTrimestre e = repository.findByTrimestreId(trimestreId)
            .orElseGet(() -> EvaluacionTutorTrimestre.builder().trimestre(trimestre).build());

        e.setCapacidades(request.capacidades());
        e.setActitudes(request.actitudes());
        e.setAplicacionDesempeno(request.aplicacionDesempeno());
        e.setAplicacionElaboracionPem(request.aplicacionElaboracionPem());
        e.setAplicacionSustentacionPem(request.aplicacionSustentacionPem());
        e.setContinuidadConEmpresa(request.continuidadConEmpresa());
        e.setObservaciones(request.observaciones());
        e.setFechaElaboracion(request.fechaElaboracion());

        e.setNotaPonderada(calcularNotaPonderada(request));

        return mapper.toResponse(repository.save(e));
    }

    public EvaluacionTutorResponse firmar(Long trimestreId, ParteFirmaTrimestre parte) {
        EvaluacionTutorTrimestre e = obtenerEntidad(trimestreId);
        java.time.OffsetDateTime now = java.time.OffsetDateTime.now();
        String nombreActor = currentUser.current()
            .map(u -> (u.getNombres() + " " + u.getApellidos()).trim())
            .orElse(null);
        switch (parte) {
            case TUTOR -> {
                if (Boolean.TRUE.equals(e.getFirmadoTutor())) {
                    throw new BusinessException("El tutor ya firmó esta evaluación");
                }
                e.setFirmadoTutor(true);
                e.setFechaFirmaTutor(now);
                e.setFirmadoTutorNombre(nombreActor);
            }
            case ESTUDIANTE -> {
                if (Boolean.TRUE.equals(e.getFirmadoEstudiante())) {
                    throw new BusinessException("El estudiante ya firmó esta evaluación");
                }
                e.setFirmadoEstudiante(true);
                e.setFechaFirmaEstudiante(now);
                e.setFirmadoEstudianteNombre(nombreActor);
            }
            case PROFESOR -> throw new BusinessException(
                "La evaluación del tutor solo la firman TUTOR y ESTUDIANTE");
        }
        return mapper.toResponse(e);
    }

    /** Capacidades*0.40 + Actitudes*0.40 + (Desemp*0.10 + ElabPEM*0.05 + SustPEM*0.05). */
    static BigDecimal calcularNotaPonderada(EvaluacionTutorRequest r) {
        BigDecimal total = BigDecimal.ZERO;
        total = total.add(mul(r.capacidades(), "0.40"));
        total = total.add(mul(r.actitudes(), "0.40"));
        total = total.add(mul(r.aplicacionDesempeno(), "0.10"));
        total = total.add(mul(r.aplicacionElaboracionPem(), "0.05"));
        total = total.add(mul(r.aplicacionSustentacionPem(), "0.05"));
        return total.setScale(2, RoundingMode.HALF_UP);
    }

    private static BigDecimal mul(BigDecimal v, String factor) {
        if (v == null) return BigDecimal.ZERO;
        return v.multiply(new BigDecimal(factor));
    }
}
