package co.uempresarial.sivu.estudiante.web.dto;

import co.uempresarial.sivu.estudiante.domain.EstadoEstudiante;
import co.uempresarial.sivu.estudiante.domain.TipoDocumento;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public record EstudianteRequest(
    @NotNull TipoDocumento tipoDocumento,
    @NotBlank @Size(max = 30) String numeroDocumento,
    @NotBlank @Size(max = 120) String nombres,
    @NotBlank @Size(max = 120) String apellidos,
    @NotBlank @Email @Size(max = 180) String email,
    @Size(max = 30) String telefono,
    @NotBlank @Size(max = 120) String programaAcademico,
    @NotNull @Min(1) @Max(20) Short semestre,
    @NotNull @Min(0) Short creditosAprobados,
    @NotNull @DecimalMin("0.0") @DecimalMax("5.0") BigDecimal promedioAcumulado,
    EstadoEstudiante estado
) {}
