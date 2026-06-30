package co.uempresarial.sivu.agendamiento.web.dto;

import co.uempresarial.sivu.agendamiento.domain.EstadoAgendamiento;
import co.uempresarial.sivu.agendamiento.domain.Modalidad;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;

public record AgendamientoResponse(
    Long id,
    Long convenioId,
    Long estudianteId,
    Long tutorId,
    Long disponibilidadId,
    LocalDate fechaPropuesta,
    LocalTime horaInicio,
    LocalTime horaFin,
    Modalidad modalidad,
    String enlace,
    EstadoAgendamiento estado,
    String observaciones,
    Long actaReunionId,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {}
