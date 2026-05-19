package co.uempresarial.sivu.security.service;

import co.uempresarial.sivu.security.domain.Rol;
import co.uempresarial.sivu.security.domain.Usuario;
import co.uempresarial.sivu.security.persistence.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.Optional;

/**
 * Acceso al usuario autenticado dentro de los services, sin acoplarlos a Spring MVC.
 *
 * Es el punto único para auto-scope por dueño: services consultan
 * {@link #currentEmpresaId()} o {@link #currentEstudianteId()} antes de listar
 * datos, y si el usuario tiene rol acotado, se fuerza el filtro a su entidad propia.
 */
@Service
@RequiredArgsConstructor
public class CurrentUserService {

    private final UsuarioRepository usuarioRepository;

    public Optional<Usuario> current() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getName() == null
            || "anonymousUser".equals(auth.getName())) {
            return Optional.empty();
        }
        return usuarioRepository.findByEmailIgnoreCase(auth.getName());
    }

    public Optional<Long> currentEmpresaId() {
        return current().map(Usuario::getEmpresaId);
    }

    public Optional<Long> currentEstudianteId() {
        return current().map(Usuario::getEstudianteId);
    }

    public boolean hasRole(Rol rol) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return false;
        String required = "ROLE_" + rol.name();
        return auth.getAuthorities().stream()
            .anyMatch(a -> required.equals(a.getAuthority()));
    }

    /**
     * "Empresa pura": tiene rol EMPRESA y NO tiene rol privilegiado (ADMIN/COORDINADOR).
     * Para usuarios EMPRESA puros se aplica el scope por empresaId; para ADMIN/COORDINADOR
     * que también tengan rol EMPRESA, se respeta el acceso amplio.
     */
    public boolean esEmpresaPura() {
        return hasRole(Rol.EMPRESA) && !hasRole(Rol.ADMIN) && !hasRole(Rol.COORDINADOR);
    }

    /** Equivalente para estudiantes (uso futuro al hacer auto-scope para ESTUDIANTE). */
    public boolean esEstudiantePuro() {
        return hasRole(Rol.ESTUDIANTE) && !hasRole(Rol.ADMIN) && !hasRole(Rol.COORDINADOR);
    }
}
