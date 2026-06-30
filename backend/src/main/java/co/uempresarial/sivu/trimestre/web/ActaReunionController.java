package co.uempresarial.sivu.trimestre.web;

import co.uempresarial.sivu.trimestre.domain.ParteFirmaTrimestre;
import co.uempresarial.sivu.trimestre.pdf.ActaReunionPdfGenerator;
import co.uempresarial.sivu.trimestre.service.ActaReunionService;
import co.uempresarial.sivu.trimestre.web.dto.ActaReunionRequest;
import co.uempresarial.sivu.trimestre.web.dto.ActaReunionResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequiredArgsConstructor
@Tag(name = "Actas de Reunión (GAC-FM-11)",
    description = "Actas de seguimiento de la práctica por trimestre. Cada acta tiene número AC1/AC2/AC3 único dentro del trimestre, asistentes, temas tratados y firmas.")
public class ActaReunionController {

    private final ActaReunionService service;
    private final ActaReunionPdfGenerator pdfGenerator;

    @GetMapping("/api/v1/trimestres/{trimestreId}/actas")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Listar actas del trimestre ordenadas por número")
    public ResponseEntity<List<ActaReunionResponse>> listar(@PathVariable Long trimestreId) {
        return ResponseEntity.ok(service.listarPorTrimestre(trimestreId));
    }

    @PostMapping("/api/v1/trimestres/{trimestreId}/actas")
    @PreAuthorize("hasAnyRole('COORDINADOR','DOCENTE','ADMIN')")
    @Operation(summary = "Crear nueva acta para el trimestre")
    public ResponseEntity<ActaReunionResponse> crear(@PathVariable Long trimestreId,
                                                     @Valid @RequestBody ActaReunionRequest request) {
        ActaReunionResponse r = service.crear(trimestreId, request);
        return ResponseEntity.created(URI.create("/api/v1/actas/" + r.id())).body(r);
    }

    @GetMapping("/api/v1/actas/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Obtener un acta por id")
    public ResponseEntity<ActaReunionResponse> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(service.obtener(id));
    }

    @PutMapping("/api/v1/actas/{id}")
    @PreAuthorize("hasAnyRole('COORDINADOR','DOCENTE','ADMIN')")
    @Operation(summary = "Actualizar un acta (reemplaza temas y asistentes)")
    public ResponseEntity<ActaReunionResponse> actualizar(@PathVariable Long id,
                                                          @Valid @RequestBody ActaReunionRequest request) {
        return ResponseEntity.ok(service.actualizar(id, request));
    }

    @PatchMapping("/api/v1/actas/{id}/firmar/{parte}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Firmar el acta como ESTUDIANTE | TUTOR | PROFESOR")
    public ResponseEntity<ActaReunionResponse> firmar(@PathVariable Long id,
                                                      @PathVariable ParteFirmaTrimestre parte) {
        return ResponseEntity.ok(service.firmar(id, parte));
    }

    @DeleteMapping("/api/v1/actas/{id}")
    @PreAuthorize("hasAnyRole('COORDINADOR','ADMIN')")
    @Operation(summary = "Eliminar un acta")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        service.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/v1/actas/{id}/pdf")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Descargar el acta en PDF con formato Uniempresarial (GAC-FM-11)")
    public ResponseEntity<byte[]> descargarPdf(@PathVariable Long id) {
        byte[] pdf = service.generarPdf(id);
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_PDF)
            .header(HttpHeaders.CONTENT_DISPOSITION,
                "inline; filename=acta-" + id + ".pdf")
            .body(pdf);
    }
}
