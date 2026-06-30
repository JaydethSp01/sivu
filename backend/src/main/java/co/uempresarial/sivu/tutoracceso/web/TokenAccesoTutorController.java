package co.uempresarial.sivu.tutoracceso.web;

import co.uempresarial.sivu.tutoracceso.service.TokenAccesoTutorService;
import co.uempresarial.sivu.tutoracceso.web.dto.GenerarTokenRequest;
import co.uempresarial.sivu.tutoracceso.web.dto.TokenAccesoResponse;
import co.uempresarial.sivu.tutoracceso.web.dto.ValidacionTokenResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/tutor-acceso")
@RequiredArgsConstructor
@Tag(name = "Acceso externo del tutor",
    description = "Tokens para que el tutor empresarial diligencie su evaluación sin cuenta institucional")
public class TokenAccesoTutorController {

    private final TokenAccesoTutorService service;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR')")
    @Operation(summary = "Generar un token de acceso externo para un tutor")
    public ResponseEntity<TokenAccesoResponse> generar(@Valid @RequestBody GenerarTokenRequest request) {
        TokenAccesoResponse created = service.generarToken(
            request.tutorId(), request.convenioId(), request.proposito(), request.diasValidez());
        return ResponseEntity.ok(created);
    }

    @GetMapping("/validar")
    @Operation(summary = "Validar un token de acceso externo (público)")
    public ResponseEntity<ValidacionTokenResponse> validar(@RequestParam String token) {
        return ResponseEntity.ok(service.validarToken(token));
    }
}
