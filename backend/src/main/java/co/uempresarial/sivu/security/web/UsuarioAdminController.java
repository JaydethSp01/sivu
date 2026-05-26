package co.uempresarial.sivu.security.web;

import co.uempresarial.sivu.security.domain.Rol;
import co.uempresarial.sivu.security.domain.Usuario;
import co.uempresarial.sivu.security.persistence.UsuarioRepository;
import co.uempresarial.sivu.shared.exception.BusinessException;
import co.uempresarial.sivu.shared.exception.ResourceNotFoundException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Administración de usuarios — solo ADMIN.
 * Cubre HU-12: gestionar usuarios, roles y configuraciones desde la app.
 */
@RestController
@RequestMapping("/api/v1/admin/usuarios")
@RequiredArgsConstructor
@Tag(name = "Admin · Usuarios",
    description = "Gestión de cuentas, roles y vinculaciones (estudiante/empresa) por parte del administrador.")
public class UsuarioAdminController {

    private final UsuarioRepository repository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Listar todos los usuarios")
    public ResponseEntity<List<UsuarioResponse>> listar() {
        return ResponseEntity.ok(repository.findAll().stream().map(UsuarioResponse::from).toList());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UsuarioResponse> obtener(@PathVariable String id) {
        return ResponseEntity.ok(UsuarioResponse.from(repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Usuario", id))));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Crear un usuario nuevo")
    public ResponseEntity<UsuarioResponse> crear(@Valid @RequestBody CrearRequest req) {
        if (repository.existsByEmailIgnoreCase(req.email())) {
            throw new BusinessException("Ya existe un usuario con ese correo");
        }
        Usuario u = Usuario.builder()
            .email(req.email().toLowerCase().trim())
            .nombres(req.nombres().trim())
            .apellidos(req.apellidos().trim())
            .passwordHash(passwordEncoder.encode(req.password()))
            .roles(req.roles() == null ? new HashSet<>() : new HashSet<>(req.roles()))
            .estudianteId(req.estudianteId())
            .empresaId(req.empresaId())
            .activo(true)
            .createdAt(Instant.now())
            .updatedAt(Instant.now())
            .build();
        return ResponseEntity.ok(UsuarioResponse.from(repository.save(u)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Actualizar datos básicos, vínculos y estado")
    public ResponseEntity<UsuarioResponse> actualizar(@PathVariable String id,
                                                     @Valid @RequestBody ActualizarRequest req) {
        Usuario u = repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Usuario", id));
        u.setNombres(req.nombres().trim());
        u.setApellidos(req.apellidos().trim());
        u.setEstudianteId(req.estudianteId());
        u.setEmpresaId(req.empresaId());
        u.setActivo(req.activo() == null ? u.isActivo() : req.activo());
        u.setUpdatedAt(Instant.now());
        return ResponseEntity.ok(UsuarioResponse.from(repository.save(u)));
    }

    @PutMapping("/{id}/roles")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Reemplazar el set de roles del usuario")
    public ResponseEntity<UsuarioResponse> actualizarRoles(@PathVariable String id,
                                                           @Valid @RequestBody RolesRequest req) {
        Usuario u = repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Usuario", id));
        u.setRoles(req.roles() == null ? new HashSet<>() : new HashSet<>(req.roles()));
        u.setUpdatedAt(Instant.now());
        return ResponseEntity.ok(UsuarioResponse.from(repository.save(u)));
    }

    @PostMapping("/{id}/reset-password")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Resetear contraseña a un valor temporal")
    public ResponseEntity<UsuarioResponse> resetPassword(@PathVariable String id,
                                                         @Valid @RequestBody PasswordRequest req) {
        Usuario u = repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Usuario", id));
        u.setPasswordHash(passwordEncoder.encode(req.password()));
        u.setUpdatedAt(Instant.now());
        return ResponseEntity.ok(UsuarioResponse.from(repository.save(u)));
    }

    @PostMapping("/{id}/activar")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UsuarioResponse> activar(@PathVariable String id) {
        return setActivo(id, true);
    }

    @PostMapping("/{id}/desactivar")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UsuarioResponse> desactivar(@PathVariable String id) {
        return setActivo(id, false);
    }

    private ResponseEntity<UsuarioResponse> setActivo(String id, boolean activo) {
        Usuario u = repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Usuario", id));
        u.setActivo(activo);
        u.setUpdatedAt(Instant.now());
        return ResponseEntity.ok(UsuarioResponse.from(repository.save(u)));
    }

    // ---------- DTOs locales ----------

    public record UsuarioResponse(
        String id,
        String email,
        String nombres,
        String apellidos,
        Set<Rol> roles,
        Long estudianteId,
        Long empresaId,
        boolean activo,
        Instant ultimoLogin,
        Instant createdAt,
        Instant updatedAt
    ) {
        static UsuarioResponse from(Usuario u) {
            return new UsuarioResponse(
                u.getId(), u.getEmail(), u.getNombres(), u.getApellidos(),
                u.getRoles(), u.getEstudianteId(), u.getEmpresaId(),
                u.isActivo(), u.getUltimoLogin(), u.getCreatedAt(), u.getUpdatedAt());
        }
    }

    public record CrearRequest(
        @NotBlank @Email String email,
        @NotBlank String nombres,
        @NotBlank String apellidos,
        @NotBlank String password,
        @NotNull Set<Rol> roles,
        Long estudianteId,
        Long empresaId
    ) {}

    public record ActualizarRequest(
        @NotBlank String nombres,
        @NotBlank String apellidos,
        Long estudianteId,
        Long empresaId,
        Boolean activo
    ) {}

    public record RolesRequest(@NotNull Set<Rol> roles) {}

    public record PasswordRequest(@NotBlank String password) {}
}
