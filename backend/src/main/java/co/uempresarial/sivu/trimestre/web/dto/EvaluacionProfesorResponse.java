package co.uempresarial.sivu.trimestre.web.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public record EvaluacionProfesorResponse(
    Long id,
    Long trimestreId,
    // Corte 1
    BigDecimal capacidades,
    BigDecimal actitudes,
    BigDecimal aplicacionDesempeno,
    BigDecimal aplicacionElaboracionPem,
    BigDecimal aplicacionSustentacionPem,
    BigDecimal notaPonderada,
    String observacionesC1,
    LocalDate fechaC1,
    // Corte 2
    BigDecimal capacidadesC2,
    BigDecimal actitudesC2,
    BigDecimal aplicacionDesempenoC2,
    BigDecimal aplicacionElaboracionPemC2,
    BigDecimal aplicacionSustentacionPemC2,
    BigDecimal notaPonderadaC2,
    String observacionesC2,
    LocalDate fechaC2,
    // Legacy combined fields
    String observaciones,
    LocalDate fechaElaboracion,
    // Estado
    boolean firmadoProfesor,
    boolean firmadoEstudiante,
    Long documentoPdfId,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {}
