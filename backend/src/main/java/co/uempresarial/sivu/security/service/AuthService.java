package co.uempresarial.sivu.security.service;

import co.uempresarial.sivu.estudiante.domain.EstadoEstudiante;
import co.uempresarial.sivu.estudiante.domain.Estudiante;
import co.uempresarial.sivu.estudiante.domain.TipoDocumento;
import co.uempresarial.sivu.estudiante.persistence.EstudianteRepository;
import co.uempresarial.sivu.security.domain.Rol;
import co.uempresarial.sivu.security.domain.Usuario;
import co.uempresarial.sivu.security.persistence.UsuarioRepository;
import co.uempresarial.sivu.security.web.dto.AuthResponse;
import co.uempresarial.sivu.security.web.dto.LoginRequest;
import co.uempresarial.sivu.security.web.dto.RefreshRequest;
import co.uempresarial.sivu.security.web.dto.RegisterRequest;
import co.uempresarial.sivu.shared.exception.BusinessException;
import co.uempresarial.sivu.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final EstudianteRepository estudianteRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthResponse login(LoginRequest request) {
        Usuario usuario = usuarioRepository.findByEmailIgnoreCase(request.email())
            .orElseThrow(() -> new BadCredentialsException("Credenciales inválidas"));

        if (!usuario.isActivo()) {
            throw new BusinessException("El usuario está inactivo. Contacte al administrador.");
        }

        if (!passwordEncoder.matches(request.password(), usuario.getPasswordHash())) {
            throw new BadCredentialsException("Credenciales inválidas");
        }

        usuario.setUltimoLogin(Instant.now());
        usuarioRepository.save(usuario);

        return tokensFor(usuario);
    }

    /**
     * Registro público: SIEMPRE crea Usuario rol ESTUDIANTE + Estudiante en BD relacional,
     * vinculados por `usuario.estudianteId`. Así el frontend puede operar postulaciones,
     * documentos y bitácoras desde el primer momento.
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (usuarioRepository.existsByEmailIgnoreCase(request.email())) {
            throw new BusinessException("Ya existe un usuario con ese email");
        }
        if (estudianteRepository.existsByEmailIgnoreCase(request.email())) {
            throw new BusinessException("Ya existe un estudiante con ese email");
        }
        if (request.numeroDocumento() != null && !request.numeroDocumento().isBlank()
            && estudianteRepository.existsByNumeroDocumento(request.numeroDocumento())) {
            throw new BusinessException("Ya existe un estudiante con ese número de documento");
        }

        // 1) Crear Estudiante con valores por defecto razonables si no vienen
        Estudiante estudiante = Estudiante.builder()
            .tipoDocumento(request.tipoDocumento() != null ? request.tipoDocumento() : TipoDocumento.CC)
            .numeroDocumento(request.numeroDocumento() != null && !request.numeroDocumento().isBlank()
                ? request.numeroDocumento()
                : "AUTO-" + System.currentTimeMillis())
            .nombres(request.nombres())
            .apellidos(request.apellidos())
            .email(request.email().toLowerCase())
            .programaAcademico(request.programaAcademico() != null && !request.programaAcademico().isBlank()
                ? request.programaAcademico() : "Por definir")
            .semestre(request.semestre() != null ? request.semestre() : (short) 1)
            .creditosAprobados((short) 0)
            .promedioAcumulado(new BigDecimal("0.00"))
            .estado(EstadoEstudiante.ACTIVO)
            .build();
        estudiante = estudianteRepository.save(estudiante);

        // 2) Crear Usuario vinculado
        Usuario usuario = Usuario.builder()
            .email(request.email().toLowerCase())
            .passwordHash(passwordEncoder.encode(request.password()))
            .nombres(request.nombres())
            .apellidos(request.apellidos())
            .roles(new HashSet<>(Set.of(Rol.ESTUDIANTE)))
            .estudianteId(estudiante.getId())
            .empresaId(null)
            .activo(true)
            .build();
        usuario = usuarioRepository.save(usuario);

        return tokensFor(usuario);
    }

    public AuthResponse refresh(RefreshRequest request) {
        String token = request.refreshToken();
        if (!"refresh".equals(jwtService.extractType(token))) {
            throw new BusinessException("El token no es de tipo refresh");
        }
        String email = jwtService.extractSubject(token);
        if (!jwtService.isTokenValid(token, email)) {
            throw new BusinessException("Refresh token inválido o expirado");
        }
        Usuario usuario = usuarioRepository.findByEmailIgnoreCase(email)
            .orElseThrow(() -> new ResourceNotFoundException("Usuario", email));
        return tokensFor(usuario);
    }

    public AuthResponse.UsuarioResumen me(String email) {
        Usuario u = usuarioRepository.findByEmailIgnoreCase(email)
            .orElseThrow(() -> new ResourceNotFoundException("Usuario", email));
        return toResumen(u);
    }

    private AuthResponse tokensFor(Usuario usuario) {
        List<String> roleNames = usuario.getRoles().stream().map(Rol::name).toList();
        String access = jwtService.generateAccessToken(usuario.getEmail(), roleNames, usuario.getId());
        String refresh = jwtService.generateRefreshToken(usuario.getEmail(), usuario.getId());
        return new AuthResponse(
            access,
            refresh,
            "Bearer",
            jwtService.getAccessExpirationSeconds(),
            toResumen(usuario));
    }

    private AuthResponse.UsuarioResumen toResumen(Usuario u) {
        return new AuthResponse.UsuarioResumen(
            u.getId(),
            u.getEmail(),
            u.getNombres(),
            u.getApellidos(),
            u.getRoles(),
            u.getEstudianteId(),
            u.getEmpresaId(),
            u.getTutorId());
    }
}
