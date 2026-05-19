package co.uempresarial.sivu.cartapresentacion.web;

import co.uempresarial.sivu.cartapresentacion.domain.CartaPresentacion;
import co.uempresarial.sivu.cartapresentacion.service.CartaPresentacionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/postulaciones/{postulacionId}/carta-presentacion")
@RequiredArgsConstructor
@Tag(name = "Carta de Presentación",
    description = "Carta institucional firmada por la Oficina de Coformación que presenta al estudiante ante la empresa. Se genera al aceptar la postulación.")
public class CartaPresentacionController {

    private final CartaPresentacionService service;

    @PostMapping
    @PreAuthorize("hasAnyRole('COORDINADOR','ADMIN')")
    @Operation(summary = "Generar (o regenerar) la Carta de Presentación firmada por Coordinación")
    public ResponseEntity<CartaResumen> generar(@PathVariable Long postulacionId,
                                                 @RequestBody(required = false) Map<String, String> body) {
        String extra = body == null ? null : body.get("contenidoExtra");
        CartaPresentacion carta = service.generarParaPostulacion(postulacionId, extra);
        return ResponseEntity.ok(toResumen(carta));
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Metadata de la Carta de Presentación")
    public ResponseEntity<CartaResumen> obtener(@PathVariable Long postulacionId) {
        return ResponseEntity.ok(toResumen(service.obtenerPorPostulacion(postulacionId)));
    }

    @GetMapping("/pdf")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Descargar la Carta de Presentación en PDF")
    public ResponseEntity<byte[]> descargarPdf(@PathVariable Long postulacionId) {
        byte[] pdf = service.generarPdf(postulacionId);
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_PDF)
            .header(HttpHeaders.CONTENT_DISPOSITION,
                "inline; filename=carta-presentacion-p" + postulacionId + ".pdf")
            .body(pdf);
    }

    private CartaResumen toResumen(CartaPresentacion c) {
        return new CartaResumen(c.getId(), c.getPostulacion().getId(),
            c.getFirmadaPorCoordNombre(), c.getGeneradaAt());
    }

    public record CartaResumen(Long id, Long postulacionId, String firmadaPorCoordNombre, OffsetDateTime generadaAt) {}
}
