package co.uempresarial.sivu.analytics.web;

import co.uempresarial.sivu.analytics.service.AnalyticsService;
import co.uempresarial.sivu.analytics.web.dto.AnalyticsDtos.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
@Tag(name = "Analytics institucional",
    description = "Métricas agregadas para Coformación: empleabilidad, embudo de postulaciones, estudiantes en riesgo (§6.1 y §6.5 del doc).")
@PreAuthorize("hasAnyRole('ADMIN','COORDINADOR')")
public class AnalyticsController {

    private final AnalyticsService service;

    @GetMapping("/resumen")
    @Operation(summary = "KPIs globales del proceso de Coformación")
    public ResponseEntity<Resumen> resumen() {
        return ResponseEntity.ok(service.resumen());
    }

    @GetMapping("/embudo-postulaciones")
    @Operation(summary = "Conteo de postulaciones por estado (embudo)")
    public ResponseEntity<EmbudoPostulaciones> embudo() {
        return ResponseEntity.ok(service.embudoPostulaciones());
    }

    @GetMapping("/empleabilidad")
    @Operation(summary = "Tasa de continuidad por empresa (top 10) + agregado global")
    public ResponseEntity<EmpleabilidadResumen> empleabilidad() {
        return ResponseEntity.ok(service.empleabilidad());
    }

    @GetMapping("/estudiantes-en-riesgo")
    @Operation(summary = "Estudiantes ACTIVOS sin HV aprobada o sin postulación activa, con cohorte ya iniciada")
    public ResponseEntity<List<EstudianteEnRiesgo>> estudiantesEnRiesgo() {
        return ResponseEntity.ok(service.estudiantesEnRiesgo());
    }
}
