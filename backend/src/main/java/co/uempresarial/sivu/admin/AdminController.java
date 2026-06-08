package co.uempresarial.sivu.admin;

import co.uempresarial.sivu.automatizacion.service.AlertaPlazosService;
import co.uempresarial.sivu.automatizacion.service.RecordatorioCvService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@Tag(name = "Admin", description = "Operaciones administrativas: seed de datos demo + disparo manual de jobs")
public class AdminController {

    private final SeedService seedService;
    private final RecordatorioCvService recordatorioCvService;
    private final AlertaPlazosService alertaPlazosService;

    @PostMapping("/seed")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Cargar datos demo (usuarios, estudiantes, empresas, vacantes). Solo crea si no hay datos. " +
        "En perfiles dev/docker el seed se ejecuta automáticamente al arrancar; este endpoint es para re-invocar manualmente.")
    public ResponseEntity<Map<String, Object>> seed() {
        return ResponseEntity.ok(seedService.seed());
    }

    @PostMapping("/recordatorios/cv")
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR')")
    @Operation(summary = "Forzar manualmente el job de recordatorios 'actualiza tu CV' (devuelve cuántos estudiantes fueron revisados y notificados)")
    public ResponseEntity<Map<String, Object>> dispararRecordatoriosCv() {
        var r = recordatorioCvService.enviarRecordatoriosPendientes();
        return ResponseEntity.ok(Map.of(
            "revisados", r.revisados(),
            "notificados", r.notificados()));
    }

    @PostMapping("/alertas/plazos")
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR')")
    @Operation(summary = "Forzar el envío de alertas a estudiantes con formularios próximos a vencer (§6.2)")
    public ResponseEntity<Map<String, Object>> dispararAlertasPlazos() {
        var r = alertaPlazosService.enviarAlertasPendientes();
        return ResponseEntity.ok(Map.of(
            "revisados", r.revisados(),
            "notificados", r.notificados(),
            "sinEmail", r.sinEmail()));
    }
}
