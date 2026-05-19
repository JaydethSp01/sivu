package co.uempresarial.sivu.trimestre.web.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public record EvaluacionProfesorResponse(
    Long id,
    Long trimestreId,
    BigDecimal capacidades,
    BigDecimal actitudes,
    BigDecimal aplicacionDesempeno,
    BigDecimal aplicacionElaboracionPem,
    BigDecimal aplicacionSustentacionPem,
    BigDecimal notaPonderada,
    String observaciones,
    LocalDate fechaElaboracion,
    boolean firmadoProfesor,
    boolean firmadoEstudiante,
    Long documentoPdfId,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {}
