package co.uempresarial.sivu.trimestre.service;

import co.uempresarial.sivu.convenio.domain.Convenio;
import co.uempresarial.sivu.estudiante.domain.Estudiante;
import co.uempresarial.sivu.notificacion.service.NotificacionCoformacionService;
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
import co.uempresarial.sivu.trimestre.web.dto.EvaluacionTutorExternoResponse;
import co.uempresarial.sivu.trimestre.web.dto.EvaluacionTutorRequest;
import co.uempresarial.sivu.trimestre.web.dto.EvaluacionTutorResponse;
import co.uempresarial.sivu.tutoracceso.domain.PropositoTokenTutor;
import co.uempresarial.sivu.tutoracceso.service.TokenAccesoTutorService;
import co.uempresarial.sivu.tutoracceso.web.dto.ValidacionTokenResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class EvaluacionTutorTrimestreService {

    private final EvaluacionTutorTrimestreRepository repository;
    private final TrimestreRepository trimestreRepository;
    private final TrimestreMapper mapper;
    private final CurrentUserService currentUser;
    private final EvaluacionTutorPdfGenerator pdfGenerator;
    private final TokenAccesoTutorService tokenAccesoService;
    private final NotificacionCoformacionService notificacionCoformacion;

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

        aplicar(e, request);

        return mapper.toResponse(repository.save(e));
    }

    /** Copia los campos del request a la entidad y recalcula la nota ponderada (no editable). */
    private void aplicar(EvaluacionTutorTrimestre e, EvaluacionTutorRequest request) {
        e.setCapacidades(request.capacidades());
        e.setActitudes(request.actitudes());
        e.setAplicacionDesempeno(request.aplicacionDesempeno());
        e.setAplicacionElaboracionPem(request.aplicacionElaboracionPem());
        e.setAplicacionSustentacionPem(request.aplicacionSustentacionPem());
        e.setContinuidadConEmpresa(request.continuidadConEmpresa());
        e.setObservaciones(request.observaciones());
        e.setFechaElaboracion(request.fechaElaboracion());
        e.setNotaPonderada(calcularNotaPonderada(request));
    }

    /** El campo de continuidad (GAC-FM-9) es obligatorio para finalizar/enviar la evaluación. */
    private void exigirContinuidad(EvaluacionTutorTrimestre e) {
        if (e.getContinuidadConEmpresa() == null) {
            throw new BusinessException(
                "Debe indicar si el estudiante tiene continuidad con la empresa (Sí/No) "
                + "antes de finalizar la evaluación del tutor");
        }
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
                exigirContinuidad(e);
                e.setFirmadoTutor(true);
                e.setFechaFirmaTutor(now);
                e.setFirmadoTutorNombre(nombreActor);
                // RF-D01/D02: el tutor finaliza/firma su evaluación → avisar al estudiante.
                notificarEvaluacionTutor(e);
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

    // ───────────────────────────── Acceso externo del tutor (token) ─────────────────────────────

    /** Valida el token externo y devuelve el contexto + la evaluación actual (puede ser null). */
    @Transactional(readOnly = true)
    public EvaluacionTutorExternoResponse validarAccesoExterno(Long trimestreId, String token) {
        ValidacionTokenResponse ctx = tokenAccesoService.validarToken(token);
        verificarContexto(trimestreId, ctx);
        EvaluacionTutorResponse eval = repository.findByTrimestreId(trimestreId)
            .map(mapper::toResponse)
            .orElse(null);
        return new EvaluacionTutorExternoResponse(ctx.tutorId(), ctx.convenioId(), ctx.proposito(), eval);
    }

    /**
     * El tutor empresarial diligencia su evaluación usando el token externo (sin cuenta).
     * Si {@code finalizar} es true: exige continuidad, firma como tutor y consume el token.
     */
    public EvaluacionTutorExternoResponse guardarExterno(Long trimestreId, String token,
                                                         EvaluacionTutorRequest request, boolean finalizar) {
        ValidacionTokenResponse ctx = tokenAccesoService.validarToken(token);
        Trimestre trimestre = verificarContexto(trimestreId, ctx);

        EvaluacionTutorTrimestre e = repository.findByTrimestreId(trimestreId)
            .orElseGet(() -> EvaluacionTutorTrimestre.builder().trimestre(trimestre).build());

        aplicar(e, request);

        if (finalizar) {
            exigirContinuidad(e);
            if (!Boolean.TRUE.equals(e.getFirmadoTutor())) {
                e.setFirmadoTutor(true);
                e.setFechaFirmaTutor(OffsetDateTime.now());
                e.setFirmadoTutorNombre(nombreTutor(trimestre));
            }
        }

        EvaluacionTutorTrimestre saved = repository.save(e);

        if (finalizar) {
            tokenAccesoService.marcarUsado(token);
            // RF-D01/D02: el tutor externo finaliza su evaluación → avisar al estudiante.
            notificarEvaluacionTutor(saved);
        }

        return new EvaluacionTutorExternoResponse(
            ctx.tutorId(), ctx.convenioId(), ctx.proposito(), mapper.toResponse(saved));
    }

    /** Verifica propósito y que el token corresponda al convenio del trimestre. */
    private Trimestre verificarContexto(Long trimestreId, ValidacionTokenResponse ctx) {
        Trimestre trimestre = trimestreRepository.findById(trimestreId)
            .orElseThrow(() -> new ResourceNotFoundException("Trimestre", trimestreId));
        if (ctx.proposito() != PropositoTokenTutor.EVALUACION_TUTOR) {
            throw new BusinessException("El token no autoriza diligenciar la evaluación del tutor");
        }
        Long convenioId = trimestre.getConvenio() != null ? trimestre.getConvenio().getId() : null;
        if (ctx.convenioId() != null && !ctx.convenioId().equals(convenioId)) {
            throw new BusinessException("El token no corresponde al convenio de este trimestre");
        }
        return trimestre;
    }

    private static String nombreTutor(Trimestre t) {
        if (t.getConvenio() != null && t.getConvenio().getTutorEmpresarial() != null) {
            var tut = t.getConvenio().getTutorEmpresarial();
            String nombre = (safe(tut.getNombres()) + " " + safe(tut.getApellidos())).trim();
            return nombre.isEmpty() ? null : nombre;
        }
        return null;
    }

    private static String safe(String s) {
        return s == null ? "" : s;
    }

    /** RF-D01/D02 — notifica al estudiante que la evaluación del tutor fue registrada/finalizada (graceful). */
    private void notificarEvaluacionTutor(EvaluacionTutorTrimestre e) {
        try {
            Trimestre t = e.getTrimestre();
            Convenio c = t != null ? t.getConvenio() : null;
            Estudiante est = c != null ? c.getEstudiante() : null;
            if (est == null || est.getEmail() == null || est.getEmail().isBlank()) {
                return;
            }
            String corte = "Evaluación del Tutor Empresarial — T" + (t.getNumero() == null ? "" : t.getNumero());
            String nombre = (safe(est.getNombres()) + " " + safe(est.getApellidos())).trim();
            notificacionCoformacion.notificarCorteCalificado(
                est.getEmail(), nombre, corte,
                e.getNotaPonderada() == null ? "—" : e.getNotaPonderada().toPlainString(),
                NotificacionCoformacionService.REF_TRIMESTRE, null);
        } catch (Exception ex) {
            log.warn("No se pudo notificar la evaluación del tutor del trimestre {}: {}",
                e.getTrimestre() != null ? e.getTrimestre().getId() : null, ex.getMessage());
        }
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
