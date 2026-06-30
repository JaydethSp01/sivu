package co.uempresarial.sivu.evaluacion.web;

import co.uempresarial.sivu.evaluacion.service.EvaluacionService;
import co.uempresarial.sivu.evaluacion.web.dto.EvaluacionRequest;
import co.uempresarial.sivu.evaluacion.web.dto.EvaluacionResponse;
import co.uempresarial.sivu.evaluacion.web.dto.ResumenEvaluacionesResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.net.URI;

@RestController
@RequestMapping("/api/v1/evaluaciones")
@RequiredArgsConstructor
@Tag(name = "Evaluaciones", description = "Evaluaciones intermedias y finales de la práctica por tutor académico y empresarial; promedios y calificación final sugerida")
public class EvaluacionController {

    private final EvaluacionService service;

    @PostMapping
    @PreAuthorize("hasAnyRole('COORDINADOR','TUTOR','DOCENTE','ADMIN')")
    @Operation(summary = "Registrar una evaluación (intermedia o final) realizada por un tutor")
    public ResponseEntity<EvaluacionResponse> crear(@Valid @RequestBody EvaluacionRequest request) {
        EvaluacionResponse r = service.crear(request);
        return ResponseEntity.created(URI.create("/api/v1/evaluaciones/" + r.id())).body(r);
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Obtener una evaluación por id")
    public ResponseEntity<EvaluacionResponse> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(service.buscarPorId(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('COORDINADOR','TUTOR','DOCENTE','ADMIN')")
    @Operation(summary = "Actualizar una evaluación")
    public ResponseEntity<EvaluacionResponse> actualizar(@PathVariable Long id, @Valid @RequestBody EvaluacionRequest request) {
        return ResponseEntity.ok(service.actualizar(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR')")
    @Operation(summary = "Eliminar una evaluación")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        service.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/resumen/{convenioId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Resumen y promedios de las evaluaciones de un convenio + calificación final sugerida si hay ambas evaluaciones FINAL")
    public ResponseEntity<ResumenEvaluacionesResponse> resumen(@PathVariable Long convenioId) {
        return ResponseEntity.ok(service.resumenPorConvenio(convenioId));
    }
}
