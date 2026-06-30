package co.uempresarial.sivu.informefinalpm.service;

import co.uempresarial.sivu.notificacion.service.NotificacionService;
import co.uempresarial.sivu.informefinalpm.domain.EstadoInformeFinalPm;
import co.uempresarial.sivu.informefinalpm.domain.InformeFinalPm;
import co.uempresarial.sivu.informefinalpm.pdf.InformeFinalPmPdfGenerator;
import co.uempresarial.sivu.informefinalpm.persistence.InformeFinalPmRepository;
import co.uempresarial.sivu.informefinalpm.web.InformeFinalPmMapper;
import co.uempresarial.sivu.informefinalpm.web.dto.InformeFinalPmRequest;
import co.uempresarial.sivu.informefinalpm.web.dto.InformeFinalPmResponse;
import co.uempresarial.sivu.security.service.CurrentUserService;
import co.uempresarial.sivu.shared.exception.BusinessException;
import co.uempresarial.sivu.shared.exception.ResourceNotFoundException;
import co.uempresarial.sivu.trimestre.domain.PlanMejora;
import co.uempresarial.sivu.trimestre.persistence.PlanMejoraRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;

@Service
@RequiredArgsConstructor
@Transactional
public class InformeFinalPmService {

    private static final int PAGINAS_MAX = 15;

    /** Nota mínima aprobatoria del Informe Final (escala 0–5). */
    public static final BigDecimal NOTA_MINIMA_APROBACION = new BigDecimal("3.0");
    private static final BigDecimal NOTA_MIN = BigDecimal.ZERO;
    private static final BigDecimal NOTA_MAX = new BigDecimal("5.0");

    private final InformeFinalPmRepository repository;
    private final PlanMejoraRepository planMejoraRepository;
    private final NotificacionService notificacionService;
    private final CurrentUserService currentUser;
    private final InformeFinalPmMapper mapper;
    private final InformeFinalPmPdfGenerator pdfGenerator;

    public InformeFinalPmResponse guardarBorrador(Long planMejoraId, InformeFinalPmRequest request) {
        PlanMejora pm = planMejoraRepository.findById(planMejoraId)
            .orElseThrow(() -> new ResourceNotFoundException("PlanMejora", planMejoraId));

        InformeFinalPm informe = repository.findByPlanMejoraId(planMejoraId)
            .orElseGet(() -> InformeFinalPm.builder().planMejora(pm).build());

        if (informe.getEstado() == EstadoInformeFinalPm.APROBADO) {
            throw new BusinessException("El Informe Final ya está APROBADO y no se puede modificar");
        }

        informe.setTituloInforme(request.tituloInforme());
        if (request.nivel() != null && (request.nivel() < 1 || request.nivel() > 3)) {
            throw new BusinessException("El nivel del informe debe ser 1, 2 o 3");
        }
        informe.setNivel(request.nivel());
        informe.setCargoTutorEmpresarial(request.cargoTutorEmpresarial());
        informe.setResumenEjecutivo(request.resumenEjecutivo());
        informe.setContextualizacion(request.contextualizacion());
        informe.setPlanteamientoProblema(request.planteamientoProblema());
        informe.setMarcoTeorico(request.marcoTeorico());
        informe.setObjetivoGeneral(request.objetivoGeneral());
        informe.setObjetivosEspecificos(request.objetivosEspecificos());
        informe.setDiagnostico(request.diagnostico());
        informe.setMetodologia(request.metodologia());
        informe.setPropuestaSolucion(request.propuestaSolucion());
        informe.setFactibilidad(request.factibilidad());
        informe.setConclusiones(request.conclusiones());
        informe.setAnexos(request.anexos());
        informe.setNumeroPaginas(request.numeroPaginas());
        // No cambiamos estado en guardar — solo en entregar/aprobar/rechazar
        return mapper.toResponse(repository.save(informe));
    }

