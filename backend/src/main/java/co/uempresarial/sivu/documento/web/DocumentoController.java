package co.uempresarial.sivu.documento.web;

import co.uempresarial.sivu.documento.domain.EstadoDocumento;
import co.uempresarial.sivu.documento.domain.TipoDocumentoSoporte;
import co.uempresarial.sivu.documento.service.DocumentoService;
import co.uempresarial.sivu.documento.web.dto.DocumentoRequest;
import co.uempresarial.sivu.documento.web.dto.DocumentoResponse;
import co.uempresarial.sivu.documento.web.dto.DocumentoValidacionRequest;
import co.uempresarial.sivu.shared.pagination.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URI;

@RestController
@RequestMapping("/api/v1/documentos")
@RequiredArgsConstructor
@Tag(name = "Documentos", description = "CRUD de documentos soporte (HV, ID, EPS, certificado, formalización) con upload real multipart y validación por coordinación")
public class DocumentoController {

    private final DocumentoService service;

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Registrar metadata de un nuevo documento (sin archivo)")
    public ResponseEntity<DocumentoResponse> crear(@Valid @RequestBody DocumentoRequest request) {
        DocumentoResponse created = service.crear(request);
        return ResponseEntity.created(URI.create("/api/v1/documentos/" + created.id())).body(created);
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Subir un archivo (multipart) y registrar el documento. Asocia opcionalmente a estudiante, empresa, requisito y fechas de vigencia (EPS, certificados, etc).")
    public ResponseEntity<DocumentoResponse> subir(
        @RequestPart("archivo") MultipartFile archivo,
        @RequestParam TipoDocumentoSoporte tipo,
        @RequestParam(required = false) Long estudianteId,
        @RequestParam(required = false) Long empresaId,
        @RequestParam(required = false) Long tipoRequisitoId,
        @RequestParam(required = false)
        @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE)
        java.time.LocalDate fechaVigenciaInicio,
        @RequestParam(required = false)
        @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE)
        java.time.LocalDate fechaVigenciaFin
    ) {
        DocumentoResponse created = service.subir(archivo, tipo, estudianteId,
            empresaId, tipoRequisitoId, fechaVigenciaInicio, fechaVigenciaFin);
        return ResponseEntity.created(URI.create("/api/v1/documentos/" + created.id())).body(created);
    }

    @GetMapping("/por-empresa/{empresaId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Listar documentos asociados directamente a una empresa (RUT, cámara, póliza ARL, etc.)")
    public ResponseEntity<java.util.List<DocumentoResponse>> porEmpresa(@PathVariable Long empresaId) {
        return ResponseEntity.ok(service.listarPorEmpresa(empresaId));
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Listar documentos con filtros y paginación")
    public ResponseEntity<PageResponse<DocumentoResponse>> listar(
        @RequestParam(required = false) EstadoDocumento estado,
        @RequestParam(required = false) TipoDocumentoSoporte tipo,
        @RequestParam(required = false) Long estudianteId,
        @ParameterObject Pageable pageable
    ) {
        return ResponseEntity.ok(service.listar(estado, tipo, estudianteId, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Obtener un documento por id")
    public ResponseEntity<DocumentoResponse> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(service.buscarPorId(id));
    }

    @GetMapping("/{id}/descargar")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Descargar el archivo asociado al documento")
    public ResponseEntity<byte[]> descargar(@PathVariable Long id) {
        var doc = service.buscarPorId(id);
        byte[] bytes = service.descargar(id);
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(doc.mimeType()))
            .header(HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename=\"" + doc.nombreOriginal() + "\"")
            .body(bytes);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR')")
    @Operation(summary = "Actualizar la metadata de un documento")
    public ResponseEntity<DocumentoResponse> actualizar(@PathVariable Long id,
                                                        @Valid @RequestBody DocumentoRequest request) {
        return ResponseEntity.ok(service.actualizar(id, request));
    }

    @PatchMapping("/{id}/validar")
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR')")
    @Operation(summary = "Validar o rechazar un documento (envía email al estudiante)")
    public ResponseEntity<DocumentoResponse> validar(@PathVariable Long id,
                                                     @Valid @RequestBody DocumentoValidacionRequest request) {
        return ResponseEntity.ok(service.validar(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR')")
    @Operation(summary = "Eliminar un documento")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        service.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
