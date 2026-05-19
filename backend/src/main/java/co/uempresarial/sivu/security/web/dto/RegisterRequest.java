package co.uempresarial.sivu.security.web.dto;

import co.uempresarial.sivu.estudiante.domain.TipoDocumento;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Registro público de un estudiante. El endpoint /auth/register SIEMPRE crea:
 *   - Un Usuario en MongoDB con rol ESTUDIANTE.
 *   - Una entidad Estudiante en PostgreSQL.
 * Los IDs y roles privilegiados los asigna un ADMIN por otra vía.
 */
public record RegisterRequest(
    @NotBlank @Email String email,
    @NotBlank @Size(min = 8, message = "La contraseña debe tener al menos 8 caracteres") String password,
    @NotBlank String nombres,
    @NotBlank String apellidos,
    TipoDocumento tipoDocumento,
    String numeroDocumento,
    String programaAcademico,
    Short semestre
) {}
