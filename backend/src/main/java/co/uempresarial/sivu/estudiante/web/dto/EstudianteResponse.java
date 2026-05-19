package co.uempresarial.sivu.estudiante.web.dto;

import co.uempresarial.sivu.estudiante.domain.EstadoEstudiante;
import co.uempresarial.sivu.estudiante.domain.TipoDocumento;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record EstudianteResponse(
    Long id,
    TipoDocumento tipoDocumento,
    String numeroDocumento,
    String nombres,
    String apellidos,
    String email,
    String telefono,
    String programaAcademico,
    Short semestre,
    Short creditosAprobados,
    BigDecimal promedioAcumulado,
    EstadoEstudiante estado,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {}