    public InformeFinalPmResponse entregar(Long id) {
        InformeFinalPm i = obtenerEntidad(id);
        if (i.getEstado() != EstadoInformeFinalPm.BORRADOR
            && i.getEstado() != EstadoInformeFinalPm.RECHAZADO) {
            throw new BusinessException("Solo se puede entregar desde BORRADOR o RECHAZADO (actual: "
                + i.getEstado() + ")");
        }
        validarSeccionesMinimas(i);

        // Contar páginas REALES del PDF generado (HU-11) — no confiar en el
        // valor auto-reportado por el estudiante.
        int paginasReales = contarPaginasReales(i);
        i.setNumeroPaginas((short) paginasReales);
        if (paginasReales > PAGINAS_MAX) {
            throw new BusinessException(
                "El Informe Final excede el máximo de " + PAGINAS_MAX
                + " páginas. El PDF generado tiene " + paginasReales + " páginas. "
                + "Reduce el contenido (resumen ejecutivo, marco teórico) o ajusta el formato.");
        }

        i.setEstado(EstadoInformeFinalPm.ENTREGADO);
        i.setFechaEntrega(OffsetDateTime.now());
        i.setFirmadoEstudiante(true);
        return mapper.toResponse(i);
    }

    /**
     * HU-11 — Genera el PDF y cuenta las páginas reales con PdfReader.
     * Evita confiar en el {@code numeroPaginas} auto-reportado por el estudiante.
     */
    private int contarPaginasReales(InformeFinalPm i) {
        try {
            byte[] pdf = pdfGenerator.generar(i);
            try (com.lowagie.text.pdf.PdfReader reader =
                     new com.lowagie.text.pdf.PdfReader(pdf)) {
                return reader.getNumberOfPages();
            }
        } catch (Exception ex) {
            throw new BusinessException("No se pudo verificar la longitud del informe: " + ex.getMessage());
        }
    }

    public InformeFinalPmResponse aprobar(Long id) {
        InformeFinalPm i = obtenerEntidad(id);
        if (i.getEstado() != EstadoInformeFinalPm.ENTREGADO) {
            throw new BusinessException("Solo se puede aprobar un informe ENTREGADO (actual: " + i.getEstado() + ")");
        }
        i.setEstado(EstadoInformeFinalPm.APROBADO);
        i.setFechaRevision(OffsetDateTime.now());
        currentUser.current().ifPresent(u -> {
            i.setRevisadoPorMongoId(u.getId());
            i.setRevisadoPorNombre(u.getNombres() + " " + u.getApellidos());
        });
        i.setFirmadoTutorAcad(true);
        notificacionService.enviarTexto(
            i.getPlanMejora().getTrimestre().getConvenio().getEstudiante().getEmail(),
            "[SIVU] ¡Tu Informe Final del PM fue APROBADO!",
            "Tu Informe Final del Plan Especial de Mejora (GTC-FM-16) fue aprobado por la Coordinación.");
        return mapper.toResponse(i);
    }

    public InformeFinalPmResponse rechazar(Long id, String observaciones) {
        InformeFinalPm i = obtenerEntidad(id);
        if (i.getEstado() != EstadoInformeFinalPm.ENTREGADO) {
            throw new BusinessException("Solo se puede rechazar un informe ENTREGADO (actual: " + i.getEstado() + ")");
        }
        if (observaciones == null || observaciones.isBlank()) {
            throw new BusinessException("Debes indicar observaciones al rechazar el informe");
        }
        i.setEstado(EstadoInformeFinalPm.RECHAZADO);
        i.setObservacionesRevisor(observaciones);
        i.setFechaRevision(OffsetDateTime.now());
        currentUser.current().ifPresent(u -> {
            i.setRevisadoPorMongoId(u.getId());
            i.setRevisadoPorNombre(u.getNombres() + " " + u.getApellidos());
        });
        notificacionService.enviarTexto(
            i.getPlanMejora().getTrimestre().getConvenio().getEstudiante().getEmail(),
            "[SIVU] Tu Informe Final del PM requiere ajustes",
            "Observaciones de la revisión:\n\n" + observaciones);
        return mapper.toResponse(i);
    }

