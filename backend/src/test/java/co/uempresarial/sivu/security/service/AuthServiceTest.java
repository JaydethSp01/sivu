package co.uempresarial.sivu.security.service;

import co.uempresarial.sivu.estudiante.domain.Estudiante;
import co.uempresarial.sivu.estudiante.persistence.EstudianteRepository;
import co.uempresarial.sivu.security.domain.Rol;
import co.uempresarial.sivu.security.domain.Usuario;
import co.uempresarial.sivu.security.persistence.UsuarioRepository;
import co.uempresarial.sivu.security.web.dto.LoginRequest;
import co.uempresarial.sivu.security.web.dto.RegisterRequest;
import co.uempresarial.sivu.shared.exception.BusinessException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UsuarioRepository usuarioRepository;
    @Mock private EstudianteRepository estudianteRepository;

    private final PasswordEncoder encoder = new BCryptPasswordEncoder(4);
    private JwtService jwtService;
    private AuthService authService;

    @BeforeEach
    void setup() {
        jwtService = new JwtService(
            "test_secret_test_secret_test_secret_test_secret_test_secret_test_secret_xxxx", 60, 7);
        authService = new AuthService(usuarioRepository, estudianteRepository, encoder, jwtService);
    }

    private Usuario usuarioActivo(String email) {
        return Usuario.builder()
            .id("u-1")
            .email(email)
            .passwordHash(encoder.encode("Estudiante123*"))
            .nombres("Kelly")
            .apellidos("Delgado")
            .roles(new HashSet<>(Set.of(Rol.ESTUDIANTE)))
            .activo(true)
            .build();
    }

    @Test
    @DisplayName("Login con credenciales válidas devuelve access + refresh")
    void loginOk() {
        when(usuarioRepository.findByEmailIgnoreCase("kelly@u.edu.co")).thenReturn(Optional.of(usuarioActivo("kelly@u.edu.co")));
        lenient().when(usuarioRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        var resp = authService.login(new LoginRequest("kelly@u.edu.co", "Estudiante123*"));

        assertThat(resp.accessToken()).isNotBlank();
        assertThat(resp.refreshToken()).isNotBlank();
        assertThat(resp.usuario().email()).isEqualTo("kelly@u.edu.co");
        assertThat(resp.usuario().roles()).containsExactly(Rol.ESTUDIANTE);
    }

    @Test
    @DisplayName("Login con password incorrecto lanza BadCredentials")
    void loginPasswordIncorrecto() {
        when(usuarioRepository.findByEmailIgnoreCase("a@u.co")).thenReturn(Optional.of(usuarioActivo("a@u.co")));
        assertThatThrownBy(() -> authService.login(new LoginRequest("a@u.co", "incorrecto")))
            .isInstanceOf(BadCredentialsException.class);
    }

    @Test
    @DisplayName("Login con usuario inexistente lanza BadCredentials")
    void loginUsuarioInexistente() {
        when(usuarioRepository.findByEmailIgnoreCase("noexiste@u.co")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> authService.login(new LoginRequest("noexiste@u.co", "x")))
            .isInstanceOf(BadCredentialsException.class);
    }

    @Test
    @DisplayName("Registro con email ya existente lanza BusinessException")
    void registroDuplicado() {
        when(usuarioRepository.existsByEmailIgnoreCase("a@u.co")).thenReturn(true);
        assertThatThrownBy(() -> authService.register(
            new RegisterRequest("a@u.co", "Password1*", "A", "B", null, null, null, null)))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("Ya existe");
    }

    @Test
    @DisplayName("Registro crea Estudiante automáticamente y vincula usuario.estudianteId")
    void registroCreaEstudianteYVincula() {
        when(usuarioRepository.existsByEmailIgnoreCase("nuevo@u.co")).thenReturn(false);
        when(estudianteRepository.existsByEmailIgnoreCase("nuevo@u.co")).thenReturn(false);
        when(estudianteRepository.save(any())).thenAnswer(inv -> {
            Estudiante e = inv.getArgument(0);
            e.setId(42L);
            return e;
        });
        when(usuarioRepository.save(any())).thenAnswer(inv -> {
            Usuario u = inv.getArgument(0);
            u.setId("u-new");
            return u;
        });

        var resp = authService.register(
            new RegisterRequest("nuevo@u.co", "Password1*", "Nuevo", "User",
                null, null, "Ingeniería de Sistemas", (short) 5));

        assertThat(resp.usuario().roles()).containsExactly(Rol.ESTUDIANTE);
        assertThat(resp.usuario().estudianteId()).isEqualTo(42L);
    }

    @Test
    @DisplayName("Login a usuario inactivo lanza BusinessException")
    void loginUsuarioInactivo() {
        Usuario u = usuarioActivo("inactivo@u.co");
        u.setActivo(false);
        when(usuarioRepository.findByEmailIgnoreCase("inactivo@u.co")).thenReturn(Optional.of(u));
        assertThatThrownBy(() -> authService.login(new LoginRequest("inactivo@u.co", "Estudiante123*")))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("inactivo");
    }
}
