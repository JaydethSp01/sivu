package co.uempresarial.sivu.postulacion.web;

import co.uempresarial.sivu.postulacion.domain.EstadoPostulacion;
import co.uempresarial.sivu.postulacion.service.PostulacionService;
import co.uempresarial.sivu.postulacion.web.dto.CambioEstadoRequest;
import co.uempresarial.sivu.postulacion.web.dto.PostulacionEventoResponse;
import co.uempresarial.sivu.postulacion.web.dto.PostulacionRequest;
import co.uempresarial.sivu.postulacion.web.dto.PostulacionResponse;
import co.uempresarial.sivu.shared.pagination.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/v1/postulaciones")
@RequiredArgsConstructor
@Tag(name = "Postulaciones", description = "Gestión de postulaciones de estudiantes a vacantes con cálculo automático de matching y cambios de estado trazables")
public class PostulacionController {

    private final PostulacionService service;

    @PostMapping
    @PreAuthorize("hasAnyRole('ESTUDIANTE','COORDINADOR','ADMIN')")
    @Operation(summary = "Crear una postulación (calcula score de matching automáticamente)")
    public ResponseEntity<PostulacionResponse> crear(@Valid @RequestBody PostulacionRequest request) {
        PostulacionResponse created = service.crear(request);
        return ResponseEntity.created(URI.create("/api/v1/postulaciones/" + created.id())).body(created);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR','EMPRESA','ESTUDIANTE','MCP_AGENT')")
    @Operation(summary = "Listar postulaciones con filtros")
    public ResponseEntity<PageResponse<PostulacionResponse>> listar(
        @RequestParam(required = false) EstadoPostulacion estado,
        @RequestParam(required = false) Long estudianteId,
        @RequestParam(required = false) Long vacanteId,
        @ParameterObject Pageable pageable) {
        return ResponseEntity.ok(service.listar(estado, estudianteId, vacanteId, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Obtener una postulación por id")
    public ResponseEntity<PostulacionResponse> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(service.buscarPorId(id));
    }

    @GetMapping("/{id}/historial")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Línea de tiempo (eventos) de la postulación — 'tipo seguimiento de pedido'")
    public ResponseEntity<List<PostulacionEventoResponse>> historial(@PathVariable Long id) {
        return ResponseEntity.ok(service.historial(id));
    }

    @PatchMapping("/{id}/estado")
    @PreAuthorize("hasAnyRole('COORDINADOR','EMPRESA','ADMIN')")
    @Operation(summary = "Cambiar el estado de la postulación (registra evento y notifica al estudiante)")
    public ResponseEntity<PostulacionResponse> cambiarEstado(
        @PathVariable Long id,
        @Valid @RequestBody CambioEstadoRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String actor = auth != null ? auth.getName() : "sistema";
        return ResponseEntity.ok(service.cambiarEstado(id, request, actor));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR')")
    @Operation(summary = "Eliminar una postulación")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        service.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
