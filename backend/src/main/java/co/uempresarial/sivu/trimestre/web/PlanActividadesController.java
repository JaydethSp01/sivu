package co.uempresarial.sivu.trimestre.web;

import co.uempresarial.sivu.ia.service.InformeIAService;
import co.uempresarial.sivu.ia.web.dto.IADtos.CoherenciaPlanResponse;
import co.uempresarial.sivu.security.domain.Usuario;
import co.uempresarial.sivu.security.service.CurrentUserService;
import co.uempresarial.sivu.shared.exception.BusinessException;
import co.uempresarial.sivu.trimestre.domain.ParteFirmaTrimestre;
import co.uempresarial.sivu.trimestre.pdf.PlanActividadesPdfGenerator;
import co.uempresarial.sivu.trimestre.service.PlanActividadesService;
import co.uempresarial.sivu.trimestre.web.dto.PlanActividadesComentarioRequest;
import co.uempresarial.sivu.trimestre.web.dto.PlanActividadesComentarioResponse;
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

import java.util.List;

@RestController
@RequestMapping("/api/v1/trimestres/{trimestreId}/plan-actividades")
@RequiredArgsConstructor
@Tag(name = "Plan de Actividades (GAC-FM-10)",
    description = "Plan de actividades del estudiante en fase empresa. Idempotente por trimestre. Requiere firma de estudiante, tutor empresarial y profesor.")
public class PlanActividadesController {

    private final PlanActividadesService service;
    private final PlanActividadesPdfGenerator pdfGenerator;
    private final CurrentUserService currentUser;
    private final InformeIAService informeIAService;

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

    @PostMapping("/ia-coherencia")
    @PreAuthorize("hasAnyRole('ESTUDIANTE','COORDINADOR','ADMIN')")
    @Operation(summary = "Chequeo de coherencia con IA del Plan de Actividades: cruza objetivos y "
        + "actividades por mes y devuelve advertencias/sugerencias. Usa el IA sidecar (plan Claude Code) "
        + "con fallback heurístico local. Es INFORMATIVO: no bloquea la firma del plan.")
    public ResponseEntity<CoherenciaPlanResponse> iaCoherencia(@PathVariable Long trimestreId) {
        return ResponseEntity.ok(informeIAService.coherenciaPlan(trimestreId));
    }

    // ----- Hilo del flujo de aprobación tripartito (BI-04 / RF-A01) -----

    @GetMapping("/comentarios")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Historial de feedback y respuestas de aprobación/rechazo del PA")
    public ResponseEntity<List<PlanActividadesComentarioResponse>> listarComentarios(
        @PathVariable Long trimestreId) {
        return ResponseEntity.ok(service.listarComentarios(trimestreId));
    }

    @PostMapping("/comentarios")
    @PreAuthorize("hasAnyRole('ESTUDIANTE','COORDINADOR','ADMIN','DOCENTE','TUTOR')")
    @Operation(summary = "Agregar un mensaje al hilo (FEEDBACK / RESPUESTA_APROBACION / RESPUESTA_RECHAZO). "
        + "RESPUESTA_RECHAZO devuelve el plan a BORRADOR; RESPUESTA_APROBACION avanza el estado de firma.")
    public ResponseEntity<PlanActividadesComentarioResponse> agregarComentario(
        @PathVariable Long trimestreId,
        @Valid @RequestBody PlanActividadesComentarioRequest request) {
        Usuario autor = currentUser.current()
            .orElseThrow(() -> new BusinessException("No hay usuario autenticado"));
        return ResponseEntity.ok(service.agregarComentario(trimestreId, request, autor));
    }
}
