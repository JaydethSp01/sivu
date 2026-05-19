package co.uempresarial.sivu.cohorte.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record CohorteRequest(
    @NotBlank @Pattern(regexp = "^\\d{4}-[12]$", message = "Formato esperado YYYY-1 o YYYY-2") String semestreAcademico,
    @NotBlank @Size(max = 120) String nombre,
    LocalDate fechaApertura,
    LocalDate fechaCierre,
    String descripcion,
    Boolean activa
) {}
