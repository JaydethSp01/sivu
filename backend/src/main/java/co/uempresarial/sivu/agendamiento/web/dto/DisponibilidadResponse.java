package co.uempresarial.sivu.agendamiento.web.dto;

import co.uempresarial.sivu.agendamiento.domain.EstadoDisponibilidad;
import co.uempresarial.sivu.agendamiento.domain.Modalidad;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;

public record DisponibilidadResponse(
    Long id,
    Long tutorId,
    LocalDate fecha,
    LocalTime horaInicio,
    LocalTime horaFin,
    Modalidad modalidad,
    EstadoDisponibilidad estado,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {}
