package co.uempresarial.sivu.tutor.web.dto;

import co.uempresarial.sivu.tutor.domain.EstadoTutor;
import co.uempresarial.sivu.tutor.domain.TipoTutor;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record TutorRequest(
    @NotNull TipoTutor tipo,
    @NotBlank @Size(max = 120) String nombres,
    @NotBlank @Size(max = 120) String apellidos,
    @NotBlank @Email @Size(max = 180) String email,
    @Size(max = 30) String telefono,
    @Size(max = 120) String cargo,
    @Size(max = 160) String dependencia,
    Long empresaId,
    EstadoTutor estado
) {}
