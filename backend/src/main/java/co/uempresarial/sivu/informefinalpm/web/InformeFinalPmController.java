package co.uempresarial.sivu.informefinalpm.web;

import co.uempresarial.sivu.ia.service.InformeIAService;
import co.uempresarial.sivu.ia.web.dto.IADtos.FeedbackInformeResponse;
import co.uempresarial.sivu.informefinalpm.pdf.InformeFinalPmPdfGenerator;
import co.uempresarial.sivu.informefinalpm.service.InformeFinalPmService;
import co.uempresarial.sivu.informefinalpm.web.dto.AltoImpactoRequest;
import co.uempresarial.sivu.informefinalpm.web.dto.InformeFinalPmRequest;
import co.uempresarial.sivu.informefinalpm.web.dto.InformeFinalPmResponse;
import co.uempresarial.sivu.informefinalpm.web.dto.RegistrarNotaRequest;
import co.uempresarial.sivu.informefinalpm.web.dto.SeccionesInformeRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@Tag(name = "Informe Final PM (GTC-FM-16)",
    description = "Informe Final del Plan Especial de Mejora con secciones académicas (máx 15 páginas).")
public class InformeFinalPmController {

    private final InformeFinalPmService service;
    private final InformeFinalPmPdfGenerator pdfGenerator;
    private final InformeIAService informeIAService;

    @GetMapping("/api/v1/planes-mejora/{planMejoraId}/informe-final")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Obtener el Informe Final asociado al PM")
    public ResponseEntity<InformeFinalPmResponse> obtener(@PathVariable Long planMejoraId) {
        return ResponseEntity.ok(service.obtenerPorPlanMejora(planMejoraId));
    }

    @PutMapping("/api/v1/planes-mejora/{planMejoraId}/informe-final")
    @PreAuthorize("hasAnyRole('ESTUDIANTE','COORDINADOR','ADMIN')")
    @Operation(summary = "Crear o actualizar el borrador del Informe Final")
    public ResponseEntity<InformeFinalPmResponse> guardarBorrador(@PathVariable Long planMejoraId,
                                                                  @Valid @RequestBody InformeFinalPmRequest request) {
        return ResponseEntity.ok(service.guardarBorrador(planMejoraId, request));
    }

    @PutMapping("/api/v1/informes-final-pm/{id}/secciones")
    @PreAuthorize("hasAnyRole('ESTUDIANTE','COORDINADOR','ADMIN')")
    @Operation(summary = "Guardar las 12 secciones del editor estructurado del Informe Final (RF-A04 #1). "
        + "Persiste y devuelve el informe con las 12 secciones; maxPaginas=15 y cumpleNotaMinima son informativos.")
    public ResponseEntity<InformeFinalPmResponse> actualizarSecciones(
            @PathVariable Long id, @Valid @RequestBody SeccionesInformeRequest request) {
        return ResponseEntity.ok(service.actualizarSecciones(id, request));
    }

    @PostMapping("/api/v1/informes-final-pm/{id}/entregar")
    @PreAuthorize("hasAnyRole('ESTUDIANTE','COORDINADOR','ADMIN')")
    @Operation(summary = "Entregar el Informe (valida secciones mínimas y ≤ 15 páginas)")
    public ResponseEntity<InformeFinalPmResponse> entregar(@PathVariable Long id) {
        return ResponseEntity.ok(service.entregar(id));
    }

    @PostMapping("/api/v1/informes-final-pm/{id}/aprobar")
    @PreAuthorize("hasAnyRole('COORDINADOR','ADMIN')")
    @Operation(summary = "Aprobar el Informe Final")
    public ResponseEntity<InformeFinalPmResponse> aprobar(@PathVariable Long id) {
        return ResponseEntity.ok(service.aprobar(id));
    }

    @PostMapping("/api/v1/informes-final-pm/{id}/rechazar")
    @PreAuthorize("hasAnyRole('COORDINADOR','ADMIN')")
    @Operation(summary = "Rechazar el Informe Final con observaciones")
    public ResponseEntity<InformeFinalPmResponse> rechazar(@PathVariable Long id,
                                                            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(service.rechazar(id, body.get("observaciones")));
    }

    @PatchMapping("/api/v1/informes-final-pm/{id}/nota-tutor")
    @PreAuthorize("hasAnyRole('TUTOR','EMPRESA','COORDINADOR','ADMIN')")
    @Operation(summary = "Registrar la nota individual del tutor empresarial (BI-07)")
    public ResponseEntity<InformeFinalPmResponse> registrarNotaTutor(
            @PathVariable Long id, @Valid @RequestBody RegistrarNotaRequest request) {
        return ResponseEntity.ok(service.registrarNotaTutor(id, request.nota()));
    }

    @PatchMapping("/api/v1/informes-final-pm/{id}/nota-profesor")
    @PreAuthorize("hasAnyRole('COORDINADOR','ADMIN')")
    @Operation(summary = "Registrar la nota individual del profesor / docente acompañante (BI-07)")
    public ResponseEntity<InformeFinalPmResponse> registrarNotaProfesor(
            @PathVariable Long id, @Valid @RequestBody RegistrarNotaRequest request) {
        return ResponseEntity.ok(service.registrarNotaProfesor(id, request.nota()));
    }

    @PatchMapping("/api/v1/informes-final-pm/{id}/alto-impacto")
    @PreAuthorize("hasAnyRole('COORDINADOR','ADMIN')")
    @Operation(summary = "Marcar / desmarcar el informe como Alto Impacto (BI-07)")
    public ResponseEntity<InformeFinalPmResponse> marcarAltoImpacto(
            @PathVariable Long id, @Valid @RequestBody AltoImpactoRequest request) {
        return ResponseEntity.ok(service.marcarAltoImpacto(id, request.altoImpacto()));
    }

    @PostMapping("/api/v1/informes-final-pm/{id}/ia-feedback")
    @PreAuthorize("hasAnyRole('ESTUDIANTE','COORDINADOR','ADMIN')")
    @Operation(summary = "Feedback de IA sobre el Informe Final (12 secciones GTC-FM-16). "
        + "Usa el plan de Claude Code vía el IA sidecar; si no responde, cae a un análisis heurístico local. "
        + "Informativo: no cambia el estado del informe.")
    public ResponseEntity<FeedbackInformeResponse> iaFeedback(@PathVariable Long id) {
        return ResponseEntity.ok(informeIAService.revisar(id));
    }

    @GetMapping("/api/v1/informes-final-pm/{id}/pdf")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Descargar el Informe Final en PDF (GTC-FM-16)")
    public ResponseEntity<byte[]> descargarPdf(@PathVariable Long id) {
        byte[] pdf = service.generarPdf(id);
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_PDF)
            .header(HttpHeaders.CONTENT_DISPOSITION,
                "inline; filename=informe-final-pm-" + id + ".pdf")
            .body(pdf);
    }
}
