package co.uempresarial.sivu.expediente.service;

import co.uempresarial.sivu.calificacion.persistence.CalificacionConsolidadaRepository;
import co.uempresarial.sivu.calificacion.service.CorteCalculoService;
import co.uempresarial.sivu.calificacion.web.dto.CalificacionDesgloseResponse;
import co.uempresarial.sivu.cohorte.domain.CohorteEstudiante;
import co.uempresarial.sivu.cohorte.persistence.CohorteEstudianteRepository;
import co.uempresarial.sivu.cohorte.persistence.CohorteRepository;
import co.uempresarial.sivu.convenio.domain.Convenio;
import co.uempresarial.sivu.convenio.persistence.ConvenioRepository;
import co.uempresarial.sivu.documento.domain.Documento;
import co.uempresarial.sivu.documento.persistence.DocumentoRepository;
import co.uempresarial.sivu.empresa.domain.Empresa;
import co.uempresarial.sivu.estudiante.domain.Estudiante;
import co.uempresarial.sivu.estudiante.persistence.EstudianteRepository;
import co.uempresarial.sivu.expediente.domain.EstadoSeccionExpediente;
import co.uempresarial.sivu.expediente.web.dto.ExpedienteResponse;
import co.uempresarial.sivu.expediente.web.dto.ExpedienteResponse.CalificacionResumen;
import co.uempresarial.sivu.expediente.web.dto.ExpedienteResponse.ConvenioResumen;
import co.uempresarial.sivu.expediente.web.dto.ExpedienteResponse.DocumentoExpediente;
import co.uempresarial.sivu.expediente.web.dto.ExpedienteResponse.EmpresaResumen;
import co.uempresarial.sivu.expediente.web.dto.ExpedienteResponse.EstudianteResumen;
import co.uempresarial.sivu.expediente.web.dto.ExpedienteResponse.SeccionActas;
import co.uempresarial.sivu.expediente.web.dto.ExpedienteResponse.SeccionActas.ActaItem;
import co.uempresarial.sivu.expediente.web.dto.ExpedienteResponse.SeccionDocumento;
import co.uempresarial.sivu.expediente.web.dto.ExpedienteResponse.SeccionInformeFinal;
import co.uempresarial.sivu.expediente.web.dto.ExpedienteResponse.TrimestreExpediente;
import co.uempresarial.sivu.expediente.web.dto.ExpedienteResponse.TutoresResumen;
import co.uempresarial.sivu.expediente.web.dto.ExpedienteResumenCohorte;
import co.uempresarial.sivu.informefinalpm.domain.EstadoInformeFinalPm;
import co.uempresarial.sivu.informefinalpm.domain.InformeFinalPm;
import co.uempresarial.sivu.informefinalpm.persistence.InformeFinalPmRepository;
import co.uempresarial.sivu.security.service.CurrentUserService;
import co.uempresarial.sivu.shared.exception.ResourceNotFoundException;
import co.uempresarial.sivu.trimestre.domain.ActaReunion;
import co.uempresarial.sivu.trimestre.domain.EvaluacionProfesorTrimestre;
import co.uempresarial.sivu.trimestre.domain.EvaluacionTutorTrimestre;
import co.uempresarial.sivu.trimestre.domain.PlanActividades;
import co.uempresarial.sivu.trimestre.domain.PlanMejora;
import co.uempresarial.sivu.trimestre.domain.Trimestre;
import co.uempresarial.sivu.trimestre.persistence.ActaReunionRepository;
import co.uempresarial.sivu.trimestre.persistence.EvaluacionProfesorTrimestreRepository;
import co.uempresarial.sivu.trimestre.persistence.EvaluacionTutorTrimestreRepository;
import co.uempresarial.sivu.trimestre.persistence.PlanActividadesRepository;
import co.uempresarial.sivu.trimestre.persistence.PlanMejoraRepository;
import co.uempresarial.sivu.trimestre.persistence.TrimestreRepository;
import co.uempresarial.sivu.tutor.domain.Tutor;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

/**
 * BI-16 / RF-B01 — Servicio agregador del Expediente Digital Unificado.
 *
 * <p>Arma al vuelo, en una sola transacción de solo lectura, el {@link ExpedienteResponse} de un
 * estudiante consolidando los módulos existentes (convenio, trimestre, calificación, informe final,
 * documentos). No persiste nada propio (no hay tabla de expediente) y no altera la lógica de los
 * módulos origen: solo consume sus repositorios/servicios.</p>
 *
 * <p>El estado de cada documento se deriva de sus campos de firma/estado/PDF. La nota final reúsa
 * {@link CorteCalculoService} (BI-10). Todas las relaciones LAZY que se navegan se resuelven dentro
 * de la transacción para evitar {@code LazyInitializationException}.</p>
 */
