package co.uempresarial.sivu.calificacion.web;

import co.uempresarial.sivu.calificacion.service.CorteCalculoService;
import co.uempresarial.sivu.calificacion.web.dto.CalificacionDesgloseResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * BI-10 / RNF-03 — Calificación final del proceso de Coformación.
 *
 * Solo lectura: recalcula al vuelo desde las evaluaciones e informe origen y persiste el
 * consolidado. No existe endpoint de escritura manual de notas (nota no editable a mano).
 */
@RestController
@RequestMapping("/api/v1/convenios/{convenioId}/calificacion")
@RequiredArgsConstructor
@Tag(name = "Calificación de Coformación (BI-10)",
    description = "Nota final automática y trazable del proceso de Coformación: " +
        "corte1*0.25 + corte2*0.25 + corte3*0.50 (corte3 = promedio Tutor GAC-FM-9 e Informe Final GTC-FM-16).")
public class CalificacionController {

    private final CorteCalculoService service;

    @GetMapping
    @PreAuthorize("hasAnyRole('ESTUDIANTE','EMPRESA','COORDINADOR','ADMIN')")
    @Operation(summary = "Obtener el desglose calculado de la nota final del proceso (recalcula y persiste el consolidado)")
    public ResponseEntity<CalificacionDesgloseResponse> obtener(@PathVariable Long convenioId) {
        return ResponseEntity.ok(service.calcularYConsolidar(convenioId, true));
    }
}