    /**
     * BI-07 / RF-A04 — Registra la nota individual del tutor empresarial.
     * Recalcula la nota promedio automáticamente si ya existe la nota del profesor.
     * No bloquea el guardado aunque la nota sea inferior a la mínima aprobatoria.
     */
    public InformeFinalPmResponse registrarNotaTutor(Long id, BigDecimal nota) {
        InformeFinalPm i = obtenerEntidad(id);
        i.setNotaTutor(validarNota(nota, "tutor"));
        recalcularPromedio(i);
        return mapper.toResponse(i);
    }

    /**
     * BI-07 / RF-A04 — Registra la nota individual del profesor / docente acompañante.
     * Recalcula la nota promedio automáticamente si ya existe la nota del tutor.
     */
    public InformeFinalPmResponse registrarNotaProfesor(Long id, BigDecimal nota) {
        InformeFinalPm i = obtenerEntidad(id);
        i.setNotaProfesor(validarNota(nota, "profesor"));
        recalcularPromedio(i);
        return mapper.toResponse(i);
    }

    /** BI-07 / RF-A04 — El coordinador/admin marca o desmarca el informe como "Alto Impacto". */
    public InformeFinalPmResponse marcarAltoImpacto(Long id, boolean altoImpacto) {
        InformeFinalPm i = obtenerEntidad(id);
        i.setAltoImpacto(altoImpacto);
        return mapper.toResponse(i);
    }

    private BigDecimal validarNota(BigDecimal nota, String quien) {
        if (nota == null) {
            throw new BusinessException("Debes indicar la nota del " + quien);
        }
        if (nota.compareTo(NOTA_MIN) < 0 || nota.compareTo(NOTA_MAX) > 0) {
            throw new BusinessException("La nota del " + quien + " debe estar entre 0.0 y 5.0");
        }
        return nota.setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Calcula la nota promedio = (notaTutor + notaProfesor) / 2 cuando ambas están
     * presentes. El promedio NO es editable manualmente; siempre se deriva de las dos notas.
     */
    private void recalcularPromedio(InformeFinalPm i) {
        if (i.getNotaTutor() != null && i.getNotaProfesor() != null) {
            BigDecimal promedio = i.getNotaTutor()
                .add(i.getNotaProfesor())
                .divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);
            i.setNotaPromedio(promedio);
        } else {
            i.setNotaPromedio(null);
        }
    }

    @Transactional(readOnly = true)
    public InformeFinalPmResponse obtenerPorPlanMejora(Long planMejoraId) {
        return mapper.toResponse(repository.findByPlanMejoraId(planMejoraId)
            .orElseThrow(() -> new ResourceNotFoundException(
                "No hay Informe Final asociado al PlanMejora " + planMejoraId)));
    }

    public InformeFinalPm obtenerEntidad(Long id) {
        return repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("InformeFinalPm", id));
    }

    @Transactional(readOnly = true)
    public byte[] generarPdf(Long id) {
        return pdfGenerator.generar(obtenerEntidad(id));
    }

    private void validarSeccionesMinimas(InformeFinalPm i) {
        if (isBlank(i.getResumenEjecutivo())) throw new BusinessException("Falta sección: Resumen Ejecutivo");
        if (isBlank(i.getPlanteamientoProblema())) throw new BusinessException("Falta sección: Planteamiento del Problema");
        if (isBlank(i.getObjetivoGeneral())) throw new BusinessException("Falta sección: Objetivo General");
        if (isBlank(i.getMetodologia())) throw new BusinessException("Falta sección: Metodología");
        if (isBlank(i.getConclusiones())) throw new BusinessException("Falta sección: Conclusiones");
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}