@Service
@RequiredArgsConstructor
public class ExpedienteService {

    private final EstudianteRepository estudianteRepository;
    private final ConvenioRepository convenioRepository;
    private final TrimestreRepository trimestreRepository;
    private final PlanActividadesRepository planActividadesRepository;
    private final ActaReunionRepository actaReunionRepository;
    private final EvaluacionProfesorTrimestreRepository evaluacionProfesorRepository;
    private final EvaluacionTutorTrimestreRepository evaluacionTutorRepository;
    private final PlanMejoraRepository planMejoraRepository;
    private final InformeFinalPmRepository informeFinalPmRepository;
    private final DocumentoRepository documentoRepository;
    private final CalificacionConsolidadaRepository calificacionConsolidadaRepository;
    private final CorteCalculoService corteCalculoService;
    private final CohorteRepository cohorteRepository;
    private final CohorteEstudianteRepository cohorteEstudianteRepository;
    private final CurrentUserService currentUser;

    /**
     * Construye el expediente del estudiante. Si {@code convenioId} es null toma el convenio más
     * reciente del estudiante. Aplica auto-scope: un ESTUDIANTE puro solo puede ver el suyo.
     */
    @Transactional(readOnly = true)
    public ExpedienteResponse obtenerPorEstudiante(Long estudianteId, Long convenioId) {
        verificarPropiedadEstudiante(estudianteId);

        Estudiante estudiante = estudianteRepository.findById(estudianteId)
            .orElseThrow(() -> new ResourceNotFoundException("Estudiante", estudianteId));

        Convenio convenio = resolverConvenio(estudianteId, convenioId);
        return armarExpediente(estudiante, convenio);
    }

    /**
     * Construye el expediente a partir de un convenio. Aplica auto-scope por dueño (estudiante).
     */
    @Transactional(readOnly = true)
    public ExpedienteResponse obtenerPorConvenio(Long convenioId) {
        Convenio convenio = convenioRepository.findById(convenioId)
            .orElseThrow(() -> new ResourceNotFoundException("Convenio", convenioId));
        Estudiante estudiante = convenio.getEstudiante();
        verificarPropiedadEstudiante(estudiante != null ? estudiante.getId() : null);
        return armarExpediente(estudiante, convenio);
    }

    /**
     * Listado liviano de expedientes de una cohorte (vista de Coformación): estudiante, estado
     * general y nota final consolidada. Sin auto-scope: solo COORDINADOR/ADMIN deben invocarlo.
     */
    @Transactional(readOnly = true)
    public List<ExpedienteResumenCohorte> listarPorCohorte(Long cohorteId) {
        if (!cohorteRepository.existsById(cohorteId)) {
            throw new ResourceNotFoundException("Cohorte", cohorteId);
        }
        List<CohorteEstudiante> inscripciones = cohorteEstudianteRepository.listarPorCohorte(cohorteId, null);
        List<ExpedienteResumenCohorte> filas = new ArrayList<>(inscripciones.size());
        for (CohorteEstudiante inscripcion : inscripciones) {
            Estudiante est = inscripcion.getEstudiante();
            if (est == null) {
                continue;
            }
            Convenio convenio = resolverConvenio(est.getId(), null);
            BigDecimal notaFinal = convenio == null ? null
                : calificacionConsolidadaRepository.findByConvenioId(convenio.getId())
                    .map(c -> c.getNotaFinal())
                    .orElse(null);
            filas.add(new ExpedienteResumenCohorte(
                est.getId(),
                est.getNombres(),
                est.getApellidos(),
                est.getNumeroDocumento(),
                est.getProgramaAcademico(),
                convenio == null ? null : convenio.getId(),
                convenio == null ? null : convenio.getNumeroConvenio(),
                convenio == null ? null : convenio.getEstado().name(),
                notaFinal,
                estadoGeneral(convenio)
            ));
        }
        return filas;
    }

    // ───────────────────────────── ensamblado ─────────────────────────────

