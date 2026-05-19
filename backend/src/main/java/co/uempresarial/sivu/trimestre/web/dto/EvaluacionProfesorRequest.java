package co.uempresarial.sivu.trimestre.web.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;

import java.math.BigDecimal;
import java.time.LocalDate;

public record EvaluacionProfesorRequest(
    @DecimalMin("0.0") @DecimalMax("5.0") BigDecimal capacidades,
    @DecimalMin("0.0") @DecimalMax("5.0") BigDecimal actitudes,
    @DecimalMin("0.0") @DecimalMax("5.0") BigDecimal aplicacionDesempeno,
    @DecimalMin("0.0") @DecimalMax("5.0") BigDecimal aplicacionElaboracionPem,
    @DecimalMin("0.0") @DecimalMax("5.0") BigDecimal aplicacionSustentacionPem,
    String observaciones,
    LocalDate fechaElaboracion
) {}
