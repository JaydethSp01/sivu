package co.uempresarial.sivu.empresa.web;

import co.uempresarial.sivu.empresa.domain.EstadoEmpresa;
import co.uempresarial.sivu.empresa.service.EmpresaService;
import co.uempresarial.sivu.empresa.web.dto.EmpresaRequest;
import co.uempresarial.sivu.empresa.web.dto.EmpresaResponse;
import co.uempresarial.sivu.empresa.web.dto.ProponerEmpresaRequest;
import co.uempresarial.sivu.empresa.web.dto.RechazarEmpresaRequest;
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
@RequestMapping("/api/v1/empresas")
@RequiredArgsConstructor
@Tag(name = "Empresas", description = "Gestión del CRUD de empresas aliadas")
public class EmpresaController {

    private final EmpresaService service;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR')")
    @Operation(summary = "Crear una nueva empresa")
    public ResponseEntity<EmpresaResponse> crear(@Valid @RequestBody EmpresaRequest request) {
        EmpresaResponse created = service.crear(request);
        return ResponseEntity.created(URI.create("/api/v1/empresas/" + created.id())).body(created);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR','EMPRESA')")
    @Operation(summary = "Listar empresas con filtros y paginación")
    public ResponseEntity<PageResponse<EmpresaResponse>> listar(
        @RequestParam(required = false) String q,
        @RequestParam(required = false) EstadoEmpresa estado,
        @ParameterObject Pageable pageable
    ) {
        return ResponseEntity.ok(service.listar(q, estado, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR','EMPRESA')")
    @Operation(summary = "Obtener una empresa por id")
    public ResponseEntity<EmpresaResponse> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(service.buscarPorId(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR','EMPRESA')")
    @Operation(summary = "Actualizar una empresa")
    public ResponseEntity<EmpresaResponse> actualizar(@PathVariable Long id,
                                                      @Valid @RequestBody EmpresaRequest request) {
        return ResponseEntity.ok(service.actualizar(id, request));
    }

    @PostMapping("/propuesta")
    @PreAuthorize("hasAnyRole('ESTUDIANTE','COORDINADOR','ADMIN')")
    @Operation(summary = "Proponer una empresa nueva (queda en EN_REVISION para validación por coordinación)")
    public ResponseEntity<EmpresaResponse> proponer(@Valid @RequestBody ProponerEmpresaRequest request) {
        EmpresaResponse created = service.proponer(request);
        return ResponseEntity.created(URI.create("/api/v1/empresas/" + created.id())).body(created);
    }

    @PatchMapping("/{id}/aprobar")
    @PreAuthorize("hasAnyRole('COORDINADOR','ADMIN')")
    @Operation(summary = "Aprobar una empresa en revisión (pasa a ACTIVA)")
    public ResponseEntity<EmpresaResponse> aprobar(@PathVariable Long id) {
        return ResponseEntity.ok(service.aprobar(id));
    }

    @PatchMapping("/{id}/rechazar")
    @PreAuthorize("hasAnyRole('COORDINADOR','ADMIN')")
    @Operation(summary = "Rechazar una empresa con motivo (pasa a INACTIVA)")
    public ResponseEntity<EmpresaResponse> rechazar(@PathVariable Long id,
                                                    @Valid @RequestBody RechazarEmpresaRequest request) {
        return ResponseEntity.ok(service.rechazar(id, request.motivo()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Eliminar una empresa")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        service.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