    private ExpedienteResponse armarExpediente(Estudiante estudiante, Convenio convenio) {
        EstudianteResumen estudianteResumen = estudiante == null ? null : new EstudianteResumen(
            estudiante.getId(),
            estudiante.getNombres(),
            estudiante.getApellidos(),
            estudiante.getNumeroDocumento(),
            estudiante.getEmail(),
            estudiante.getProgramaAcademico(),
            estudiante.getSemestre(),
            estudiante.getEstado() == null ? null : estudiante.getEstado().name()
        );

        ConvenioResumen convenioResumen = convenio == null ? null : new ConvenioResumen(
            convenio.getId(),
            convenio.getNumeroConvenio(),
            convenio.getEstado() == null ? null : convenio.getEstado().name(),
            convenio.getFechaInicio(),
            convenio.getFechaFin(),
            convenio.getSemestreAcademico(),
            convenio.getEsContinuidad(),
            idDocumento(convenio == null ? null : convenio.getDocumentoPdf()),
            idDocumento(convenio == null ? null : convenio.getCertificadoPdf())
        );

        EmpresaResumen empresaResumen = empresaResumen(convenio);
        TutoresResumen tutoresResumen = convenio == null ? null : new TutoresResumen(
            nombreTutor(convenio.getTutorAcademico()),
            nombreTutor(convenio.getTutorEmpresarial())
        );

        CalificacionResumen calificacionResumen = convenio == null ? null : calcularCalificacion(convenio.getId());
        List<TrimestreExpediente> trimestres = convenio == null ? List.of() : armarTrimestres(convenio.getId());
        List<DocumentoExpediente> documentos = estudiante == null ? List.of()
            : armarDocumentos(estudiante.getId());

        return new ExpedienteResponse(
            estudianteResumen,
            convenioResumen,
            empresaResumen,
            tutoresResumen,
            calificacionResumen,
            trimestres,
            documentos,
            estadoGeneral(convenio)
        );
    }

    private EmpresaResumen empresaResumen(Convenio convenio) {
        if (convenio == null) {
            return null;
        }
        Empresa empresa = convenio.getEmpresa();
        if (empresa == null) {
            return null;
        }
        return new EmpresaResumen(
            empresa.getId(),
            empresa.getRazonSocial(),
            empresa.getNit(),
            empresa.getSector(),
            empresa.getCiudad()
        );
    }

    private CalificacionResumen calcularCalificacion(Long convenioId) {
        try {
            // Reúsa el cálculo trazable de BI-10 (sin forzar ownership: ya se validó arriba).
            CalificacionDesgloseResponse d = corteCalculoService.calcularYConsolidar(convenioId, false);
            return new CalificacionResumen(
                d.notaCorte1(), d.notaCorte2(), d.notaCorte3(), d.notaFinal(), d.completa(), d.bloqueada());
        } catch (RuntimeException ex) {
            // Fallback robusto: si el cálculo no está disponible, lee el consolidado almacenado.
            return calificacionConsolidadaRepository.findByConvenioId(convenioId)
                .map(c -> new CalificacionResumen(
                    c.getNotaCorte1(), c.getNotaCorte2(), c.getNotaCorte3(), c.getNotaFinal(),
                    c.getNotaFinal() != null, Boolean.TRUE.equals(c.getBloqueada())))
                .orElse(new CalificacionResumen(null, null, null, null, false, false));
        }
    }

    private List<TrimestreExpediente> armarTrimestres(Long convenioId) {
        List<Trimestre> trimestres = trimestreRepository.findByConvenioIdOrderByNumeroAsc(convenioId);
        List<TrimestreExpediente> resultado = new ArrayList<>(trimestres.size());
        for (Trimestre t : trimestres) {
            Long trimestreId = t.getId();

            SeccionDocumento plan = planActividadesRepository.findByTrimestreId(trimestreId)
                .map(this::seccionPlanActividades)
                .orElseGet(() -> seccionVacia("Plan de Actividades"));

            SeccionActas actas = seccionActas(
                actaReunionRepository.findByTrimestreIdOrderByNumeroAsc(trimestreId));

            SeccionDocumento docente = evaluacionProfesorRepository.findByTrimestreId(trimestreId)
                .map(this::seccionEvaluacionDocente)
                .orElseGet(() -> seccionVacia("Evaluación Docente (GAC-FM-1)"));

            SeccionDocumento tutor = evaluacionTutorRepository.findByTrimestreId(trimestreId)
                .map(this::seccionEvaluacionTutor)
                .orElseGet(() -> seccionVacia("Evaluación del Tutor (GAC-FM-9)"));

            List<SeccionInformeFinal> informes = armarInformesFinales(trimestreId);

            resultado.add(new TrimestreExpediente(
                trimestreId,
                t.getNumero(),
                t.getMateriaNucleo(),
                t.getEstado() == null ? null : t.getEstado().name(),
                plan,
                actas,
                docente,
                tutor,
                informes
            ));
        }
        return resultado;
    }

