package co.uempresarial.sivu.agendamiento.web.dto;

import co.uempresarial.sivu.agendamiento.domain.Modalidad;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;

/** RF-C03: el docente propone una nueva fecha/hora (contraoferta). */
public record ContraofertaRequest(
    @NotNull LocalDate fechaPropuesta,
    @NotNull LocalTime horaInicio,
    @NotNull LocalTime horaFin,
    Modalidad modalidad,
    String enlace,
    String observaciones
) {}
