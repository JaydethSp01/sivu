package co.uempresarial.sivu.documento.service;

import co.uempresarial.sivu.automatizacion.service.NotificacionService;
import co.uempresarial.sivu.catalogo.requisito.domain.TipoRequisitoDocumental;
import co.uempresarial.sivu.catalogo.requisito.persistence.TipoRequisitoDocumentalRepository;
import co.uempresarial.sivu.documento.domain.Documento;
import co.uempresarial.sivu.documento.domain.EstadoDocumento;
import co.uempresarial.sivu.documento.domain.TipoDocumentoSoporte;
import co.uempresarial.sivu.documento.persistence.DocumentoRepository;
import co.uempresarial.sivu.documento.web.DocumentoMapper;
import co.uempresarial.sivu.documento.web.dto.DocumentoRequest;
import co.uempresarial.sivu.documento.web.dto.DocumentoResponse;
import co.uempresarial.sivu.documento.web.dto.DocumentoValidacionRequest;
import co.uempresarial.sivu.empresa.domain.Empresa;
import co.uempresarial.sivu.empresa.persistence.EmpresaRepository;
import co.uempresarial.sivu.estudiante.domain.Estudiante;
import co.uempresarial.sivu.estudiante.persistence.EstudianteRepository;
import co.uempresarial.sivu.postulacion.domain.Postulacion;
import co.uempresarial.sivu.postulacion.persistence.PostulacionRepository;
import co.uempresarial.sivu.security.service.CurrentUserService;
import co.uempresarial.sivu.shared.exception.BusinessException;
import co.uempresarial.sivu.shared.exception.ResourceNotFoundException;
import co.uempresarial.sivu.shared.pagination.PageResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.OffsetDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class DocumentoService {

    private final DocumentoRepository repository;
    private final EstudianteRepository estudianteRepository;
    private final EmpresaRepository empresaRepository;
    private final PostulacionRepository postulacionRepository;
    private final TipoRequisitoDocumentalRepository tipoRequisitoRepository;
    private final NotificacionService notificacionService;
    private final DocumentoMapper mapper;
    private final CurrentUserService currentUser;

    @Value("${app.storage.path:./storage/documentos}")
    private String storagePath;

    public DocumentoResponse crear(DocumentoRequest request) {
        Documento entity = mapper.toEntity(request);
        if (request.estudianteId() != null) {
            entity.setEstudiante(resolverEstudiante(request.estudianteId()));
        }
        if (request.postulacionId() != null) {
            entity.setPostulacion(resolverPostulacion(request.postulacionId()));
        }
        if (entity.getEstado() == null) {
            entity.setEstado(EstadoDocumento.RECIBIDO);
        }
        return mapper.toResponse(repository.save(entity));
    }

    /**
     * Upload real de un archivo: lo persiste en {@code app.storage.path} con un nombre
     * único, genera el registro Documento y lo asocia opcionalmente al estudiante,
     * a la postulación y/o a la empresa indicada (esto último, p. ej. para RUT, cámara
     * de comercio y demás documentos legales de la empresa en su proceso de alianza).
     */
    public DocumentoResponse subir(MultipartFile archivo,
                                   TipoDocumentoSoporte tipo,
                                   Long estudianteId,
                                   Long postulacionId,
                                   Long empresaId,
                                   Long tipoRequisitoId) {
        if (archivo == null || archivo.isEmpty()) {
            throw new BusinessException("El archivo está vacío");
        }
        if (tipo == null) {
            throw new BusinessException("El tipo de documento es obligatorio");
        }

        String original = archivo.getOriginalFilename() != null
            ? archivo.getOriginalFilename() : "documento.bin";
        String nombreUnico = UUID.randomUUID().toString().substring(0, 8) + "-" + original;
        Path destino = guardar(nombreUnico, archivo);

        Documento doc = Documento.builder()
            .tipo(tipo)
            .nombreOriginal(original)
            .rutaAlmacenamiento(destino.toString())
            .mimeType(archivo.getContentType() != null ? archivo.getContentType() : "application/octet-stream")
            .tamanoBytes(archivo.getSize())
            .estado(EstadoDocumento.RECIBIDO)
            .build();
        if (estudianteId != null) doc.setEstudiante(resolverEstudiante(estudianteId));
        if (postulacionId != null) doc.setPostulacion(resolverPostulacion(postulacionId));
        if (empresaId != null) doc.setEmpresa(resolverEmpresa(empresaId));
        if (tipoRequisitoId != null) doc.setTipoRequisito(resolverTipoRequisito(tipoRequisitoId));

        return mapper.toResponse(repository.save(doc));
    }

    private TipoRequisitoDocumental resolverTipoRequisito(Long id) {
        return tipoRequisitoRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("TipoRequisito", id));
    }

    @Transactional(readOnly = true)
    public java.util.List<DocumentoResponse> listarPorEmpresa(Long empresaId) {
        return repository.findByEmpresaIdOrderByCreatedAtDesc(empresaId).stream()
            .map(mapper::toResponse).toList();
    }

    public DocumentoResponse actualizar(Long id, DocumentoRequest request) {
        Documento existing = obtener(id);
        mapper.updateEntity(request, existing);
        if (request.estudianteId() != null) {
            existing.setEstudiante(resolverEstudiante(request.estudianteId()));
        }
        if (request.postulacionId() != null) {
            existing.setPostulacion(resolverPostulacion(request.postulacionId()));
        }
        return mapper.toResponse(existing);
    }

    public DocumentoResponse validar(Long id, DocumentoValidacionRequest request) {
        Documento existing = obtener(id);
        boolean aprobado = Boolean.TRUE.equals(request.validar());
        existing.setEstado(aprobado ? EstadoDocumento.VALIDADO : EstadoDocumento.RECHAZADO);
        existing.setObservacionesValidacion(request.observaciones());
        existing.setFechaValidacion(OffsetDateTime.now());

        // Notificar al estudiante el resultado, si el documento está asociado a uno.
        if (existing.getEstudiante() != null && existing.getEstudiante().getEmail() != null) {
            notificacionService.enviarValidacionDocumento(
                existing.getEstudiante().getEmail(),
                existing.getEstudiante().getNombres(),
                existing.getTipo().name(),
                aprobado,
                request.observaciones());
        }

        return mapper.toResponse(existing);
    }

    public void eliminar(Long id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Documento", id);
        }
        repository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public DocumentoResponse buscarPorId(Long id) {
        return mapper.toResponse(obtener(id));
    }

    @Transactional(readOnly = true)
    public PageResponse<DocumentoResponse> listar(EstadoDocumento estado,
                                                  TipoDocumentoSoporte tipo,
                                                  Long estudianteId,
                                                  Pageable pageable) {
        // Auto-scope: EMPRESA pura solo ve docs de su empresa + docs de sus practicantes.
        Long empresaId = null;
        if (currentUser.esEmpresaPura()) {
            empresaId = currentUser.currentEmpresaId().orElse(-1L);
        }
        return PageResponse.of(
            repository.buscar(estado, tipo, estudianteId, empresaId, pageable).map(mapper::toResponse)
        );
    }

    @Transactional(readOnly = true)
    public byte[] descargar(Long id) {
        Documento doc = obtener(id);
        try {
            return Files.readAllBytes(Path.of(doc.getRutaAlmacenamiento()));
        } catch (IOException ex) {
            log.error("No se pudo leer el archivo {}: {}", doc.getRutaAlmacenamiento(), ex.getMessage());
            throw new BusinessException("No se pudo leer el archivo del documento: " + ex.getMessage());
        }
    }

    public Documento obtener(Long id) {
        return repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Documento", id));
    }

    private Estudiante resolverEstudiante(Long estudianteId) {
        return estudianteRepository.findById(estudianteId)
            .orElseThrow(() -> new ResourceNotFoundException("Estudiante", estudianteId));
    }

    private Postulacion resolverPostulacion(Long postulacionId) {
        return postulacionRepository.findById(postulacionId)
            .orElseThrow(() -> new ResourceNotFoundException("Postulacion", postulacionId));
    }

    private Empresa resolverEmpresa(Long empresaId) {
        return empresaRepository.findById(empresaId)
            .orElseThrow(() -> new ResourceNotFoundException("Empresa", empresaId));
    }

    private Path guardar(String nombre, MultipartFile archivo) {
        try {
            Path dir = Paths.get(storagePath);
            Files.createDirectories(dir);
            Path destino = dir.resolve(nombre);
            archivo.transferTo(destino);
            return destino;
        } catch (IOException ex) {
            log.error("Error guardando archivo {}: {}", nombre, ex.getMessage());
            throw new BusinessException("No se pudo guardar el archivo: " + ex.getMessage());
        }
    }
}
