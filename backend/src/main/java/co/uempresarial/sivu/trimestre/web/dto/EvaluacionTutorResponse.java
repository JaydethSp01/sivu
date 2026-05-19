package co.uempresarial.sivu.trimestre.web.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public record EvaluacionTutorResponse(
    Long id,
    Long trimestreId,
    BigDecimal capacidades,
    BigDecimal actitudes,
    BigDecimal aplicacionDesempeno,
    BigDecimal aplicacionElaboracionPem,
    BigDecimal aplicacionSustentacionPem,
    BigDecimal notaPonderada,
    Boolean continuidadConEmpresa,
    String observaciones,
    LocalDate fechaElaboracion,
    boolean firmadoTutor,
    boolean firmadoEstudiante,
    Long documentoPdfId,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {}
