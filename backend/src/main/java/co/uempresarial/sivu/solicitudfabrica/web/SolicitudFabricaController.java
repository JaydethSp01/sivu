package co.uempresarial.sivu.solicitudfabrica.web;

import co.uempresarial.sivu.solicitudfabrica.domain.EstadoSolicitudFabrica;
import co.uempresarial.sivu.solicitudfabrica.service.SolicitudFabricaService;
import co.uempresarial.sivu.solicitudfabrica.web.dto.AsignarProyectoRequest;
import co.uempresarial.sivu.solicitudfabrica.web.dto.ResolverSolicitudRequest;
import co.uempresarial.sivu.solicitudfabrica.web.dto.SolicitudFabricaRequest;
import co.uempresarial.sivu.solicitudfabrica.web.dto.SolicitudFabricaResponse;
import co.uempresarial.sivu.solicitudfabrica.web.dto.VacanteInternaDisponibleResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/solicitudes-fabrica")
@RequiredArgsConstructor
@Tag(name = "Solicitudes al Programa Interno",
    description = "El estudiante solicita explícitamente entrar al programa interno (Fábrica de Soluciones) con una justificación. Coordinación aprueba o rechaza.")
public class SolicitudFabricaController {

    private final SolicitudFabricaService service;

    @PostMapping
    @PreAuthorize("hasRole('ESTUDIANTE')")
    @Operation(summary = "Crear nueva solicitud (el estudiante autenticado)")
    public ResponseEntity<SolicitudFabricaResponse> crear(@Valid @RequestBody SolicitudFabricaRequest request) {
        return ResponseEntity.ok(service.crearComoEstudiante(request));
    }

    @GetMapping("/mias")
    @PreAuthorize("hasRole('ESTUDIANTE')")
    @Operation(summary = "Listar mis solicitudes (las del estudiante autenticado)")
    public ResponseEntity<List<SolicitudFabricaResponse>> mias() {
        return ResponseEntity.ok(service.listarMias());
    }

    @GetMapping("/bandeja")
    @PreAuthorize("hasAnyRole('COORDINADOR','ADMIN')")
    @Operation(summary = "Bandeja de Coordinación (por defecto solicitudes PENDIENTES)")
    public ResponseEntity<List<SolicitudFabricaResponse>> bandeja(
        @RequestParam(defaultValue = "PENDIENTE") EstadoSolicitudFabrica estado) {
        return ResponseEntity.ok(service.bandeja(estado));
    }

    @PostMapping("/{id}/aprobar")
    @PreAuthorize("hasAnyRole('COORDINADOR','ADMIN')")
    @Operation(summary = "Aprobar la solicitud y notificar al estudiante")
    public ResponseEntity<SolicitudFabricaResponse> aprobar(@PathVariable Long id,
                                                            @RequestBody(required = false) ResolverSolicitudRequest body) {
        return ResponseEntity.ok(service.aprobar(id, body));
    }

    @PostMapping("/{id}/rechazar")
    @PreAuthorize("hasAnyRole('COORDINADOR','ADMIN')")
    @Operation(summary = "Rechazar la solicitud con observaciones obligatorias")
    public ResponseEntity<SolicitudFabricaResponse> rechazar(@PathVariable Long id,
                                                              @Valid @RequestBody ResolverSolicitudRequest body) {
        return ResponseEntity.ok(service.rechazar(id, body));
    }

    @GetMapping("/vacantes-internas-disponibles")
    @PreAuthorize("hasAnyRole('COORDINADOR','ADMIN')")
    @Operation(summary = "Listar vacantes internas PUBLICADAS con cupos disponibles, para el selector de asignación")
    public ResponseEntity<List<VacanteInternaDisponibleResponse>> vacantesInternasDisponibles() {
        return ResponseEntity.ok(service.listarVacantesInternasDisponibles());
    }

    @PostMapping("/{id}/asignar-proyecto")
    @PreAuthorize("hasAnyRole('COORDINADOR','ADMIN')")
    @Operation(summary = "Asignar manualmente una vacante interna a una solicitud APROBADA. Crea la postulación y pasa a ASIGNADA.")
    public ResponseEntity<SolicitudFabricaResponse> asignarProyecto(@PathVariable Long id,
                                                                     @Valid @RequestBody AsignarProyectoRequest body) {
        return ResponseEntity.ok(service.asignarProyecto(id, body.vacanteId()));
    }
}
