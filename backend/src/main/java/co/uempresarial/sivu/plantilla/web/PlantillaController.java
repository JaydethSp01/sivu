package co.uempresarial.sivu.plantilla.web;

import co.uempresarial.sivu.plantilla.domain.TipoPlantilla;
import co.uempresarial.sivu.plantilla.service.PlantillaService;
import co.uempresarial.sivu.plantilla.web.dto.PlantillaDtos.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/plantillas")
@RequiredArgsConstructor
@Tag(name = "Plantillas de formularios",
    description = "CRUD de plantillas institucionales (GAC-FM-007, GAC-FM-1, GAC-FM-11, GAC-FM-10, GTC-FM-16). Coformación las arma; los involucrados las llenan.")
public class PlantillaController {

    private final PlantillaService service;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Listar todas las plantillas (puede filtrar por tipo)")
    public ResponseEntity<List<PlantillaResponse>> listar(@RequestParam(required = false) TipoPlantilla tipo) {
        return ResponseEntity.ok(tipo == null ? service.listar() : service.listarPorTipo(tipo));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Obtener una plantilla con sus secciones y criterios")
    public ResponseEntity<PlantillaResponse> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(service.obtener(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR')")
    @Operation(summary = "Crear nueva plantilla (no vigente)")
    public ResponseEntity<PlantillaResponse> crear(@Valid @RequestBody PlantillaRequest req) {
        return ResponseEntity.ok(service.crear(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR')")
    @Operation(summary = "Actualizar metadata de la plantilla (no se permite si está vigente)")
    public ResponseEntity<PlantillaResponse> actualizar(@PathVariable Long id, @Valid @RequestBody PlantillaRequest req) {
        return ResponseEntity.ok(service.actualizar(id, req));
    }

    @PostMapping("/{id}/vigente")
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR')")
    @Operation(summary = "Marcar esta plantilla como vigente (desactiva la anterior del mismo tipo)")
    public ResponseEntity<PlantillaResponse> marcarVigente(@PathVariable Long id) {
        return ResponseEntity.ok(service.marcarVigente(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR')")
    @Operation(summary = "Eliminar plantilla (solo si no es vigente y no tiene respuestas)")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        service.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    // ----- Secciones -----
    @PostMapping("/{plantillaId}/secciones")
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR')")
    public ResponseEntity<SeccionResponse> agregarSeccion(@PathVariable Long plantillaId, @Valid @RequestBody SeccionRequest req) {
        return ResponseEntity.ok(service.agregarSeccion(plantillaId, req));
    }

    @PutMapping("/secciones/{seccionId}")
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR')")
    public ResponseEntity<SeccionResponse> actualizarSeccion(@PathVariable Long seccionId, @Valid @RequestBody SeccionRequest req) {
        return ResponseEntity.ok(service.actualizarSeccion(seccionId, req));
    }

    @DeleteMapping("/secciones/{seccionId}")
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR')")
    public ResponseEntity<Void> eliminarSeccion(@PathVariable Long seccionId) {
        service.eliminarSeccion(seccionId);
        return ResponseEntity.noContent().build();
    }

    // ----- Criterios -----
    @PostMapping("/secciones/{seccionId}/criterios")
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR')")
    public ResponseEntity<CriterioResponse> agregarCriterio(@PathVariable Long seccionId, @Valid @RequestBody CriterioRequest req) {
        return ResponseEntity.ok(service.agregarCriterio(seccionId, req));
    }

    @PutMapping("/criterios/{criterioId}")
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR')")
    public ResponseEntity<CriterioResponse> actualizarCriterio(@PathVariable Long criterioId, @Valid @RequestBody CriterioRequest req) {
        return ResponseEntity.ok(service.actualizarCriterio(criterioId, req));
    }

    @DeleteMapping("/criterios/{criterioId}")
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR')")
    public ResponseEntity<Void> eliminarCriterio(@PathVariable Long criterioId) {
        service.eliminarCriterio(criterioId);
        return ResponseEntity.noContent().build();
    }

    // ----- Reordenar (drag & drop) -----
    @PostMapping("/{plantillaId}/secciones/reordenar")
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR')")
    @Operation(summary = "Reordenar secciones (lista de IDs en el nuevo orden)")
    public ResponseEntity<Void> reordenarSecciones(@PathVariable Long plantillaId,
                                                    @RequestBody ReordenarRequest req) {
        service.reordenarSecciones(plantillaId, req.ids());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/secciones/{seccionId}/criterios/reordenar")
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR')")
    @Operation(summary = "Reordenar criterios dentro de una sección")
    public ResponseEntity<Void> reordenarCriterios(@PathVariable Long seccionId,
                                                    @RequestBody ReordenarRequest req) {
        service.reordenarCriterios(seccionId, req.ids());
        return ResponseEntity.noContent().build();
    }
}
