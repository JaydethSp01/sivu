package co.uempresarial.sivu.agendamiento.web;

import co.uempresarial.sivu.agendamiento.service.DisponibilidadDocenteService;
import co.uempresarial.sivu.agendamiento.web.dto.DisponibilidadRequest;
import co.uempresarial.sivu.agendamiento.web.dto.DisponibilidadResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/agendamiento/disponibilidades")
@RequiredArgsConstructor
@Tag(name = "Agendamiento - Disponibilidad docente",
    description = "RF-C01: franjas de disponibilidad del tutor/docente para agendamiento colaborativo.")
public class DisponibilidadDocenteController {

    private final DisponibilidadDocenteService service;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Listar franjas de disponibilidad (filtros: tutorId, desde, hasta)")
    public ResponseEntity<List<DisponibilidadResponse>> listar(
            @RequestParam(required = false) Long tutorId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return ResponseEntity.ok(service.listar(tutorId, desde, hasta));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Obtener una franja de disponibilidad por ID")
    public ResponseEntity<DisponibilidadResponse> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(service.obtener(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('COORDINADOR','ADMIN')")
    @Operation(summary = "Crear una franja de disponibilidad (valida no solapamiento)")
    public ResponseEntity<DisponibilidadResponse> crear(@Valid @RequestBody DisponibilidadRequest request) {
        return ResponseEntity.ok(service.crear(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('COORDINADOR','ADMIN')")
    @Operation(summary = "Actualizar una franja de disponibilidad")
    public ResponseEntity<DisponibilidadResponse> actualizar(@PathVariable Long id,
                                                             @Valid @RequestBody DisponibilidadRequest request) {
        return ResponseEntity.ok(service.actualizar(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('COORDINADOR','ADMIN')")
    @Operation(summary = "Eliminar una franja de disponibilidad")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        service.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
