package co.uempresarial.sivu.agendamiento.web.dto;

import co.uempresarial.sivu.agendamiento.domain.Modalidad;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;

/** RF-C02: propuesta inicial de reunión por parte del estudiante. */
public record AgendamientoRequest(
    @NotNull Long convenioId,
    @NotNull Long estudianteId,
    @NotNull Long tutorId,
    @NotNull LocalDate fechaPropuesta,
    @NotNull LocalTime horaInicio,
    @NotNull LocalTime horaFin,
    @NotNull Modalidad modalidad,
    String enlace,
    String observaciones
) {}
