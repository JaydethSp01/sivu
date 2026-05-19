package co.uempresarial.sivu.hojavida.web;

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
}
