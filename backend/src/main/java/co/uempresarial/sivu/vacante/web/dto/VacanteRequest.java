package co.uempresarial.sivu.vacante.web.dto;

import co.uempresarial.sivu.vacante.domain.AreaPractica;
import co.uempresarial.sivu.vacante.domain.EstadoVacante;
import co.uempresarial.sivu.vacante.domain.Modalidad;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record VacanteRequest(
    @NotNull Long empresaId,
    @NotBlank @Size(max = 180) String titulo,
    @NotBlank String descripcion,
    @NotNull AreaPractica areaPractica,
    @NotNull Modalidad modalidad,
    @NotBlank @Size(max = 80) String ciudad,
    List<String> requisitosKeywords,
    @NotNull @Min(0) Short creditosMinimos,
    @NotNull @DecimalMin("0.0") @DecimalMax("5.0") BigDecimal promedioMinimo,
    List<String> programasDirigidos,
    @NotNull @Min(1) Short duracionMeses,
    @NotNull @Min(0) Short cuposDisponibles,
    @NotNull LocalDate fechaInicio,
    @NotNull LocalDate fechaCierrePostulaciones,
    EstadoVacante estado
) {}
