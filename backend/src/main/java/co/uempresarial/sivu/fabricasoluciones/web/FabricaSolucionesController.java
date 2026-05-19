package co.uempresarial.sivu.fabricasoluciones.web;

import co.uempresarial.sivu.fabricasoluciones.service.FabricaSolucionesService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/fabrica-soluciones")
@RequiredArgsConstructor
@Tag(name = "Fábrica de Soluciones",
    description = "Programa interno que vincula a estudiantes con HV aprobada que no encuentran cupo en empresas externas. Se ejecuta automáticamente cada lunes 9am, o on-demand desde Coordinación.")
public class FabricaSolucionesController {

    private final FabricaSolucionesService service;

    @PostMapping("/vincular-elegibles")
    @PreAuthorize("hasAnyRole('COORDINADOR','ADMIN')")
    @Operation(summary = "Disparar el matching de Fábrica de Soluciones ahora")
    public ResponseEntity<FabricaSolucionesService.ResultadoVinculacion> vincularAhora() {
        return ResponseEntity.ok(service.vincularElegibles());
    }
}
