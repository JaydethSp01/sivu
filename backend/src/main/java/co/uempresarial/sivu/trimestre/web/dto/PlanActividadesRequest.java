package co.uempresarial.sivu.trimestre.web.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record PlanActividadesRequest(
    String escenarioCoformacion,
    String pemDescripcionEscenario,
    String pemObjetivoGeneral,
    @Valid List<ObjetivoRequest> objetivos,
    @Valid List<MesRequest> meses
) {
    public record ObjetivoRequest(
        String escenario,
        @NotBlank String descripcion,
        Boolean seleccionado,
        Short orden
    ) {}

    public record MesRequest(
        @NotNull @Min(1) @Max(12) Short mes,
        String areaRotacion,
        String actividades,
        String tutorNombre
    ) {}
}