    private List<SeccionInformeFinal> armarInformesFinales(Long trimestreId) {
        List<PlanMejora> planes = planMejoraRepository.findByTrimestreIdOrderByNumeroAsc(trimestreId);
        List<SeccionInformeFinal> informes = new ArrayList<>();
        for (PlanMejora pm : planes) {
            Optional<InformeFinalPm> informeOpt = informeFinalPmRepository.findByPlanMejoraId(pm.getId());
            if (informeOpt.isEmpty()) {
                continue;
            }
            InformeFinalPm informe = informeOpt.get();
            informes.add(new SeccionInformeFinal(
                informe.getId(),
                pm.getId(),
                informe.getTituloInforme() != null ? informe.getTituloInforme() : pm.getTitulo(),
                informe.getEstado() == null ? null : informe.getEstado().name(),
                estadoInformeFinal(informe),
                informe.getNotaPromedio(),
                idDocumento(informe.getDocumentoPdf())
            ));
        }
        return informes;
    }

    private List<DocumentoExpediente> armarDocumentos(Long estudianteId) {
        List<Documento> documentos = documentoRepository.findByEstudianteIdOrderByCreatedAtDesc(estudianteId);
        List<DocumentoExpediente> resultado = new ArrayList<>(documentos.size());
        for (Documento d : documentos) {
            resultado.add(new DocumentoExpediente(
                d.getId(),
                d.getTipo() == null ? null : d.getTipo().name(),
                d.getNombreOriginal(),
                d.getEstado() == null ? null : d.getEstado().name(),
                d.getCreatedAt()
            ));
        }
        return resultado;
    }

    // ───────────────────────── derivación de estados ─────────────────────────

    private SeccionDocumento seccionPlanActividades(PlanActividades p) {
        boolean fe = Boolean.TRUE.equals(p.getFirmadoEstudiante());
        boolean ft = Boolean.TRUE.equals(p.getFirmadoTutor());
        boolean fp = Boolean.TRUE.equals(p.getFirmadoProfesor());
        boolean tienePdf = p.getDocumentoPdf() != null;
        EstadoSeccionExpediente estado;
        if (tienePdf) {
            estado = EstadoSeccionExpediente.PDF_GENERADO;
        } else if (fe && ft && fp) {
            estado = EstadoSeccionExpediente.FIRMADO;
        } else if (fe || ft || fp) {
            estado = EstadoSeccionExpediente.EN_REVISION;
        } else {
            estado = EstadoSeccionExpediente.PENDIENTE;
        }
        return new SeccionDocumento("Plan de Actividades", estado, idDocumento(p.getDocumentoPdf()), fe, ft, fp);
    }

    private SeccionDocumento seccionEvaluacionDocente(EvaluacionProfesorTrimestre e) {
        boolean fp = Boolean.TRUE.equals(e.getFirmadoProfesor());
        boolean fe = Boolean.TRUE.equals(e.getFirmadoEstudiante());
        boolean tienePdf = e.getDocumentoPdf() != null;
        boolean diligenciada = e.getNotaPonderada() != null || e.getNotaPonderadaC2() != null;
        EstadoSeccionExpediente estado;
        if (tienePdf) {
            estado = EstadoSeccionExpediente.PDF_GENERADO;
        } else if (fp && fe) {
            estado = EstadoSeccionExpediente.FIRMADO;
        } else if (fp || fe || diligenciada) {
            estado = EstadoSeccionExpediente.EN_REVISION;
        } else {
            estado = EstadoSeccionExpediente.PENDIENTE;
        }
        return new SeccionDocumento("Evaluación Docente (GAC-FM-1)", estado,
            idDocumento(e.getDocumentoPdf()), fe, false, fp);
    }

    private SeccionDocumento seccionEvaluacionTutor(EvaluacionTutorTrimestre e) {
        boolean ft = Boolean.TRUE.equals(e.getFirmadoTutor());
        boolean fe = Boolean.TRUE.equals(e.getFirmadoEstudiante());
        boolean tienePdf = e.getDocumentoPdf() != null;
        boolean diligenciada = e.getNotaPonderada() != null;
        EstadoSeccionExpediente estado;
        if (tienePdf) {
            estado = EstadoSeccionExpediente.PDF_GENERADO;
        } else if (ft && fe) {
            estado = EstadoSeccionExpediente.FIRMADO;
        } else if (ft || fe || diligenciada) {
            estado = EstadoSeccionExpediente.EN_REVISION;
        } else {
            estado = EstadoSeccionExpediente.PENDIENTE;
        }
        return new SeccionDocumento("Evaluación del Tutor (GAC-FM-9)", estado,
            idDocumento(e.getDocumentoPdf()), fe, ft, false);
    }

