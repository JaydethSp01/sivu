package co.uempresarial.sivu.hojavida.service;

import co.uempresarial.sivu.documento.domain.Documento;
import co.uempresarial.sivu.documento.domain.EstadoDocumento;
import co.uempresarial.sivu.documento.domain.TipoDocumentoSoporte;
import co.uempresarial.sivu.documento.persistence.DocumentoRepository;
import co.uempresarial.sivu.estudiante.domain.Estudiante;
import co.uempresarial.sivu.estudiante.persistence.EstudianteRepository;
import co.uempresarial.sivu.hojavida.domain.*;
import co.uempresarial.sivu.hojavida.domain.EstadoHojaVida;
import co.uempresarial.sivu.hojavida.persistence.HojaVidaComentarioRepository;
import co.uempresarial.sivu.hojavida.persistence.HojaVidaRepository;
import co.uempresarial.sivu.hojavida.web.dto.HojaVidaComentarioRequest;
import co.uempresarial.sivu.hojavida.web.dto.HojaVidaComentarioResponse;
import co.uempresarial.sivu.hojavida.web.dto.HojaVidaRequest;
import co.uempresarial.sivu.hojavida.web.dto.HojaVidaResponse;
import co.uempresarial.sivu.security.domain.Rol;
import co.uempresarial.sivu.security.domain.Usuario;
import co.uempresarial.sivu.automatizacion.service.NotificacionService;
import co.uempresarial.sivu.security.service.CurrentUserService;
import co.uempresarial.sivu.shared.exception.BusinessException;
import co.uempresarial.sivu.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class HojaVidaService {

    /** Marcador para identificar documentos HV generados automáticamente. */
    public static final String RUTA_HV_GENERADA_PREFIX = "generated://hv/";

    private final HojaVidaRepository repository;
    private final EstudianteRepository estudianteRepository;
    private final NotificacionService notificacionService;
    private final CurrentUserService currentUser;
    private final DocumentoRepository documentoRepository;
    private final HojaVidaComentarioRepository comentarioRepository;
    private final co.uempresarial.sivu.hojavida.pdf.HojaVidaPdfGenerator pdfGenerator;

    @Transactional(readOnly = true)
    public HojaVidaResponse obtener(Long estudianteId) {
        HojaVida hv = repository.findByEstudianteId(estudianteId)
            .orElseThrow(() -> new ResourceNotFoundException(
                "El estudiante " + estudianteId + " aún no tiene Hoja de Vida creada"));
        return toResponse(hv);
    }

    @Transactional(readOnly = true)
    public Optional<HojaVidaResponse> obtenerOpcional(Long estudianteId) {
        return repository.findByEstudianteId(estudianteId).map(this::toResponse);
    }

    /**
     * Crear o actualizar de manera idempotente. Si no existe, la crea; si existe,
     * reemplaza todas las sub-listas (estrategia "full replace").
     */
    public HojaVidaResponse guardar(Long estudianteId, HojaVidaRequest request) {
        Estudiante estudiante = estudianteRepository.findById(estudianteId)
            .orElseThrow(() -> new ResourceNotFoundException("Estudiante", estudianteId));

        HojaVida hv = repository.findByEstudianteId(estudianteId)
            .orElseGet(() -> HojaVida.builder().estudiante(estudiante).build());

        hv.setDireccion(request.direccion());
        hv.setTelefonoContacto(request.telefonoContacto());
        hv.setCiudad(request.ciudad());
        hv.setFotoPath(request.fotoPath());
        hv.setPerfilSaber(request.perfilSaber());
        hv.setPerfilHacer(request.perfilHacer());
        hv.setPerfilSer(request.perfilSer());
        hv.setUltimaActualizacion(OffsetDateTime.now());

        // Replace-all en sub-listas.
        // IMPORTANTE: primero vaciamos TODAS las colecciones y hacemos flush para
        // que Hibernate ejecute los DELETE ANTES de los INSERT. Si no, al re-guardar
        // con el mismo valor (p.ej. idioma "Español") Hibernate puede insertar antes
        // de borrar y viola el unique constraint uq_hv_idioma. (bug prod).
        boolean esNueva = hv.getId() == null;
        hv.getHabilidades().clear();
        hv.getIdiomas().clear();
        hv.getEducacion().clear();
        hv.getExperienciaFase().clear();
        hv.getExperienciaLaboral().clear();
        if (!esNueva) {
            repository.saveAndFlush(hv);   // fuerza los DELETE de las sub-listas
        }

        if (request.habilidades() != null) {
            int i = 0;
            for (var h : request.habilidades()) {
                hv.getHabilidades().add(HojaVidaHabilidad.builder()
                    .hojaVida(hv)
                    .categoria(h.categoria())
                    .descripcion(h.descripcion())
                    .orden(h.orden() != null ? h.orden() : (short) i++)
                    .build());
            }
        }

        if (request.idiomas() != null) {
            int i = 0;
            for (var d : request.idiomas()) {
                hv.getIdiomas().add(HojaVidaIdioma.builder()
                    .hojaVida(hv)
                    .idioma(d.idioma())
                    .nivel(d.nivel())
                    .orden(d.orden() != null ? d.orden() : (short) i++)
                    .build());
            }
        }

        if (request.educacion() != null) {
            int i = 0;
            for (var e : request.educacion()) {
                hv.getEducacion().add(HojaVidaEducacion.builder()
                    .hojaVida(hv)
                    .programa(e.programa())
                    .institucion(e.institucion())
                    .fechaInicio(e.fechaInicio())
                    .fechaFin(e.fechaFin())
                    .enCurso(Boolean.TRUE.equals(e.enCurso()))
                    .observaciones(e.observaciones())
                    .orden(e.orden() != null ? e.orden() : (short) i++)
                    .build());
            }
        }

        if (request.experienciaFase() != null) {
            int i = 0;
            for (var x : request.experienciaFase()) {
                hv.getExperienciaFase().add(HojaVidaExperienciaFase.builder()
                    .hojaVida(hv)
                    .empresa(x.empresa())
                    .cargo(x.cargo())
                    .fechaInicio(x.fechaInicio())
                    .fechaFin(x.fechaFin())
                    .enCurso(Boolean.TRUE.equals(x.enCurso()))
                    .descripcion(x.descripcion())
                    .orden(x.orden() != null ? x.orden() : (short) i++)
                    .build());
            }
        }

        if (request.experienciaLaboral() != null) {
            int i = 0;
            for (var x : request.experienciaLaboral()) {
                hv.getExperienciaLaboral().add(HojaVidaExperienciaLaboral.builder()
                    .hojaVida(hv)
                    .empresa(x.empresa())
                    .cargo(x.cargo())
                    .fechaInicio(x.fechaInicio())
                    .fechaFin(x.fechaFin())
                    .enCurso(Boolean.TRUE.equals(x.enCurso()))
                    .descripcion(x.descripcion())
                    .orden(x.orden() != null ? x.orden() : (short) i++)
                    .build());
            }
        }

        HojaVida saved = repository.save(hv);
        sincronizarDocumentoHv(saved);
        return toResponse(saved);
    }

    /**
     * Mantiene un Documento de tipo HOJA_VIDA por estudiante reflejando el
     * estado de su HV institucional. Se invoca tras guardar la HV.
     *
     *   - HV completa  → upsert Documento con estado RECIBIDO (Coformación lo aprobará)
     *   - HV aprobada  → Documento queda VALIDADO automáticamente
     *   - HV rechazada → Documento queda RECHAZADO
     *
     * La ruta_almacenamiento usa el marcador {@link #RUTA_HV_GENERADA_PREFIX}
     * para distinguirlo de los uploads manuales; el frontend lo detecta y
     * descarga el PDF on-demand desde /hoja-vida/{id}/pdf.
     */
    private void sincronizarDocumentoHv(HojaVida hv) {
        Estudiante est = hv.getEstudiante();
        if (est == null) return;
        if (!hv.estaCompleta()) return;

        Documento doc = documentoRepository
            .findFirstByEstudianteIdAndTipoOrderByCreatedAtDesc(est.getId(), TipoDocumentoSoporte.HOJA_VIDA)
            .orElseGet(() -> Documento.builder()
                .estudiante(est)
                .tipo(TipoDocumentoSoporte.HOJA_VIDA)
                .nombreOriginal("Hoja de vida - " + nombreCompleto(est) + ".pdf")
                .rutaAlmacenamiento(RUTA_HV_GENERADA_PREFIX + est.getId())
                .mimeType("application/pdf")
                .tamanoBytes(0L)
                .estado(EstadoDocumento.RECIBIDO)
                .build());

        // Mantener el nombre actualizado (por si cambió el nombre del estudiante)
        doc.setNombreOriginal("Hoja de vida - " + nombreCompleto(est) + ".pdf");
        doc.setRutaAlmacenamiento(RUTA_HV_GENERADA_PREFIX + est.getId());
        doc.setMimeType("application/pdf");
        doc.setTipo(TipoDocumentoSoporte.HOJA_VIDA);

        switch (hv.getEstado()) {
            case APROBADA -> {
                doc.setEstado(EstadoDocumento.VALIDADO);
                if (doc.getFechaValidacion() == null) {
                    doc.setFechaValidacion(java.time.OffsetDateTime.now());
                }
                doc.setObservacionesValidacion(null);
            }
            case RECHAZADA -> {
                doc.setEstado(EstadoDocumento.RECHAZADO);
                doc.setObservacionesValidacion(hv.getObservacionesCoformacion());
            }
            case BORRADOR, ENVIADA -> {
                if (doc.getEstado() != EstadoDocumento.VALIDADO) {
                    doc.setEstado(EstadoDocumento.RECIBIDO);
                    doc.setObservacionesValidacion(null);
                }
            }
        }

        documentoRepository.save(doc);
    }

    private String nombreCompleto(Estudiante e) {
        return (e.getNombres() + " " + e.getApellidos()).trim();
    }

    @Transactional(readOnly = true)
    public HojaVida obtenerEntidad(Long estudianteId) {
        return repository.findByEstudianteId(estudianteId)
            .orElseThrow(() -> new ResourceNotFoundException(
                "El estudiante " + estudianteId + " aún no tiene Hoja de Vida creada"));
    }

    @Transactional(readOnly = true)
    public byte[] generarPdf(Long estudianteId) {
        return pdfGenerator.generar(obtenerEntidad(estudianteId));
    }

    private HojaVidaResponse toResponse(HojaVida hv) {
        Estudiante e = hv.getEstudiante();
        String nombreCompleto = (e.getNombres() + " " + e.getApellidos()).trim();
        List<HojaVidaResponse.HabilidadResponse> hab = new ArrayList<>();
        hv.getHabilidades().forEach(h -> hab.add(new HojaVidaResponse.HabilidadResponse(
            h.getId(), h.getCategoria(), h.getDescripcion(), h.getOrden())));
        List<HojaVidaResponse.IdiomaResponse> idi = new ArrayList<>();
        hv.getIdiomas().forEach(i -> idi.add(new HojaVidaResponse.IdiomaResponse(
            i.getId(), i.getIdioma(), i.getNivel(), i.getOrden())));
        List<HojaVidaResponse.EducacionResponse> edu = new ArrayList<>();
        hv.getEducacion().forEach(x -> edu.add(new HojaVidaResponse.EducacionResponse(
            x.getId(), x.getPrograma(), x.getInstitucion(), x.getFechaInicio(), x.getFechaFin(),
            x.getEnCurso(), x.getObservaciones(), x.getOrden())));
        List<HojaVidaResponse.ExperienciaFaseResponse> exF = new ArrayList<>();
        hv.getExperienciaFase().forEach(x -> exF.add(new HojaVidaResponse.ExperienciaFaseResponse(
            x.getId(), x.getEmpresa(), x.getCargo(), x.getFechaInicio(), x.getFechaFin(),
            x.getEnCurso(), x.getDescripcion(), x.getOrden())));
        List<HojaVidaResponse.ExperienciaLaboralResponse> exL = new ArrayList<>();
        hv.getExperienciaLaboral().forEach(x -> exL.add(new HojaVidaResponse.ExperienciaLaboralResponse(
            x.getId(), x.getEmpresa(), x.getCargo(), x.getFechaInicio(), x.getFechaFin(),
            x.getEnCurso(), x.getDescripcion(), x.getOrden())));

        return new HojaVidaResponse(
            hv.getId(), e.getId(), nombreCompleto, e.getEmail(),
            e.getProgramaAcademico(), e.getSemestre(),
            hv.getDireccion(), hv.getTelefonoContacto(), hv.getCiudad(), hv.getFotoPath(),
            hv.getPerfilSaber(), hv.getPerfilHacer(), hv.getPerfilSer(),
            hv.estaCompleta(),
            hv.getEstado(),
            hv.getObservacionesCoformacion(),
            hv.getEnviadaAt(),
            hv.getAprobadaAt(),
            hv.getAprobadaPorCoordNombre(),
            hv.getUltimaActualizacion(),
            hv.getCreatedAt(), hv.getUpdatedAt(),
            hab, idi, edu, exF, exL);
    }

    /* ============================================================
       Flujo Coformación — F7 #52
       BORRADOR → ENVIADA → APROBADA o RECHAZADA → (BORRADOR para reenviar)
       ============================================================ */

    public HojaVidaResponse enviarACoformacion(Long estudianteId) {
        HojaVida hv = obtenerEntidad(estudianteId);
        if (!hv.estaCompleta()) {
            throw new BusinessException(
                "La Hoja de Vida no está completa. Llena perfil SABER/HACER/SER, al menos 1 habilidad, 1 idioma y 1 educación.");
        }
        if (hv.getEstado() != EstadoHojaVida.BORRADOR && hv.getEstado() != EstadoHojaVida.RECHAZADA) {
            throw new BusinessException(
                "Solo se puede enviar a Coformación desde BORRADOR o RECHAZADA (actual: " + hv.getEstado() + ")");
        }
        hv.setEstado(EstadoHojaVida.ENVIADA);
        hv.setEnviadaAt(OffsetDateTime.now());
        hv.setObservacionesCoformacion(null);
        hv.setAprobadaAt(null);
        hv.setAprobadaPorCoordMongoId(null);
        hv.setAprobadaPorCoordNombre(null);

        notificacionService.enviarTexto(
            hv.getEstudiante().getEmail(),
            "[SIVU] Tu Hoja de Vida fue enviada a Coformación",
            "Hola " + hv.getEstudiante().getNombres()
                + ",\n\nTu HV está en revisión por la Oficina de Coformación de Uniempresarial."
                + " Te notificaremos el resultado.\n\nEquipo SIVU");

        registrarComentarioSistema(hv.getId(),
            "El estudiante envió su Hoja de Vida a revisión de Coformación.");
        return toResponse(hv);
    }

    public HojaVidaResponse aprobar(Long hvId) {
        HojaVida hv = repository.findById(hvId)
            .orElseThrow(() -> new ResourceNotFoundException("HojaVida", hvId));
        if (hv.getEstado() != EstadoHojaVida.ENVIADA) {
            throw new BusinessException("Solo se pueden aprobar HVs ENVIADAS (actual: " + hv.getEstado() + ")");
        }
        hv.setEstado(EstadoHojaVida.APROBADA);
        hv.setAprobadaAt(OffsetDateTime.now());
        currentUser.current().ifPresent(u -> {
            hv.setAprobadaPorCoordMongoId(u.getId());
            hv.setAprobadaPorCoordNombre(u.getNombres() + " " + u.getApellidos());
        });
        registrarComentarioSistema(hv.getId(),
            "Hoja de Vida aprobada por Coformación. El estudiante ya puede postularse a vacantes.");
        notificacionService.enviarTexto(
            hv.getEstudiante().getEmail(),
            "[SIVU] ¡Tu Hoja de Vida fue aprobada!",
            "Hola " + hv.getEstudiante().getNombres()
                + ",\n\nLa Oficina de Coformación aprobó tu HV. Ya puedes postularte a vacantes.\n\nEquipo SIVU");
        sincronizarDocumentoHv(hv);
        return toResponse(hv);
    }

    public HojaVidaResponse rechazar(Long hvId, String observaciones) {
        HojaVida hv = repository.findById(hvId)
            .orElseThrow(() -> new ResourceNotFoundException("HojaVida", hvId));
        if (hv.getEstado() != EstadoHojaVida.ENVIADA) {
            throw new BusinessException("Solo se pueden rechazar HVs ENVIADAS (actual: " + hv.getEstado() + ")");
        }
        if (observaciones == null || observaciones.isBlank()) {
            throw new BusinessException("Debes indicar observaciones al rechazar una HV");
        }
        hv.setEstado(EstadoHojaVida.RECHAZADA);
        hv.setObservacionesCoformacion(observaciones);
        // Tanto el log de sistema como el feedback del coord quedan en el hilo
        // para que el estudiante vea el historial completo, no solo el último.
        registrarComentarioSistema(hv.getId(),
            "Hoja de Vida devuelta con observaciones. Ajustá y reenviá.");
        registrarComentarioCoord(hv.getId(),
            HojaVidaComentario.TipoComentario.FEEDBACK, observaciones);
        notificacionService.enviarTexto(
            hv.getEstudiante().getEmail(),
            "[SIVU] Tu Hoja de Vida requiere ajustes",
            "Hola " + hv.getEstudiante().getNombres()
                + ",\n\nLa Oficina de Coformación revisó tu HV y solicitó ajustes:\n\n"
                + observaciones
                + "\n\nAjusta y vuelve a enviarla.\n\nEquipo SIVU");
        sincronizarDocumentoHv(hv);
        return toResponse(hv);
    }

    // ----- Hilo de comentarios -----

    @Transactional(readOnly = true)
    public List<HojaVidaComentarioResponse> listarComentarios(Long hvId) {
        HojaVida hv = repository.findById(hvId)
            .orElseThrow(() -> new ResourceNotFoundException("HojaVida", hvId));
        verificarAccesoHv(hv);
        return comentarioRepository.findByHojaVidaIdOrderByCreatedAtAsc(hv.getId()).stream()
            .map(HojaVidaComentarioResponse::from)
            .toList();
    }

    /**
     * Crea un comentario en el hilo. El tipo se infiere del rol del autor:
     * - COORDINADOR/ADMIN → FEEDBACK
     * - ESTUDIANTE        → RESPUESTA
     * Solo el dueño de la HV o COORDINADOR/ADMIN pueden comentar.
     */
    public HojaVidaComentarioResponse agregarComentario(Long hvId, HojaVidaComentarioRequest req) {
        HojaVida hv = repository.findById(hvId)
            .orElseThrow(() -> new ResourceNotFoundException("HojaVida", hvId));
        verificarAccesoHv(hv);
        Usuario u = currentUser.current()
            .orElseThrow(() -> new BusinessException("No hay usuario autenticado"));
        HojaVidaComentario.AutorRol autorRol;
        HojaVidaComentario.TipoComentario tipo;
        if (u.getRoles().contains(Rol.ADMIN)) {
            autorRol = HojaVidaComentario.AutorRol.ADMIN;
            tipo = HojaVidaComentario.TipoComentario.FEEDBACK;
        } else if (u.getRoles().contains(Rol.COORDINADOR)) {
            autorRol = HojaVidaComentario.AutorRol.COORDINADOR;
            tipo = HojaVidaComentario.TipoComentario.FEEDBACK;
        } else if (u.getRoles().contains(Rol.ESTUDIANTE)) {
            autorRol = HojaVidaComentario.AutorRol.ESTUDIANTE;
            tipo = HojaVidaComentario.TipoComentario.RESPUESTA;
        } else {
            throw new BusinessException("Tu rol no puede comentar en una Hoja de Vida");
        }
        HojaVidaComentario c = HojaVidaComentario.builder()
            .hojaVidaId(hv.getId())
            .autorMongoId(u.getId())
            .autorNombre((u.getNombres() + " " + u.getApellidos()).trim())
            .autorRol(autorRol)
            .tipo(tipo)
            .mensaje(req.mensaje().trim())
            .build();
        c = comentarioRepository.save(c);
        return HojaVidaComentarioResponse.from(c);
    }

    /** Solo el estudiante dueño o ADMIN/COORDINADOR pueden ver/escribir en el hilo. */
    private void verificarAccesoHv(HojaVida hv) {
        Usuario u = currentUser.current().orElse(null);
        if (u == null) throw new BusinessException("No hay usuario autenticado");
        if (u.getRoles().contains(Rol.ADMIN) || u.getRoles().contains(Rol.COORDINADOR)) return;
        Long estudianteId = u.getEstudianteId();
        if (estudianteId == null || !estudianteId.equals(hv.getEstudiante().getId())) {
            throw new BusinessException("No puedes acceder a esta Hoja de Vida");
        }
    }

    private void registrarComentarioSistema(Long hvId, String mensaje) {
        comentarioRepository.save(HojaVidaComentario.builder()
            .hojaVidaId(hvId)
            .autorNombre("SIVU")
            .autorRol(HojaVidaComentario.AutorRol.SISTEMA)
            .tipo(HojaVidaComentario.TipoComentario.SISTEMA)
            .mensaje(mensaje)
            .build());
    }

    private void registrarComentarioCoord(Long hvId,
                                          HojaVidaComentario.TipoComentario tipo,
                                          String mensaje) {
        currentUser.current().ifPresent(u -> {
            HojaVidaComentario.AutorRol rol = u.getRoles().contains(Rol.ADMIN)
                ? HojaVidaComentario.AutorRol.ADMIN
                : HojaVidaComentario.AutorRol.COORDINADOR;
            comentarioRepository.save(HojaVidaComentario.builder()
                .hojaVidaId(hvId)
                .autorMongoId(u.getId())
                .autorNombre((u.getNombres() + " " + u.getApellidos()).trim())
                .autorRol(rol)
                .tipo(tipo)
                .mensaje(mensaje)
                .build());
        });
    }

    @Transactional(readOnly = true)
    public List<HojaVidaResponse> listarPorEstado(EstadoHojaVida estado) {
        return repository.findByEstadoOrderByEnviadaAtAsc(estado).stream()
            .map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public boolean estudianteTieneHvAprobada(Long estudianteId) {
        return repository.existsByEstudianteIdAndEstado(estudianteId, EstadoHojaVida.APROBADA);
    }
}
