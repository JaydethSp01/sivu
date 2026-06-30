package co.uempresarial.sivu.expediente.web;

import co.uempresarial.sivu.expediente.service.ExpedienteService;
import co.uempresarial.sivu.expediente.web.dto.ExpedienteResponse;
import co.uempresarial.sivu.expediente.web.dto.ExpedienteResumenCohorte;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * BI-16 / RF-B01 — Expediente Digital Unificado.
 *
 * <p>Vista consolidada (solo lectura) por estudiante de todo su proceso de Coformación: convenio,
 * empresa, estado de cada documento por trimestre, notas por corte, nota final y PDFs descargables.</p>
 *
 * <p>Auto-scope: un ESTUDIANTE puro solo puede consultar su propio expediente (si pide otro → 403).
 * COORDINADOR/ADMIN/DOCENTE/TUTOR tienen acceso amplio.</p>
 */
@RestController
@RequestMapping("/api/v1/expedientes")
@RequiredArgsConstructor
@Tag(name = "Expediente Digital Unificado (BI-16)",
    description = "Consolida por estudiante documentos, estados, firmas, notas y PDFs del proceso de Coformación.")
public class ExpedienteController {

    private final ExpedienteService service;

    @GetMapping("/{estudianteId}")
    @PreAuthorize("hasAnyRole('ESTUDIANTE','COORDINADOR','ADMIN','DOCENTE','TUTOR')")
    @Operation(summary = "Obtener el expediente consolidado de un estudiante "
        + "(opcionalmente acotado a un convenio con ?convenioId=).")
    public ResponseEntity<ExpedienteResponse> obtener(
        @PathVariable Long estudianteId,
        @RequestParam(required = false) Long convenioId
    ) {
        return ResponseEntity.ok(service.obtenerPorEstudiante(estudianteId, convenioId));
    }

    @GetMapping("/convenio/{convenioId}")
    @PreAuthorize("hasAnyRole('ESTUDIANTE','COORDINADOR','ADMIN','DOCENTE','TUTOR')")
    @Operation(summary = "Obtener el expediente consolidado a partir de un convenio.")
    public ResponseEntity<ExpedienteResponse> obtenerPorConvenio(@PathVariable Long convenioId) {
        return ResponseEntity.ok(service.obtenerPorConvenio(convenioId));
    }

    @GetMapping("/cohorte/{cohorteId}")
    @PreAuthorize("hasAnyRole('COORDINADOR','ADMIN')")
    @Operation(summary = "Listar los expedientes de una cohorte (resumen: estudiante, estado general y nota final).")
    public ResponseEntity<List<ExpedienteResumenCohorte>> listarPorCohorte(@PathVariable Long cohorteId) {
        return ResponseEntity.ok(service.listarPorCohorte(cohorteId));
    }
}
