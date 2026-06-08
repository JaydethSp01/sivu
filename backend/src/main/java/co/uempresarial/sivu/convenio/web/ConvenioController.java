package co.uempresarial.sivu.convenio.web;

import co.uempresarial.sivu.convenio.domain.EstadoConvenio;
import co.uempresarial.sivu.convenio.pdf.ConvenioPdfGenerator;
import co.uempresarial.sivu.convenio.service.ConvenioService;
import co.uempresarial.sivu.convenio.web.dto.AsignarTutoresRequest;
import co.uempresarial.sivu.convenio.web.dto.ConvenioRequest;
import co.uempresarial.sivu.convenio.web.dto.ConvenioResponse;
import co.uempresarial.sivu.convenio.web.dto.FinalizarConvenioRequest;
import co.uempresarial.sivu.convenio.web.dto.ParteFirmaConvenio;
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

import java.net.URI;

@RestController
@RequestMapping("/api/v1/convenios")
@RequiredArgsConstructor
@Tag(name = "Convenios", description = "Gestión del CRUD de convenios de prácticas")
public class ConvenioController {

    private final ConvenioService service;
    private final ConvenioPdfGenerator pdfGenerator;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR')")
    @Operation(summary = "Crear un nuevo convenio")
    public ResponseEntity<ConvenioResponse> crear(@Valid @RequestBody ConvenioRequest request) {
        ConvenioResponse created = service.crear(request);
        return ResponseEntity.created(URI.create("/api/v1/convenios/" + created.id())).body(created);
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Listar convenios con filtros y paginación")
    public ResponseEntity<PageResponse<ConvenioResponse>> listar(
        @RequestParam(required = false) EstadoConvenio estado,
        @RequestParam(required = false) Long estudianteId,
        @RequestParam(required = false) Long empresaId,
        @ParameterObject Pageable pageable
    ) {
        return ResponseEntity.ok(service.listar(estado, estudianteId, empresaId, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Obtener un convenio por id")
    public ResponseEntity<ConvenioResponse> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(service.buscarPorId(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR')")
    @Operation(summary = "Actualizar un convenio")
    public ResponseEntity<ConvenioResponse> actualizar(@PathVariable Long id,
                                                       @Valid @RequestBody ConvenioRequest request) {
        return ResponseEntity.ok(service.actualizar(id, request));
    }

    @PatchMapping("/{id}/firmar/{parte}")
    @PreAuthorize("""
        hasRole('ADMIN')
        or (#parte.name() == 'ESTUDIANTE' and hasRole('ESTUDIANTE'))
        or (#parte.name() == 'EMPRESA' and hasRole('EMPRESA'))
        or (#parte.name() == 'UNIVERSIDAD' and hasRole('COORDINADOR'))
        """)
    @Operation(summary = "Registrar la firma de una de las tres partes del convenio")
    public ResponseEntity<ConvenioResponse> firmar(@PathVariable Long id,
                                                   @PathVariable ParteFirmaConvenio parte) {
        return ResponseEntity.ok(service.firmar(id, parte));
    }

    @PatchMapping("/{id}/tutores")
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR')")
    @Operation(summary = "Asignar o reasignar tutor académico y/o empresarial al convenio")
    public ResponseEntity<ConvenioResponse> asignarTutores(@PathVariable Long id,
                                                           @Valid @RequestBody AsignarTutoresRequest request) {
        return ResponseEntity.ok(service.asignarTutores(id, request.tutorAcademicoId(), request.tutorEmpresarialId()));
    }

    @PatchMapping("/{id}/finalizar")
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR')")
    @Operation(summary = "Finalizar la práctica con calificación final (Convenio pasa a FINALIZADO)")
    public ResponseEntity<ConvenioResponse> finalizar(@PathVariable Long id,
                                                      @Valid @RequestBody FinalizarConvenioRequest request) {
        return ResponseEntity.ok(service.finalizar(id, request.calificacionFinal()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Eliminar un convenio")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        service.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/pdf")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Descargar el PDF institucional del convenio con datos, cláusulas y firmas")
    public ResponseEntity<byte[]> descargarPdf(@PathVariable Long id) {
        byte[] pdf = pdfGenerator.generar(service.obtener(id));
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_PDF)
            .header(HttpHeaders.CONTENT_DISPOSITION,
                "inline; filename=convenio-" + id + ".pdf")
            .body(pdf);
    }
}
