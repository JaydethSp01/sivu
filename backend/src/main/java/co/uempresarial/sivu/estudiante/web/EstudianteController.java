package co.uempresarial.sivu.estudiante.web;

import co.uempresarial.sivu.estudiante.domain.EstadoEstudiante;
import co.uempresarial.sivu.estudiante.service.EstudianteService;
import co.uempresarial.sivu.estudiante.web.dto.EstudianteRequest;
import co.uempresarial.sivu.estudiante.web.dto.EstudianteResponse;
import co.uempresarial.sivu.shared.pagination.PageResponse;
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
@RequestMapping("/api/v1/estudiantes")
@RequiredArgsConstructor
@Tag(name = "Estudiantes", description = "Gestión del CRUD de estudiantes de pregrado")
public class EstudianteController {

    private final EstudianteService service;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR')")
    @Operation(summary = "Crear un nuevo estudiante")
    public ResponseEntity<EstudianteResponse> crear(@Valid @RequestBody EstudianteRequest request) {
        EstudianteResponse created = service.crear(request);
        return ResponseEntity.created(URI.create("/api/v1/estudiantes/" + created.id())).body(created);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR','DOCENTE','TUTOR','MCP_AGENT')")
    @Operation(summary = "Listar estudiantes con filtros y paginación")
    public ResponseEntity<PageResponse<EstudianteResponse>> listar(
        @RequestParam(required = false) String q,
        @RequestParam(required = false) EstadoEstudiante estado,
        @ParameterObject Pageable pageable
    ) {
        return ResponseEntity.ok(service.listar(q, estado, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR','DOCENTE','TUTOR','ESTUDIANTE','MCP_AGENT')")
    @Operation(summary = "Obtener un estudiante por id")
    public ResponseEntity<EstudianteResponse> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(service.buscarPorId(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR')")
    @Operation(summary = "Actualizar un estudiante")
    public ResponseEntity<EstudianteResponse> actualizar(@PathVariable Long id,
                                                         @Valid @RequestBody EstudianteRequest request) {
        return ResponseEntity.ok(service.actualizar(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Eliminar un estudiante")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        service.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
