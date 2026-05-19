package co.uempresarial.sivu.security.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtServiceTest {

    private static final String SECRET = "test_secret_test_secret_test_secret_test_secret_test_secret_test_secret_xxxx";

    private final JwtService service = new JwtService(SECRET, 60, 7);

    @Test
    @DisplayName("Genera token y extrae subject, roles y uid correctos")
    void generaYParsea() {
        String token = service.generateAccessToken("kelly@u.edu.co", List.of("ESTUDIANTE"), "u-1");
        assertThat(service.extractSubject(token)).isEqualTo("kelly@u.edu.co");
        assertThat(service.extractRoles(token)).containsExactly("ESTUDIANTE");
        assertThat(service.extractUsuarioId(token)).isEqualTo("u-1");
        assertThat(service.extractType(token)).isEqualTo("access");
        assertThat(service.isTokenValid(token, "kelly@u.edu.co")).isTrue();
    }

    @Test
    @DisplayName("Token con subject distinto al esperado se considera inválido")
    void subjectDistintoInvalido() {
        String token = service.generateAccessToken("a@u.co", List.of("ADMIN"), "u-2");
        assertThat(service.isTokenValid(token, "b@u.co")).isFalse();
    }

    @Test
    @DisplayName("Refresh token tiene type='refresh' y dura más que access")
    void refreshToken() {
        String token = service.generateRefreshToken("a@u.co", "u-1");
        assertThat(service.extractType(token)).isEqualTo("refresh");
        assertThat(service.isExpired(token)).isFalse();
    }

    @Test
    @DisplayName("Secret demasiado corto lanza excepción al construir el servicio")
    void secretCortoFalla() {
        assertThatThrownBy(() -> new JwtService("corto", 60, 7))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("64 bytes");
    }

    @Test
    @DisplayName("Token malformado no valida y no lanza")
    void tokenMalformadoNoValida() {
        assertThat(service.isTokenValid("xxxxx.invalid.token", "a@u.co")).isFalse();
    }
}
