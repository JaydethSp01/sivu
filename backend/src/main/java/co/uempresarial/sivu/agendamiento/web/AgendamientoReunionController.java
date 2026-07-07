package co.uempresarial.sivu.agendamiento.web;

import co.uempresarial.sivu.agendamiento.service.AgendamientoReunionService;
import co.uempresarial.sivu.agendamiento.web.dto.AgendamientoRequest;
import co.uempresarial.sivu.agendamiento.web.dto.AgendamientoResponse;
import co.uempresarial.sivu.agendamiento.web.dto.ContraofertaRequest;
import co.uempresarial.sivu.agendamiento.web.dto.ObservacionRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/agendamiento/reuniones")
@RequiredArgsConstructor
@Tag(name = "Agendamiento - Reuniones colaborativas",
    description = "RF-C02/RF-C03: flujo colaborativo de agendamiento estudiante ↔ docente.")
public class AgendamientoReunionController {

    private final AgendamientoReunionService service;

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Obtener una reunión agendada por ID hola")
    public ResponseEntity<AgendamientoResponse> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(service.obtener(id));
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Listar reuniones por estudiante, tutor o convenio (exactamente uno de los filtros)")
    public ResponseEntity<List<AgendamientoResponse>> listar(
            @RequestParam(required = false) Long estudianteId,
            @RequestParam(required = false) Long tutorId,
            @RequestParam(required = false) Long convenioId) {
        if (estudianteId != null) {
            return ResponseEntity.ok(service.listarPorEstudiante(estudianteId));
        }
        if (tutorId != null) {
            return ResponseEntity.ok(service.listarPorTutor(tutorId));
        }
        if (convenioId != null) {
            return ResponseEntity.ok(service.listarPorConvenio(convenioId));
        }
        return ResponseEntity.ok(List.of());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ESTUDIANTE','COORDINADOR','ADMIN')")
    @Operation(summary = "Proponer una reunión (debe caer dentro de una franja ACTIVA del tutor)")
    public ResponseEntity<AgendamientoResponse> proponer(@Valid @RequestBody AgendamientoRequest request) {
        return ResponseEntity.ok(service.proponer(request));
    }

    @PatchMapping("/{id}/aceptar")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Aceptar una propuesta o contraoferta → CONFIRMADO")
    public ResponseEntity<AgendamientoResponse> aceptar(@PathVariable Long id) {
        return ResponseEntity.ok(service.aceptar(id));
    }

    @PatchMapping("/{id}/confirmar")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Confirmar la reunión → CONFIRMADO; reserva la franja como OCUPADA")
    public ResponseEntity<AgendamientoResponse> confirmar(@PathVariable Long id) {
        return ResponseEntity.ok(service.confirmar(id));
    }

    @PatchMapping("/{id}/rechazar")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Rechazar una propuesta o contraoferta → RECHAZADO")
    public ResponseEntity<AgendamientoResponse> rechazar(@PathVariable Long id,
                                                        @RequestBody(required = false) ObservacionRequest request) {
        String obs = request == null ? null : request.observaciones();
        return ResponseEntity.ok(service.rechazar(id, obs));
    }

    @PatchMapping("/{id}/contraoferta")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Proponer una nueva fecha/hora → CONTRAOFERTA")
    public ResponseEntity<AgendamientoResponse> contraoferta(@PathVariable Long id,
                                                            @Valid @RequestBody ContraofertaRequest request) {
        return ResponseEntity.ok(service.contraoferta(id, request));
    }

    @PatchMapping("/{id}/cancelar")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Cancelar la reunión → CANCELADO; libera la franja asociada")
    public ResponseEntity<AgendamientoResponse> cancelar(@PathVariable Long id,
                                                       @RequestBody(required = false) ObservacionRequest request) {
        String obs = request == null ? null : request.observaciones();
        return ResponseEntity.ok(service.cancelar(id, obs));
    }
}
