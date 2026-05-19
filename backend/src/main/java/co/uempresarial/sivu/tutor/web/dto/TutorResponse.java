package co.uempresarial.sivu.tutor.web.dto;

import co.uempresarial.sivu.tutor.domain.EstadoTutor;
import co.uempresarial.sivu.tutor.domain.TipoTutor;

import java.time.OffsetDateTime;

public record TutorResponse(
    Long id,
    TipoTutor tipo,
    String nombres,
    String apellidos,
    String email,
    String telefono,
    String cargo,
    String dependencia,
    Long empresaId,
    String empresaRazonSocial,
    EstadoTutor estado,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {}
