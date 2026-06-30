package co.uempresarial.sivu.security.web.dto;

import co.uempresarial.sivu.security.domain.Rol;

import java.util.Set;

public record AuthResponse(
    String accessToken,
    String refreshToken,
    String tokenType,
    long expiresIn,
    UsuarioResumen usuario
) {
    public record UsuarioResumen(
        String id,
        String email,
        String nombres,
        String apellidos,
        Set<Rol> roles,
        Long estudianteId,
        Long empresaId,
        Long tutorId
    ) {}
}
