package co.uempresarial.sivu.trimestre.web;

import co.uempresarial.sivu.trimestre.service.TrimestreService;
import co.uempresarial.sivu.trimestre.web.dto.TrimestreRequest;
import co.uempresarial.sivu.trimestre.web.dto.TrimestreResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequiredArgsConstructor
@Tag(name = "Trimestres", description = "Modela el durante de la práctica como lo vive Uniempresarial: un convenio se divide en 1-3 trimestres con materia núcleo. Cada trimestre agrupa PA, Actas, Plan de Mejora, Evaluación del Tutor y Evaluación del Profesor.")
public class TrimestreController {

    private final TrimestreService service;

    @PostMapping("/api/v1/convenios/{convenioId}/trimestres")
    @PreAuthorize("hasAnyRole('COORDINADOR','ADMIN')")
    @Operation(summary = "Crear un trimestre nuevo (autocrea el Plan de Actividades en BORRADOR)")
    public ResponseEntity<TrimestreResponse> crear(@PathVariable Long convenioId,
                                                   @Valid @RequestBody TrimestreRequest request) {
        TrimestreResponse r = service.crear(convenioId, request);
        return ResponseEntity.created(URI.create("/api/v1/trimestres/" + r.id())).body(r);
    }

    @GetMapping("/api/v1/convenios/{convenioId}/trimestres")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Listar los trimestres de un convenio")
    public ResponseEntity<List<TrimestreResponse>> listarPorConvenio(@PathVariable Long convenioId) {
        return ResponseEntity.ok(service.listarPorConvenio(convenioId));
    }

    @GetMapping("/api/v1/trimestres/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Obtener un trimestre por id")
    public ResponseEntity<TrimestreResponse> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(service.buscarPorId(id));
    }

    @PutMapping("/api/v1/trimestres/{id}")
    @PreAuthorize("hasAnyRole('COORDINADOR','ADMIN')")
    @Operation(summary = "Actualizar materia núcleo, fechas y estado del trimestre")
    public ResponseEntity<TrimestreResponse> actualizar(@PathVariable Long id,
                                                        @Valid @RequestBody TrimestreRequest request) {
        return ResponseEntity.ok(service.actualizar(id, request));
    }

    @DeleteMapping("/api/v1/trimestres/{id}")
    @PreAuthorize("hasAnyRole('COORDINADOR','ADMIN')")
    @Operation(summary = "Eliminar un trimestre (cascada con sus PA/Actas/PM/ET/EP)")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        service.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
