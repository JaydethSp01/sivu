package co.uempresarial.sivu.catalogo.modalidad.web;

import co.uempresarial.sivu.catalogo.modalidad.service.ModalidadService;
import co.uempresarial.sivu.catalogo.modalidad.web.dto.ModalidadRequest;
import co.uempresarial.sivu.catalogo.modalidad.web.dto.ModalidadResponse;
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
@RequestMapping("/api/v1/modalidades")
@RequiredArgsConstructor
@Tag(name = "Modalidades de vinculación", description = "Gestión del catálogo de modalidades de vinculación de prácticas")
public class ModalidadController {

    private final ModalidadService service;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR')")
    @Operation(summary = "Crear una nueva modalidad de vinculación")
    public ResponseEntity<ModalidadResponse> crear(@Valid @RequestBody ModalidadRequest request) {
        ModalidadResponse created = service.crear(request);
        return ResponseEntity.created(URI.create("/api/v1/modalidades/" + created.id())).body(created);
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Listar modalidades con filtros y paginación")
    public ResponseEntity<PageResponse<ModalidadResponse>> listar(
        @RequestParam(required = false) String q,
        @RequestParam(required = false) Boolean activo,
        @ParameterObject Pageable pageable
    ) {
        return ResponseEntity.ok(service.listar(q, activo, pageable));
    }

    @GetMapping("/activas")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Listar modalidades activas (sin paginar) para selects de UI")
    public ResponseEntity<List<ModalidadResponse>> listarActivas() {
        return ResponseEntity.ok(service.listarActivas());
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Obtener una modalidad por id")
    public ResponseEntity<ModalidadResponse> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(service.buscarPorId(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR')")
    @Operation(summary = "Actualizar una modalidad")
    public ResponseEntity<ModalidadResponse> actualizar(@PathVariable Long id,
                                                        @Valid @RequestBody ModalidadRequest request) {
        return ResponseEntity.ok(service.actualizar(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR')")
    @Operation(summary = "Eliminar una modalidad")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        service.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
