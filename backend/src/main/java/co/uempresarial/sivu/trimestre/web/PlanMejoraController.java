package co.uempresarial.sivu.trimestre.web;

import co.uempresarial.sivu.trimestre.service.PlanMejoraService;
import co.uempresarial.sivu.trimestre.web.dto.PlanMejoraRequest;
import co.uempresarial.sivu.trimestre.web.dto.PlanMejoraResponse;
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
@Tag(name = "Planes de Mejora",
    description = "Planes Especiales de Mejora (PEM) por trimestre. Cada trimestre puede tener máximo 2 planes (numero 1|2).")
public class PlanMejoraController {

    private final PlanMejoraService service;

    @GetMapping("/api/v1/trimestres/{trimestreId}/planes-mejora")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Listar planes de mejora del trimestre")
    public ResponseEntity<List<PlanMejoraResponse>> listar(@PathVariable Long trimestreId) {
        return ResponseEntity.ok(service.listarPorTrimestre(trimestreId));
    }

    @PostMapping("/api/v1/trimestres/{trimestreId}/planes-mejora")
    @PreAuthorize("hasAnyRole('ESTUDIANTE','COORDINADOR','ADMIN')")
    @Operation(summary = "Crear un plan de mejora (numero 1 o 2)")
    public ResponseEntity<PlanMejoraResponse> crear(@PathVariable Long trimestreId,
                                                    @Valid @RequestBody PlanMejoraRequest request) {
        PlanMejoraResponse r = service.crear(trimestreId, request);
        return ResponseEntity.created(URI.create("/api/v1/planes-mejora/" + r.id())).body(r);
    }

    @GetMapping("/api/v1/planes-mejora/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Obtener un plan de mejora por id")
    public ResponseEntity<PlanMejoraResponse> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(service.obtener(id));
    }

    @PutMapping("/api/v1/planes-mejora/{id}")
    @PreAuthorize("hasAnyRole('ESTUDIANTE','COORDINADOR','ADMIN')")
    @Operation(summary = "Actualizar un plan de mejora")
    public ResponseEntity<PlanMejoraResponse> actualizar(@PathVariable Long id,
                                                         @Valid @RequestBody PlanMejoraRequest request) {
        return ResponseEntity.ok(service.actualizar(id, request));
    }

    @DeleteMapping("/api/v1/planes-mejora/{id}")
    @PreAuthorize("hasAnyRole('COORDINADOR','ADMIN')")
    @Operation(summary = "Eliminar un plan de mejora")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        service.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
