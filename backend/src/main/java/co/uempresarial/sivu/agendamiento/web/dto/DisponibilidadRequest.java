package co.uempresarial.sivu.agendamiento.web.dto;

import co.uempresarial.sivu.agendamiento.domain.Modalidad;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;

public record DisponibilidadRequest(
    @NotNull Long tutorId,
    @NotNull LocalDate fecha,
    @NotNull LocalTime horaInicio,
    @NotNull LocalTime horaFin,
    @NotNull Modalidad modalidad
) {}
