package co.uempresarial.sivu.catalogo.requisito.web;

import co.uempresarial.sivu.catalogo.requisito.domain.AplicaA;
import co.uempresarial.sivu.catalogo.requisito.service.TipoRequisitoService;
import co.uempresarial.sivu.catalogo.requisito.web.dto.TipoRequisitoRequest;
import co.uempresarial.sivu.catalogo.requisito.web.dto.TipoRequisitoResponse;
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
import java.util.List;

@RestController
@RequestMapping("/api/v1/tipos-requisito")
@RequiredArgsConstructor
@Tag(name = "Tipos de requisito documental", description = "Gestión del catálogo de tipos de requisito documental")
public class TipoRequisitoController {

    private final TipoRequisitoService service;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR')")
    @Operation(summary = "Crear un nuevo tipo de requisito documental")
    public ResponseEntity<TipoRequisitoResponse> crear(@Valid @RequestBody TipoRequisitoRequest request) {
        TipoRequisitoResponse created = service.crear(request);
        return ResponseEntity.created(URI.create("/api/v1/tipos-requisito/" + created.id())).body(created);
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Listar tipos de requisito con filtros y paginación")
    public ResponseEntity<PageResponse<TipoRequisitoResponse>> listar(
        @RequestParam(required = false) String q,
        @RequestParam(required = false) AplicaA aplicaA,
        @RequestParam(required = false) Boolean activo,
        @ParameterObject Pageable pageable
    ) {
        return ResponseEntity.ok(service.listar(q, aplicaA, activo, pageable));
    }

    @GetMapping("/activos")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Listar tipos de requisito activos (sin paginar) para selects de UI, filtrables por aplicaA")
    public ResponseEntity<List<TipoRequisitoResponse>> listarActivos(
        @RequestParam(required = false) AplicaA aplicaA
    ) {
        return ResponseEntity.ok(service.listarActivos(aplicaA));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Obtener un tipo de requisito por id")
    public ResponseEntity<TipoRequisitoResponse> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(service.buscarPorId(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR')")
    @Operation(summary = "Actualizar un tipo de requisito")
    public ResponseEntity<TipoRequisitoResponse> actualizar(@PathVariable Long id,
                                                            @Valid @RequestBody TipoRequisitoRequest request) {
        return ResponseEntity.ok(service.actualizar(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR')")
    @Operation(summary = "Eliminar un tipo de requisito")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        service.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
