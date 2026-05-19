package co.uempresarial.sivu.cohorte.web;

import co.uempresarial.sivu.cohorte.domain.EstadoCohorteEstudiante;
import co.uempresarial.sivu.cohorte.service.CohorteService;
import co.uempresarial.sivu.cohorte.web.dto.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/cohortes")
@RequiredArgsConstructor
@Tag(name = "Cohortes", description = "Cohorte de prácticas por semestre académico (2026-1, 2026-2, ...). Coordinación define quiénes van a práctica el próximo semestre.")
public class CohorteController {

    private final CohorteService service;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR')")
    @Operation(summary = "Crear una cohorte para un semestre académico")
    public ResponseEntity<CohorteResponse> crear(@Valid @RequestBody CohorteRequest request) {
        CohorteResponse r = service.crear(request);
        return ResponseEntity.created(URI.create("/api/v1/cohortes/" + r.id())).body(r);
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Listar todas las cohortes")
    public ResponseEntity<List<CohorteResponse>> listar() {
        return ResponseEntity.ok(service.listar());
    }

    @GetMapping("/activas")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Listar solo cohortes activas (para selects)")
    public ResponseEntity<List<CohorteResponse>> activas() {
        return ResponseEntity.ok(service.listarActivas());
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<CohorteResponse> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(service.buscarPorId(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR')")
    public ResponseEntity<CohorteResponse> actualizar(@PathVariable Long id,
                                                      @Valid @RequestBody CohorteRequest request) {
        return ResponseEntity.ok(service.actualizar(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        service.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    // -----------------------------------------------------------------
    // Inscripciones
    // -----------------------------------------------------------------

    @GetMapping("/{id}/estudiantes")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Listar estudiantes inscritos en la cohorte (filtra por estado opcional)")
    public ResponseEntity<List<CohorteEstudianteResponse>> listarEstudiantes(
        @PathVariable Long id,
        @RequestParam(required = false) EstadoCohorteEstudiante estado
    ) {
        return ResponseEntity.ok(service.listarPorCohorte(id, estado));
    }

    @GetMapping("/{id}/resumen")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Conteo de estudiantes por estado en la cohorte")
    public ResponseEntity<Map<String, Long>> resumen(@PathVariable Long id) {
        return ResponseEntity.ok(service.resumenCohorte(id));
    }

    @GetMapping("/{id}/candidatos")
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR')")
    @Operation(summary = "Lista de IDs de estudiantes elegibles aún no inscritos en la cohorte")
    public ResponseEntity<List<Long>> candidatos(@PathVariable Long id) {
        return ResponseEntity.ok(service.candidatos(id));
    }

    @PostMapping("/{id}/estudiantes/{estudianteId}")
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR')")
    @Operation(summary = "Inscribir un estudiante a la cohorte (estado inicial calculado automáticamente)")
    public ResponseEntity<CohorteEstudianteResponse> inscribir(@PathVariable Long id,
                                                               @PathVariable Long estudianteId) {
        CohorteEstudianteResponse r = service.inscribir(id, estudianteId);
        return ResponseEntity.created(URI.create("/api/v1/cohortes/inscripciones/" + r.id())).body(r);
    }

    @PatchMapping("/inscripciones/{inscripcionId}/estado")
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR')")
    @Operation(summary = "Cambiar estado de una inscripción (ELEGIBLE → INSCRITO → PRACTICA_ACTIVA → FINALIZADO)")
    public ResponseEntity<CohorteEstudianteResponse> cambiarEstado(
        @PathVariable Long inscripcionId,
        @Valid @RequestBody CambioEstadoInscripcionRequest request
    ) {
        return ResponseEntity.ok(
            service.cambiarEstado(inscripcionId, request.nuevoEstado(), request.observaciones()));
    }

    @DeleteMapping("/inscripciones/{inscripcionId}")
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR')")
    @Operation(summary = "Quitar un estudiante de la cohorte")
    public ResponseEntity<Void> quitar(@PathVariable Long inscripcionId) {
        service.quitar(inscripcionId);
        return ResponseEntity.noContent().build();
    }
}
