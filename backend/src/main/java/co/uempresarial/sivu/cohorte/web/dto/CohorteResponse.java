package co.uempresarial.sivu.cohorte.web.dto;

import java.time.LocalDate;
import java.time.OffsetDateTime;

public record CohorteResponse(
    Long id,
    String semestreAcademico,
    String nombre,
    LocalDate fechaApertura,
    LocalDate fechaCierre,
    String descripcion,
    Boolean activa,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {}
