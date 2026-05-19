package co.uempresarial.sivu.vacante.web;

import co.uempresarial.sivu.shared.pagination.PageResponse;
import co.uempresarial.sivu.vacante.domain.EstadoVacante;
import co.uempresarial.sivu.vacante.service.VacanteService;
import co.uempresarial.sivu.vacante.web.dto.VacanteRequest;
import co.uempresarial.sivu.vacante.web.dto.VacanteResponse;
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
@RequestMapping("/api/v1/vacantes")
@RequiredArgsConstructor
@Tag(name = "Vacantes", description = "Gestión del CRUD de vacantes de prácticas")
public class VacanteController {

    private final VacanteService service;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR','EMPRESA')")
    @Operation(summary = "Crear una nueva vacante")
    public ResponseEntity<VacanteResponse> crear(@Valid @RequestBody VacanteRequest request) {
        VacanteResponse created = service.crear(request);
        return ResponseEntity.created(URI.create("/api/v1/vacantes/" + created.id())).body(created);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR','EMPRESA','ESTUDIANTE','MCP_AGENT')")
    @Operation(summary = "Listar vacantes con filtros y paginación")
    public ResponseEntity<PageResponse<VacanteResponse>> listar(
        @RequestParam(required = false) String q,
        @RequestParam(required = false) EstadoVacante estado,
        @RequestParam(required = false) Long empresaId,
        @ParameterObject Pageable pageable
    ) {
        return ResponseEntity.ok(service.listar(q, estado, empresaId, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR','EMPRESA','ESTUDIANTE','MCP_AGENT')")
    @Operation(summary = "Obtener una vacante por id")
    public ResponseEntity<VacanteResponse> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(service.buscarPorId(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR','EMPRESA')")
    @Operation(summary = "Actualizar una vacante")
    public ResponseEntity<VacanteResponse> actualizar(@PathVariable Long id,
                                                      @Valid @RequestBody VacanteRequest request) {
        return ResponseEntity.ok(service.actualizar(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR')")
    @Operation(summary = "Eliminar una vacante")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        service.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
