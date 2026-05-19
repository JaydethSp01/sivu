package co.uempresarial.sivu.entrevista.web;

import co.uempresarial.sivu.entrevista.service.EntrevistaService;
import co.uempresarial.sivu.entrevista.web.dto.EntrevistaRequest;
import co.uempresarial.sivu.entrevista.web.dto.EntrevistaResponse;
import co.uempresarial.sivu.entrevista.web.dto.ResultadoEntrevistaRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/entrevistas")
@RequiredArgsConstructor
@Tag(name = "Entrevistas",
    description = "Programación y resultado de entrevistas entre la fase de revisión y la preselección de la postulación. Auto-scope por rol.")
public class EntrevistaController {

    private final EntrevistaService service;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Listar entrevistas (auto-scope por rol). Si se pasa postulacionId, filtra por esa.")
    public ResponseEntity<List<EntrevistaResponse>> listar(@RequestParam(required = false) Long postulacionId) {
        return ResponseEntity.ok(service.listar(postulacionId));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Obtener una entrevista por ID")
    public ResponseEntity<EntrevistaResponse> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(service.obtener(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('EMPRESA','COORDINADOR','ADMIN')")
    @Operation(summary = "Programar entrevista para una postulación")
    public ResponseEntity<EntrevistaResponse> programar(@Valid @RequestBody EntrevistaRequest request) {
        return ResponseEntity.ok(service.programar(request));
    }

    @PatchMapping("/{id}/resultado")
    @PreAuthorize("hasAnyRole('EMPRESA','COORDINADOR','ADMIN')")
    @Operation(summary = "Registrar el resultado (APROBADA/RECHAZADA) de la entrevista")
    public ResponseEntity<EntrevistaResponse> registrarResultado(@PathVariable Long id,
                                                                 @Valid @RequestBody ResultadoEntrevistaRequest request) {
        return ResponseEntity.ok(service.registrarResultado(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('EMPRESA','COORDINADOR','ADMIN')")
    @Operation(summary = "Cancelar (eliminar) una entrevista PENDIENTE")
    public ResponseEntity<Void> cancelar(@PathVariable Long id) {
        service.cancelar(id);
        return ResponseEntity.noContent().build();
    }
}