    private SeccionActas seccionActas(List<ActaReunion> actas) {
        int total = actas.size();
        int firmadas = 0;
        List<ActaItem> items = new ArrayList<>(total);
        for (ActaReunion a : actas) {
            boolean fe = Boolean.TRUE.equals(a.getFirmadoEstudiante());
            boolean ft = Boolean.TRUE.equals(a.getFirmadoTutor());
            boolean fp = Boolean.TRUE.equals(a.getFirmadoProfesor());
            boolean tienePdf = a.getDocumentoPdf() != null;
            boolean completa = fe && ft && fp;
            if (completa) {
                firmadas++;
            }
            EstadoSeccionExpediente estadoActa;
            if (tienePdf) {
                estadoActa = EstadoSeccionExpediente.PDF_GENERADO;
            } else if (completa) {
                estadoActa = EstadoSeccionExpediente.FIRMADO;
            } else if (fe || ft || fp) {
                estadoActa = EstadoSeccionExpediente.EN_REVISION;
            } else {
                estadoActa = EstadoSeccionExpediente.PENDIENTE;
            }
            items.add(new ActaItem(a.getId(), a.getNumero(), a.getFecha(), a.getAsunto(),
                estadoActa, idDocumento(a.getDocumentoPdf())));
        }
        EstadoSeccionExpediente estado;
        if (total == 0) {
            estado = EstadoSeccionExpediente.NO_INICIADO;
        } else if (firmadas == total) {
            estado = EstadoSeccionExpediente.FIRMADO;
        } else {
            estado = EstadoSeccionExpediente.EN_REVISION;
        }
        return new SeccionActas("Actas de Reunión", estado, total, firmadas, items);
    }

    private EstadoSeccionExpediente estadoInformeFinal(InformeFinalPm informe) {
        if (informe.getDocumentoPdf() != null) {
            return EstadoSeccionExpediente.PDF_GENERADO;
        }
        EstadoInformeFinalPm estado = informe.getEstado();
        if (estado == EstadoInformeFinalPm.APROBADO) {
            return EstadoSeccionExpediente.FIRMADO;
        }
        if (estado == EstadoInformeFinalPm.ENTREGADO || estado == EstadoInformeFinalPm.RECHAZADO) {
            return EstadoSeccionExpediente.EN_REVISION;
        }
        return EstadoSeccionExpediente.PENDIENTE;
    }

    private SeccionDocumento seccionVacia(String nombre) {
        return new SeccionDocumento(nombre, EstadoSeccionExpediente.NO_INICIADO, null, false, false, false);
    }

    // ───────────────────────────── utilidades ─────────────────────────────

    private Convenio resolverConvenio(Long estudianteId, Long convenioId) {
        if (convenioId != null) {
            Convenio convenio = convenioRepository.findById(convenioId)
                .orElseThrow(() -> new ResourceNotFoundException("Convenio", convenioId));
            if (convenio.getEstudiante() == null
                || !Objects.equals(estudianteId, convenio.getEstudiante().getId())) {
                throw new ResourceNotFoundException(
                    "El convenio " + convenioId + " no pertenece al estudiante " + estudianteId);
            }
            return convenio;
        }
        // Convenio más reciente del estudiante (puede no existir aún).
        return convenioRepository
            .buscar(null, estudianteId, null, PageRequest.of(0, 1, Sort.by(Sort.Direction.DESC, "id")))
            .getContent().stream().findFirst().orElse(null);
    }

    private String estadoGeneral(Convenio convenio) {
        if (convenio == null || convenio.getEstado() == null) {
            return "SIN_CONVENIO";
        }
        return convenio.getEstado().name();
    }

    private String nombreTutor(Tutor tutor) {
        if (tutor == null) {
            return null;
        }
        String nombres = tutor.getNombres() == null ? "" : tutor.getNombres();
        String apellidos = tutor.getApellidos() == null ? "" : tutor.getApellidos();
        return (nombres + " " + apellidos).trim();
    }

    private Long idDocumento(Documento documento) {
        return documento == null ? null : documento.getId();
    }

    /** Auto-scope: un ESTUDIANTE puro solo puede consultar su propio expediente. */
    private void verificarPropiedadEstudiante(Long estudianteId) {
        if (currentUser.esEstudiantePuro()) {
            Long propio = currentUser.currentEstudianteId().orElse(null);
            if (propio == null || !Objects.equals(propio, estudianteId)) {
                throw new AccessDeniedException("No puede consultar el expediente de otro estudiante");
            }
        }
    }
}
