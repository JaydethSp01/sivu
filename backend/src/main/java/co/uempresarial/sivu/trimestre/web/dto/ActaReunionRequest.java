package co.uempresarial.sivu.trimestre.web.dto;

import co.uempresarial.sivu.agendamiento.domain.Modalidad;
import co.uempresarial.sivu.trimestre.domain.TipoReunion;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

public record ActaReunionRequest(
    @NotNull Short numero,
    @NotNull LocalDate fecha,
    String hora,
    String lugar,
    String asunto,
    @NotNull TipoReunion tipoReunion,
    Modalidad modalidad,
    List<AsistenteRequest> asistentes,
    String observaciones,
    @Valid List<TemaRequest> temas
) {
    public record AsistenteRequest(
        @NotBlank String nombre,
        String rol,
        String correo
    ) {}
    public record TemaRequest(
        @NotBlank String tema,
        String observaciones,
        Short orden
    ) {}
}
