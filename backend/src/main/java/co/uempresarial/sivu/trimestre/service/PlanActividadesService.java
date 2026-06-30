package co.uempresarial.sivu.trimestre.service;

import co.uempresarial.sivu.documento.domain.Documento;
import co.uempresarial.sivu.documento.domain.EstadoDocumento;
import co.uempresarial.sivu.documento.domain.TipoDocumentoSoporte;
import co.uempresarial.sivu.documento.persistence.DocumentoRepository;
import co.uempresarial.sivu.convenio.domain.Convenio;
import co.uempresarial.sivu.estudiante.domain.Estudiante;
import co.uempresarial.sivu.notificacion.service.NotificacionCoformacionService;
import co.uempresarial.sivu.security.domain.Rol;
import co.uempresarial.sivu.tutor.domain.Tutor;
import co.uempresarial.sivu.security.domain.Usuario;
import co.uempresarial.sivu.shared.exception.BusinessException;
import co.uempresarial.sivu.shared.exception.ResourceNotFoundException;
import co.uempresarial.sivu.trimestre.domain.*;
import co.uempresarial.sivu.trimestre.domain.PlanActividadesComentario.TipoComentarioPlan;
import co.uempresarial.sivu.trimestre.persistence.PlanActividadesComentarioRepository;
import co.uempresarial.sivu.trimestre.persistence.PlanActividadesRepository;
import co.uempresarial.sivu.trimestre.persistence.TrimestreRepository;
import co.uempresarial.sivu.trimestre.web.TrimestreMapper;
import co.uempresarial.sivu.trimestre.web.dto.PlanActividadesComentarioRequest;
import co.uempresarial.sivu.trimestre.web.dto.PlanActividadesComentarioResponse;
import co.uempresarial.sivu.trimestre.web.dto.PlanActividadesRequest;
import co.uempresarial.sivu.trimestre.web.dto.PlanActividadesResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class PlanActividadesService {

    private final PlanActividadesRepository repository;
    private final TrimestreRepository trimestreRepository;
    private final PlanActividadesComentarioRepository comentarioRepository;
    private final DocumentoRepository documentoRepository;
    private final TrimestreMapper mapper;
    private final co.uempresarial.sivu.trimestre.pdf.PlanActividadesPdfGenerator pdfGenerator;
    private final NotificacionCoformacionService notificacionCoformacion;

    @Value("${app.storage.path:./storage/documentos}")
    private String storagePath;

    @Transactional(readOnly = true)
    public PlanActividadesResponse obtener(Long trimestreId) {
        return mapper.toResponse(obtenerEntidad(trimestreId));
    }

    @Transactional(readOnly = true)
    public byte[] generarPdf(Long trimestreId) {
        return pdfGenerator.generar(obtenerEntidad(trimestreId));
    }

    public PlanActividades obtenerEntidad(Long trimestreId) {
        return repository.findByTrimestreId(trimestreId)
            .orElseThrow(() -> new ResourceNotFoundException(
                "No existe Plan de Actividades para el trimestre " + trimestreId));
    }

    public PlanActividadesResponse guardar(Long trimestreId, PlanActividadesRequest request) {
        Trimestre trimestre = trimestreRepository.findById(trimestreId)
            .orElseThrow(() -> new ResourceNotFoundException("Trimestre", trimestreId));

        PlanActividades pa = repository.findByTrimestreId(trimestreId)
            .orElseGet(() -> PlanActividades.builder().trimestre(trimestre).build());

        pa.setEscenarioCoformacion(request.escenarioCoformacion());
        pa.setPemDescripcionEscenario(request.pemDescripcionEscenario());
        pa.setPemObjetivoGeneral(request.pemObjetivoGeneral());

        pa.getObjetivos().clear();
        if (request.objetivos() != null) {
            int i = 0;
            for (PlanActividadesRequest.ObjetivoRequest o : request.objetivos()) {
                pa.getObjetivos().add(PlanActividadesObjetivo.builder()
                    .planActividades(pa)
                    .escenario(o.escenario())
                    .descripcion(o.descripcion())
                    .seleccionado(o.seleccionado() == null || o.seleccionado())
                    .orden(o.orden() != null ? o.orden() : (short) i++)
                    .build());
            }
        }

        pa.getMeses().clear();
        if (request.meses() != null) {
            for (PlanActividadesRequest.MesRequest m : request.meses()) {
                pa.getMeses().add(PlanActividadesMes.builder()
                    .planActividades(pa)
                    .mes(m.mes())
                    .areaRotacion(m.areaRotacion())
                    .actividades(m.actividades())
                    .tutorNombre(m.tutorNombre())
                    .build());
            }
        }

        PlanActividades saved = repository.save(pa);
        return mapper.toResponse(saved);
    }

    public PlanActividadesResponse firmar(Long trimestreId, ParteFirmaTrimestre parte) {
        PlanActividades pa = obtenerEntidad(trimestreId);
        OffsetDateTime ahora = OffsetDateTime.now();
        switch (parte) {
            case ESTUDIANTE -> {
                if (Boolean.TRUE.equals(pa.getFirmadoEstudiante())) {
                    throw new BusinessException("El estudiante ya firmó este PA");
                }
                pa.setFirmadoEstudiante(true);
                pa.setFechaFirmaEstudiante(ahora);
                // RF-D01/D02: el estudiante envía/manda el plan a revisión → avisar a docente y tutor.
                notificarPlanEnviado(pa);
            }
            case TUTOR -> {
                if (Boolean.TRUE.equals(pa.getFirmadoTutor())) {
                    throw new BusinessException("El tutor ya firmó este PA");
                }
                pa.setFirmadoTutor(true);
                pa.setFechaFirmaTutor(ahora);
                if (pa.getEstado() == EstadoPlanActividades.BORRADOR
                    || pa.getEstado() == EstadoPlanActividades.ENVIADO_TUTOR) {
                    pa.setEstado(EstadoPlanActividades.APROBADO_TUTOR);
                }
            }
            case PROFESOR -> {
                if (Boolean.TRUE.equals(pa.getFirmadoProfesor())) {
                    throw new BusinessException("El profesor ya firmó este PA");
                }
                pa.setFirmadoProfesor(true);
                pa.setFechaFirmaProfesor(ahora);
            }
        }
        if (Boolean.TRUE.equals(pa.getFirmadoEstudiante())
            && Boolean.TRUE.equals(pa.getFirmadoTutor())
            && Boolean.TRUE.equals(pa.getFirmadoProfesor())) {
            pa.setEstado(EstadoPlanActividades.APROBADO_PROFESOR);
            // BI-04 / RF-A01: al completar las 3 firmas, archivar el PA en el expediente.
            archivarPdfEnExpediente(pa);
            // RF-D01/D02: con las 3 firmas (PDF generado) → avisar que el documento quedó firmado.
            notificarPlanFirmado(pa);
        }
        return mapper.toResponse(pa);
    }

    // ----- Notificaciones automáticas (RF-D01 / RF-D02) — graceful -----

    /** Avisa a docente (tutor académico) y tutor empresarial que el estudiante envió el plan a revisión. */
    private void notificarPlanEnviado(PlanActividades pa) {
        try {
            Trimestre t = pa.getTrimestre();
            Convenio c = t != null ? t.getConvenio() : null;
            if (c == null) return;
            Estudiante est = c.getEstudiante();
            Tutor docente = c.getTutorAcademico();
            Tutor tutorEmp = c.getTutorEmpresarial();
            // referenciaId nula a propósito: el método notifica a 3 destinatarios y la dedupe
            // por referencia es por evento; la idempotencia la garantiza el flag de firma del PA.
            notificacionCoformacion.notificarPlanEnviado(
                emailDe(est), emailDe(docente), emailDe(tutorEmp),
                nombreDe(est), "T" + (t.getNumero() == null ? "" : t.getNumero()),
                NotificacionCoformacionService.REF_TRIMESTRE, null);
        } catch (Exception ex) {
            log.warn("No se pudo notificar el envío del PA t{}: {}",
                pa.getId(), ex.getMessage());
        }
    }

    /** Avisa a estudiante, docente y tutor empresarial que el PA quedó firmado por las 3 partes. */
    private void notificarPlanFirmado(PlanActividades pa) {
        try {
            Trimestre t = pa.getTrimestre();
            Convenio c = t != null ? t.getConvenio() : null;
            if (c == null) return;
            Estudiante est = c.getEstudiante();
            Tutor docente = c.getTutorAcademico();
            Tutor tutorEmp = c.getTutorEmpresarial();
            String documento = "Plan de Actividades T" + (t.getNumero() == null ? "" : t.getNumero());
            if (est != null) {
                notificacionCoformacion.notificarDocumentoFirmado(
                    emailDe(est), nombreDe(est), documento,
                    NotificacionCoformacionService.REF_TRIMESTRE, null);
            }
            if (docente != null) {
                notificacionCoformacion.notificarDocumentoFirmado(
                    emailDe(docente), nombreDe(docente), documento,
                    NotificacionCoformacionService.REF_TRIMESTRE, null);
            }
            if (tutorEmp != null) {
                notificacionCoformacion.notificarDocumentoFirmado(
                    emailDe(tutorEmp), nombreDe(tutorEmp), documento,
                    NotificacionCoformacionService.REF_TRIMESTRE, null);
            }
        } catch (Exception ex) {
            log.warn("No se pudo notificar la firma del PA t{}: {}",
                pa.getId(), ex.getMessage());
        }
    }

    private static String emailDe(Estudiante e) {
        return e == null ? null : e.getEmail();
    }

    private static String emailDe(Tutor t) {
        return t == null ? null : t.getEmail();
    }

    private static String nombreDe(Estudiante e) {
        return e == null ? "" : (nullToEmpty(e.getNombres()) + " " + nullToEmpty(e.getApellidos())).trim();
    }

    private static String nombreDe(Tutor t) {
        return t == null ? "" : (nullToEmpty(t.getNombres()) + " " + nullToEmpty(t.getApellidos())).trim();
    }

    // ----- Hilo del flujo de aprobación tripartito -----

    @Transactional(readOnly = true)
    public List<PlanActividadesComentarioResponse> listarComentarios(Long trimestreId) {
        PlanActividades pa = obtenerEntidad(trimestreId);
        return comentarioRepository.findByPlanActividadesIdOrderByCreatedAtAsc(pa.getId()).stream()
            .map(PlanActividadesComentarioResponse::from)
            .toList();
    }

    /**
     * Agrega un mensaje al hilo del flujo de aprobación. El tipo lo indica el autor:
     *  - FEEDBACK              -> observación, sin cambio de estado
     *  - RESPUESTA_APROBACION  -> avanza el estado de firma del plan
     *  - RESPUESTA_RECHAZO     -> el plan vuelve a BORRADOR para que el estudiante ajuste
     */
    public PlanActividadesComentarioResponse agregarComentario(Long trimestreId,
                                                               PlanActividadesComentarioRequest request,
                                                               Usuario usuarioAutor) {
        PlanActividades pa = obtenerEntidad(trimestreId);
        if (usuarioAutor == null) {
            throw new BusinessException("No hay usuario autenticado");
        }

        TipoComentarioPlan tipo = request.tipo() != null ? request.tipo() : TipoComentarioPlan.FEEDBACK;

        PlanActividadesComentario c = PlanActividadesComentario.builder()
            .planActividadesId(pa.getId())
            .autorMongoId(usuarioAutor.getId())
            .autorNombre((nullToEmpty(usuarioAutor.getNombres()) + " "
                + nullToEmpty(usuarioAutor.getApellidos())).trim())
            .autorRol(rolPrincipal(usuarioAutor))
            .tipo(tipo)
            .mensaje(request.mensaje().trim())
            .build();
        c = comentarioRepository.save(c);

        // Efectos del flujo de aprobación sobre el estado del plan.
        if (tipo == TipoComentarioPlan.RESPUESTA_RECHAZO) {
            pa.setEstado(EstadoPlanActividades.BORRADOR);
        } else if (tipo == TipoComentarioPlan.RESPUESTA_APROBACION) {
            avanzarEstadoFirma(pa);
        }

        return PlanActividadesComentarioResponse.from(c);
    }

    /** Avanza el estado de aprobación del plan un paso (sin tocar los flags de firma). */
    private void avanzarEstadoFirma(PlanActividades pa) {
        switch (pa.getEstado()) {
            case BORRADOR, ENVIADO_TUTOR, RECHAZADO -> pa.setEstado(EstadoPlanActividades.APROBADO_TUTOR);
            case APROBADO_TUTOR -> pa.setEstado(EstadoPlanActividades.APROBADO_PROFESOR);
            default -> { /* APROBADO_PROFESOR: ya está en el estado final */ }
        }
    }

    private String rolPrincipal(Usuario u) {
        if (u.getRoles() == null) return Rol.ESTUDIANTE.name();
        if (u.getRoles().contains(Rol.ADMIN)) return Rol.ADMIN.name();
        if (u.getRoles().contains(Rol.COORDINADOR)) return Rol.COORDINADOR.name();
        if (u.getRoles().contains(Rol.TUTOR)) return Rol.TUTOR.name();
        if (u.getRoles().contains(Rol.EMPRESA)) return Rol.EMPRESA.name();
        if (u.getRoles().contains(Rol.ESTUDIANTE)) return Rol.ESTUDIANTE.name();
        return u.getRoles().stream().findFirst().map(Enum::name).orElse(Rol.ESTUDIANTE.name());
    }

    private static String nullToEmpty(String s) {
        return s == null ? "" : s;
    }

    /**
     * Genera el PDF del PA aprobado y lo persiste como {@link Documento} del estudiante
     * (tipo PLAN_ACTIVIDADES), dejándolo referenciado en {@code pa.documentoPdf}.
     * Es graceful: si algo falla (PDF, disco, datos faltantes) se registra WARN y se
     * deja seguir la firma; nunca rompe el flujo de aprobación.
     */
    private void archivarPdfEnExpediente(PlanActividades pa) {
        try {
            if (pa.getDocumentoPdf() != null) {
                return; // ya archivado
            }
            byte[] pdf = pdfGenerator.generar(pa);
            if (pdf == null || pdf.length == 0) {
                log.warn("PA t{} aprobado pero el PDF salió vacío; no se archiva en expediente", pa.getId());
                return;
            }

            String nombre = "plan-actividades-t"
                + (pa.getTrimestre() != null ? pa.getTrimestre().getId() : pa.getId()) + ".pdf";
            String nombreUnico = UUID.randomUUID().toString().substring(0, 8) + "-" + nombre;

            Path dir = Paths.get(storagePath);
            Files.createDirectories(dir);
            Path destino = dir.resolve(nombreUnico);
            Files.write(destino, pdf);

            Estudiante estudiante = null;
            if (pa.getTrimestre() != null
                && pa.getTrimestre().getConvenio() != null) {
                estudiante = pa.getTrimestre().getConvenio().getEstudiante();
            }

            Documento doc = Documento.builder()
                .estudiante(estudiante)
                .tipo(TipoDocumentoSoporte.PLAN_ACTIVIDADES)
                .nombreOriginal(nombre)
                .rutaAlmacenamiento(destino.toString())
                .mimeType("application/pdf")
                .tamanoBytes((long) pdf.length)
                .estado(EstadoDocumento.VALIDADO)
                .build();
            doc = documentoRepository.save(doc);

            pa.setDocumentoPdf(doc);
            log.info("PA t{} archivado en el expediente como documento {}", pa.getId(), doc.getId());
        } catch (Exception ex) {
            log.warn("No se pudo archivar el PDF del PA t{} en el expediente: {}",
                pa.getId(), ex.getMessage());
        }
    }
}
