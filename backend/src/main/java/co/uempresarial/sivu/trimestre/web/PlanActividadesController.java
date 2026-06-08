package co.uempresarial.sivu.trimestre.web;

import co.uempresarial.sivu.trimestre.domain.ParteFirmaTrimestre;
import co.uempresarial.sivu.trimestre.pdf.PlanActividadesPdfGenerator;
import co.uempresarial.sivu.trimestre.service.PlanActividadesService;
import co.uempresarial.sivu.trimestre.web.dto.PlanActividadesRequest;
import co.uempresarial.sivu.trimestre.web.dto.PlanActividadesResponse;
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
@RequestMapping("/api/v1/trimestres/{trimestreId}/plan-actividades")
@RequiredArgsConstructor
@Tag(name = "Plan de Actividades (GAC-FM-10)",
    description = "Plan de actividades del estudiante en fase empresa. Idempotente por trimestre. Requiere firma de estudiante, tutor empresarial y profesor.")
public class PlanActividadesController {

    private final PlanActividadesService service;
    private final PlanActividadesPdfGenerator pdfGenerator;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Obtener el PA del trimestre")
    public ResponseEntity<PlanActividadesResponse> obtener(@PathVariable Long trimestreId) {
        return ResponseEntity.ok(service.obtener(trimestreId));
    }

    @PutMapping
    @PreAuthorize("hasAnyRole('ESTUDIANTE','COORDINADOR','ADMIN')")
    @Operation(summary = "Crear o actualizar (idempotente) el PA del trimestre")
    public ResponseEntity<PlanActividadesResponse> guardar(@PathVariable Long trimestreId,
                                                           @Valid @RequestBody PlanActividadesRequest request) {
        return ResponseEntity.ok(service.guardar(trimestreId, request));
    }

    @PatchMapping("/firmar/{parte}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Firmar el PA como ESTUDIANTE | TUTOR | PROFESOR (al tener las 3 firmas → APROBADO_PROFESOR)")
    public ResponseEntity<PlanActividadesResponse> firmar(@PathVariable Long trimestreId,
                                                          @PathVariable ParteFirmaTrimestre parte) {
        return ResponseEntity.ok(service.firmar(trimestreId, parte));
    }

    @GetMapping("/pdf")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Descargar el PA en PDF con el formato Uniempresarial (GAC-FM-10)")
    public ResponseEntity<byte[]> descargarPdf(@PathVariable Long trimestreId) {
        byte[] pdf = service.generarPdf(trimestreId);
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_PDF)
            .header(HttpHeaders.CONTENT_DISPOSITION,
                "inline; filename=plan-actividades-t" + trimestreId + ".pdf")
            .body(pdf);
    }
}
