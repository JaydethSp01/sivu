package co.uempresarial.sivu.trimestre.web;

import co.uempresarial.sivu.trimestre.domain.ParteFirmaTrimestre;
import co.uempresarial.sivu.trimestre.pdf.EvaluacionProfesorPdfGenerator;
import co.uempresarial.sivu.trimestre.service.EvaluacionProfesorTrimestreService;
import co.uempresarial.sivu.trimestre.web.dto.EvaluacionProfesorRequest;
import co.uempresarial.sivu.trimestre.web.dto.EvaluacionProfesorResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/trimestres/{trimestreId}/evaluacion-profesor")
@RequiredArgsConstructor
@Tag(name = "Evaluación del Profesor (GAC-FM-1)",
    description = "Evaluación del profesor de acompañamiento al estudiante por trimestre. Pesos: Capacidades 10%, Actitudes 10%, Aplicación 80% (20/50/10). La nota ponderada se calcula automáticamente.")
public class EvaluacionProfesorTrimestreController {

    private final EvaluacionProfesorTrimestreService service;
    private final EvaluacionProfesorPdfGenerator pdfGenerator;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Obtener la EP del trimestre")
    public ResponseEntity<EvaluacionProfesorResponse> obtener(@PathVariable Long trimestreId) {
        return ResponseEntity.ok(service.obtener(trimestreId));
    }

    @PutMapping
    @PreAuthorize("hasAnyRole('COORDINADOR','ADMIN')")
    @Operation(summary = "Crear o actualizar la EP del trimestre (nota ponderada se autocalcula)")
    public ResponseEntity<EvaluacionProfesorResponse> guardar(@PathVariable Long trimestreId,
                                                              @Valid @RequestBody EvaluacionProfesorRequest request) {
        return ResponseEntity.ok(service.guardar(trimestreId, request));
    }

    @PatchMapping("/firmar/{parte}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Firmar como PROFESOR o ESTUDIANTE")
    public ResponseEntity<EvaluacionProfesorResponse> firmar(@PathVariable Long trimestreId,
                                                             @PathVariable ParteFirmaTrimestre parte) {
        return ResponseEntity.ok(service.firmar(trimestreId, parte));
    }

    @GetMapping("/pdf")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Descargar la EP en PDF con formato Uniempresarial (GAC-FM-1)")
    public ResponseEntity<byte[]> descargarPdf(@PathVariable Long trimestreId) {
        byte[] pdf = pdfGenerator.generar(service.obtenerEntidad(trimestreId));
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_PDF)
            .header(HttpHeaders.CONTENT_DISPOSITION,
                "inline; filename=evaluacion-profesor-t" + trimestreId + ".pdf")
            .body(pdf);
    }
}
