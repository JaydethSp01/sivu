package co.uempresarial.sivu.security.web;

import co.uempresarial.sivu.security.service.AuthService;
import co.uempresarial.sivu.security.web.dto.AuthResponse;
import co.uempresarial.sivu.security.web.dto.LoginRequest;
import co.uempresarial.sivu.security.web.dto.RefreshRequest;
import co.uempresarial.sivu.security.web.dto.RegisterRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Autenticación", description = "Login, registro, refresh y datos del usuario actual")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    @SecurityRequirements
    @Operation(summary = "Inicia sesión y entrega tokens JWT (access + refresh)")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/register")
    @SecurityRequirements
    @Operation(summary = "Registra un nuevo usuario (público, por defecto rol ESTUDIANTE)")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/refresh")
    @SecurityRequirements
    @Operation(summary = "Renueva el access token usando el refresh token")
    public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody RefreshRequest request) {
        return ResponseEntity.ok(authService.refresh(request));
    }

    @GetMapping("/me")
    @Operation(summary = "Datos del usuario autenticado")
    public ResponseEntity<AuthResponse.UsuarioResumen> me() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return ResponseEntity.ok(authService.me(auth.getName()));
    }
}
