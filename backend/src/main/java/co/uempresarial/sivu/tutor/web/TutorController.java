package co.uempresarial.sivu.tutor.web;

import co.uempresarial.sivu.shared.pagination.PageResponse;
import co.uempresarial.sivu.tutor.domain.EstadoTutor;
import co.uempresarial.sivu.tutor.domain.TipoTutor;
import co.uempresarial.sivu.tutor.service.TutorService;
import co.uempresarial.sivu.tutor.web.dto.TutorRequest;
import co.uempresarial.sivu.tutor.web.dto.TutorResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.net.URI;

@RestController
@RequestMapping("/api/v1/tutores")
@RequiredArgsConstructor
@Tag(name = "Tutores", description = "Tutores académicos (de la universidad) y empresariales (de la empresa) que acompañan al practicante durante los 6 meses")
public class TutorController {

    private final TutorService service;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR')")
    @Operation(summary = "Crear un tutor")
    public ResponseEntity<TutorResponse> crear(@Valid @RequestBody TutorRequest request) {
        TutorResponse created = service.crear(request);
        return ResponseEntity.created(URI.create("/api/v1/tutores/" + created.id())).body(created);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR','EMPRESA','ESTUDIANTE','MCP_AGENT')")
    @Operation(summary = "Listar tutores con filtros")
    public ResponseEntity<PageResponse<TutorResponse>> listar(
        @RequestParam(required = false) String q,
        @RequestParam(required = false) TipoTutor tipo,
        @RequestParam(required = false) EstadoTutor estado,
        @RequestParam(required = false) Long empresaId,
        @ParameterObject Pageable pageable
    ) {
        return ResponseEntity.ok(service.listar(q, tipo, estado, empresaId, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Obtener un tutor por id")
    public ResponseEntity<TutorResponse> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(service.buscarPorId(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR')")
    @Operation(summary = "Actualizar un tutor")
    public ResponseEntity<TutorResponse> actualizar(@PathVariable Long id, @Valid @RequestBody TutorRequest request) {
        return ResponseEntity.ok(service.actualizar(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Eliminar un tutor")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        service.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
