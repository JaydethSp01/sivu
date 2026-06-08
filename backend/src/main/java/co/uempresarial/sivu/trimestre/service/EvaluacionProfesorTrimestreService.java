package co.uempresarial.sivu.trimestre.service;

import co.uempresarial.sivu.security.service.CurrentUserService;
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
    private final CurrentUserService currentUser;
    private final co.uempresarial.sivu.trimestre.pdf.EvaluacionProfesorPdfGenerator pdfGenerator;

    @Transactional(readOnly = true)
    public EvaluacionProfesorResponse obtener(Long trimestreId) {
        return mapper.toResponse(obtenerEntidad(trimestreId));
    }

    @Transactional(readOnly = true)
    public byte[] generarPdf(Long trimestreId) {
        return pdfGenerator.generar(obtenerEntidad(trimestreId));
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

        // Corte 1 (campos sin sufijo)
        e.setCapacidades(request.capacidades());
        e.setActitudes(request.actitudes());
        e.setAplicacionDesempeno(request.aplicacionDesempeno());
        e.setAplicacionElaboracionPem(request.aplicacionElaboracionPem());
        e.setAplicacionSustentacionPem(request.aplicacionSustentacionPem());
        e.setNotaPonderada(calcularNotaPonderadaCorte1(request));
        // Observaciones/fecha de corte 1 priorizan el nuevo campo; cae al legacy.
        e.setObservacionesC1(
            request.observacionesC1() != null ? request.observacionesC1() : request.observaciones());
        e.setFechaC1(
            request.fechaC1() != null ? request.fechaC1() : request.fechaElaboracion());

        // Corte 2
        e.setCapacidadesC2(request.capacidadesC2());
        e.setActitudesC2(request.actitudesC2());
        e.setAplicacionDesempenoC2(request.aplicacionDesempenoC2());
        e.setAplicacionElaboracionPemC2(request.aplicacionElaboracionPemC2());
        e.setAplicacionSustentacionPemC2(request.aplicacionSustentacionPemC2());
        e.setNotaPonderadaC2(calcularNotaPonderadaCorte2(request));
        e.setObservacionesC2(request.observacionesC2());
        e.setFechaC2(request.fechaC2());

        // Campos legacy combinados (para retrocompatibilidad en lecturas):
        // observaciones = corte1 + "\n\n" + corte2; fechaElaboracion = corte2 ?? corte1
        e.setObservaciones(combinarObservaciones(e.getObservacionesC1(), e.getObservacionesC2()));
        e.setFechaElaboracion(e.getFechaC2() != null ? e.getFechaC2() : e.getFechaC1());

        return mapper.toResponse(repository.save(e));
    }

    private static String combinarObservaciones(String c1, String c2) {
        boolean hasC1 = c1 != null && !c1.isBlank();
        boolean hasC2 = c2 != null && !c2.isBlank();
        if (hasC1 && hasC2) return "[1° corte] " + c1 + "\n\n[2° corte] " + c2;
        if (hasC1) return c1;
        if (hasC2) return c2;
        return null;
    }

    public EvaluacionProfesorResponse firmar(Long trimestreId, ParteFirmaTrimestre parte) {
        EvaluacionProfesorTrimestre e = obtenerEntidad(trimestreId);
        java.time.OffsetDateTime now = java.time.OffsetDateTime.now();
        String nombreActor = currentUser.current()
            .map(u -> (u.getNombres() + " " + u.getApellidos()).trim())
            .orElse(null);
        switch (parte) {
            case PROFESOR -> {
                if (Boolean.TRUE.equals(e.getFirmadoProfesor())) {
                    throw new BusinessException("El profesor ya firmó esta evaluación");
                }
                e.setFirmadoProfesor(true);
                e.setFechaFirmaProfesor(now);
                e.setFirmadoProfesorNombre(nombreActor);
            }
            case ESTUDIANTE -> {
                if (Boolean.TRUE.equals(e.getFirmadoEstudiante())) {
                    throw new BusinessException("El estudiante ya firmó esta evaluación");
                }
                e.setFirmadoEstudiante(true);
                e.setFechaFirmaEstudiante(now);
                e.setFirmadoEstudianteNombre(nombreActor);
            }
            case TUTOR -> throw new BusinessException(
                "La evaluación del profesor solo la firman PROFESOR y ESTUDIANTE");
        }
        return mapper.toResponse(e);
    }

    /** Corte 1 — Capacidades*0.10 + Actitudes*0.10 + (Desemp*0.20 + ElabPEM*0.50 + SustPEM*0.10). */
    static BigDecimal calcularNotaPonderadaCorte1(EvaluacionProfesorRequest r) {
        if (r.capacidades() == null && r.actitudes() == null
            && r.aplicacionDesempeno() == null && r.aplicacionElaboracionPem() == null
            && r.aplicacionSustentacionPem() == null) {
            return null;
        }
        BigDecimal total = BigDecimal.ZERO;
        total = total.add(mul(r.capacidades(), "0.10"));
        total = total.add(mul(r.actitudes(), "0.10"));
        total = total.add(mul(r.aplicacionDesempeno(), "0.20"));
        total = total.add(mul(r.aplicacionElaboracionPem(), "0.50"));
        total = total.add(mul(r.aplicacionSustentacionPem(), "0.10"));
        return total.setScale(2, RoundingMode.HALF_UP);
    }

    /** Corte 2 — mismas ponderaciones que corte 1, sobre los campos *C2. */
    static BigDecimal calcularNotaPonderadaCorte2(EvaluacionProfesorRequest r) {
        if (r.capacidadesC2() == null && r.actitudesC2() == null
            && r.aplicacionDesempenoC2() == null && r.aplicacionElaboracionPemC2() == null
            && r.aplicacionSustentacionPemC2() == null) {
            return null;
        }
        BigDecimal total = BigDecimal.ZERO;
        total = total.add(mul(r.capacidadesC2(), "0.10"));
        total = total.add(mul(r.actitudesC2(), "0.10"));
        total = total.add(mul(r.aplicacionDesempenoC2(), "0.20"));
        total = total.add(mul(r.aplicacionElaboracionPemC2(), "0.50"));
        total = total.add(mul(r.aplicacionSustentacionPemC2(), "0.10"));
        return total.setScale(2, RoundingMode.HALF_UP);
    }

    private static BigDecimal mul(BigDecimal v, String factor) {
        if (v == null) return BigDecimal.ZERO;
        return v.multiply(new BigDecimal(factor));
    }
}
