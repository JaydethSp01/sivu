package co.uempresarial.sivu.admin;

import co.uempresarial.sivu.automatizacion.service.RecordatorioCvService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
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

    @PostMapping("/seed")
    @SecurityRequirements
    @Operation(summary = "Cargar datos demo (usuarios, estudiantes, empresas, vacantes). Solo crea si no hay datos.")
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
}
