package co.uempresarial.sivu.trimestre.web;

import co.uempresarial.sivu.trimestre.domain.ParteFirmaTrimestre;
import co.uempresarial.sivu.trimestre.pdf.EvaluacionTutorPdfGenerator;
import co.uempresarial.sivu.trimestre.service.EvaluacionTutorTrimestreService;
import co.uempresarial.sivu.trimestre.web.dto.EvaluacionTutorRequest;
import co.uempresarial.sivu.trimestre.web.dto.EvaluacionTutorResponse;
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
@RequestMapping("/api/v1/trimestres/{trimestreId}/evaluacion-tutor")
@RequiredArgsConstructor
@Tag(name = "Evaluación del Tutor (GAC-FM-9)",
    description = "Evaluación del tutor empresarial al estudiante por trimestre. Pesos: Capacidades 40%, Actitudes 40%, Aplicación 20% (10/5/5). La nota ponderada se calcula automáticamente.")
public class EvaluacionTutorTrimestreController {

    private final EvaluacionTutorTrimestreService service;
    private final EvaluacionTutorPdfGenerator pdfGenerator;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Obtener la ET del trimestre")
    public ResponseEntity<EvaluacionTutorResponse> obtener(@PathVariable Long trimestreId) {
        return ResponseEntity.ok(service.obtener(trimestreId));
    }

    @PutMapping
    @PreAuthorize("hasAnyRole('EMPRESA','COORDINADOR','ADMIN')")
    @Operation(summary = "Crear o actualizar la ET del trimestre (nota ponderada se autocalcula)")
    public ResponseEntity<EvaluacionTutorResponse> guardar(@PathVariable Long trimestreId,
                                                           @Valid @RequestBody EvaluacionTutorRequest request) {
        return ResponseEntity.ok(service.guardar(trimestreId, request));
    }

    @PatchMapping("/firmar/{parte}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Firmar como TUTOR o ESTUDIANTE")
    public ResponseEntity<EvaluacionTutorResponse> firmar(@PathVariable Long trimestreId,
                                                          @PathVariable ParteFirmaTrimestre parte) {
        return ResponseEntity.ok(service.firmar(trimestreId, parte));
    }

    @GetMapping("/pdf")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Descargar la ET en PDF con formato Uniempresarial (GAC-FM-9)")
    public ResponseEntity<byte[]> descargarPdf(@PathVariable Long trimestreId) {
        byte[] pdf = pdfGenerator.generar(service.obtenerEntidad(trimestreId));
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_PDF)
            .header(HttpHeaders.CONTENT_DISPOSITION,
                "inline; filename=evaluacion-tutor-t" + trimestreId + ".pdf")
            .body(pdf);
    }
}
