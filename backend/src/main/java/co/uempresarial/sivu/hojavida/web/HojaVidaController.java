package co.uempresarial.sivu.hojavida.web;

import co.uempresarial.sivu.hojavida.domain.EstadoHojaVida;
import co.uempresarial.sivu.hojavida.pdf.HojaVidaPdfGenerator;
import co.uempresarial.sivu.hojavida.service.HojaVidaService;
import co.uempresarial.sivu.hojavida.web.dto.HojaVidaRequest;
import co.uempresarial.sivu.hojavida.web.dto.HojaVidaResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/hoja-vida")
@RequiredArgsConstructor
@Tag(name = "Hoja de Vida institucional",
    description = "El estudiante llena su HV en formulario; el sistema genera el PDF con el formato Uniempresarial. Reemplaza al documento HV subido manualmente para el checklist de requisitos.")
public class HojaVidaController {

    private final HojaVidaService service;
    private final HojaVidaPdfGenerator pdfGenerator;

    @GetMapping("/{estudianteId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Obtener la HV de un estudiante")
    public ResponseEntity<HojaVidaResponse> obtener(@PathVariable Long estudianteId) {
        return ResponseEntity.ok(service.obtener(estudianteId));
    }

    @PutMapping("/{estudianteId}")
    @PreAuthorize("hasAnyRole('ESTUDIANTE','COORDINADOR','ADMIN')")
    @Operation(summary = "Crear o actualizar la HV completa (full replace de sub-listas)")
    public ResponseEntity<HojaVidaResponse> guardar(@PathVariable Long estudianteId,
                                                    @Valid @RequestBody HojaVidaRequest request) {
        return ResponseEntity.ok(service.guardar(estudianteId, request));
    }

    @GetMapping("/{estudianteId}/pdf")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Descargar la HV como PDF con formato Uniempresarial")
    public ResponseEntity<byte[]> descargarPdf(@PathVariable Long estudianteId) {
        byte[] pdf = pdfGenerator.generar(service.obtenerEntidad(estudianteId));
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_PDF)
            .header(HttpHeaders.CONTENT_DISPOSITION,
                "inline; filename=hv-uniempresarial-" + estudianteId + ".pdf")
            .body(pdf);
    }

    // ----- Flujo Coformación (F7 #52) -----

    @PostMapping("/{estudianteId}/enviar-a-coformacion")
    @PreAuthorize("hasAnyRole('ESTUDIANTE','COORDINADOR','ADMIN')")
    @Operation(summary = "Estudiante envía su HV a la Oficina de Coformación para validación")
    public ResponseEntity<HojaVidaResponse> enviarACoformacion(@PathVariable Long estudianteId) {
        return ResponseEntity.ok(service.enviarACoformacion(estudianteId));
    }

    @PostMapping("/{hvId}/aprobar")
    @PreAuthorize("hasAnyRole('COORDINADOR','ADMIN')")
    @Operation(summary = "Coordinación aprueba la HV; habilita postulación a vacantes")
    public ResponseEntity<HojaVidaResponse> aprobar(@PathVariable Long hvId) {
        return ResponseEntity.ok(service.aprobar(hvId));
    }

    @PostMapping("/{hvId}/rechazar")
    @PreAuthorize("hasAnyRole('COORDINADOR','ADMIN')")
    @Operation(summary = "Coordinación rechaza la HV con observaciones para que el estudiante ajuste")
    public ResponseEntity<HojaVidaResponse> rechazar(@PathVariable Long hvId,
                                                     @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(service.rechazar(hvId, body.get("observaciones")));
    }

    @GetMapping("/bandeja")
    @PreAuthorize("hasAnyRole('COORDINADOR','ADMIN')")
    @Operation(summary = "Bandeja de Coordinación: HVs en un estado dado (default ENVIADA)")
    public ResponseEntity<List<HojaVidaResponse>> bandeja(@RequestParam(defaultValue = "ENVIADA") EstadoHojaVida estado) {
        return ResponseEntity.ok(service.listarPorEstado(estado));
    }
}
