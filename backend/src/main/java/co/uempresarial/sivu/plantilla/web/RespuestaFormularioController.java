package co.uempresarial.sivu.plantilla.web;

import co.uempresarial.sivu.plantilla.domain.EstadoRespuesta;
import co.uempresarial.sivu.plantilla.pdf.RespuestaFormularioPdfGenerator;
import co.uempresarial.sivu.plantilla.service.RespuestaFormularioService;
import co.uempresarial.sivu.plantilla.web.dto.RespuestaDtos.*;
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
@RequestMapping("/api/v1/respuestas-formulario")
@RequiredArgsConstructor
@Tag(name = "Respuestas a plantillas",
    description = "Una respuesta es una instancia llenada por un usuario de una plantilla. Soporta asignar, llenar, entregar, firmar, aprobar/rechazar y descargar PDF.")
public class RespuestaFormularioController {

    private final RespuestaFormularioService service;
    private final RespuestaFormularioPdfGenerator pdfGenerator;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR')")
    @Operation(summary = "Asignar una plantilla a alguien (crea la instancia PENDIENTE)")
    public ResponseEntity<RespuestaResponse> asignar(@Valid @RequestBody AsignarRequest req) {
        return ResponseEntity.ok(service.asignar(req));
    }

    @GetMapping("/mias")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Mis formularios asignados")
    public ResponseEntity<List<RespuestaResponse>> mias() {
        return ResponseEntity.ok(service.mias());
    }

    @GetMapping("/bandeja")
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR')")
    @Operation(summary = "Bandeja de Coformación (filtra por estado, default ENTREGADO)")
    public ResponseEntity<List<RespuestaResponse>> bandeja(
        @RequestParam(defaultValue = "ENTREGADO") EstadoRespuesta estado) {
        return ResponseEntity.ok(service.bandeja(estado));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<RespuestaResponse> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(service.obtener(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Llenar/actualizar valores (autoguardado)")
    public ResponseEntity<RespuestaResponse> llenar(@PathVariable Long id, @RequestBody LlenarRequest req) {
        return ResponseEntity.ok(service.llenar(id, req));
    }

    @PostMapping("/{id}/entregar")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<RespuestaResponse> entregar(@PathVariable Long id) {
        return ResponseEntity.ok(service.entregar(id));
    }

    @PostMapping("/{id}/firmar")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<RespuestaResponse> firmar(@PathVariable Long id) {
        return ResponseEntity.ok(service.firmar(id));
    }

    @PostMapping("/{id}/aprobar")
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR')")
    public ResponseEntity<RespuestaResponse> aprobar(@PathVariable Long id,
                                                     @RequestBody(required = false) ResolverRequest body) {
        return ResponseEntity.ok(service.aprobar(id, body));
    }

    @PostMapping("/{id}/rechazar")
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR')")
    public ResponseEntity<RespuestaResponse> rechazar(@PathVariable Long id,
                                                     @Valid @RequestBody ResolverRequest body) {
        return ResponseEntity.ok(service.rechazar(id, body));
    }

    @GetMapping("/{id}/pdf")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Descargar PDF dinámico desde la plantilla + respuestas")
    public ResponseEntity<byte[]> pdf(@PathVariable Long id) {
        byte[] pdf = pdfGenerator.generar(service.obtenerEntidad(id));
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_PDF)
            .header(HttpHeaders.CONTENT_DISPOSITION,
                "inline; filename=formulario-" + id + ".pdf")
            .body(pdf);
    }
}
