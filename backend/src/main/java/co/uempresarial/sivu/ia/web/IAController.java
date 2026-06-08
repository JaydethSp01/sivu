package co.uempresarial.sivu.ia.web;

import co.uempresarial.sivu.ia.service.InformeIAService;
import co.uempresarial.sivu.ia.web.dto.IADtos.FeedbackInformeResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PathVariable;

@RestController
@RequestMapping("/api/v1/ia")
@RequiredArgsConstructor
@Tag(name = "Asistencia con IA",
    description = "Integra Claude (o un revisor heurístico local) para dar feedback sobre el Informe Final del PM (§6.4 del doc Coformación).")
public class IAController {

    private final InformeIAService informeIAService;

    @PostMapping("/informe-final/{informeId}/feedback")
    @PreAuthorize("hasAnyRole('ESTUDIANTE','COORDINADOR','ADMIN')")
    @Operation(summary = "Solicitar revisión IA del Informe Final del PM. Devuelve hallazgos y recomendaciones.")
    public ResponseEntity<FeedbackInformeResponse> feedbackInforme(@PathVariable Long informeId) {
        return ResponseEntity.ok(informeIAService.revisar(informeId));
    }
}
