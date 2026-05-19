package co.uempresarial.sivu.vacante.web.dto;

import co.uempresarial.sivu.vacante.domain.AreaPractica;
import co.uempresarial.sivu.vacante.domain.EstadoVacante;
import co.uempresarial.sivu.vacante.domain.Modalidad;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

public record VacanteResponse(
    Long id,
    Long empresaId,
    EmpresaResumen empresa,
    String titulo,
    String descripcion,
    AreaPractica areaPractica,
    Modalidad modalidad,
    String ciudad,
    List<String> requisitosKeywords,
    Short creditosMinimos,
    BigDecimal promedioMinimo,
    List<String> programasDirigidos,
    Short duracionMeses,
    Short cuposDisponibles,
    LocalDate fechaInicio,
    LocalDate fechaCierrePostulaciones,
    EstadoVacante estado,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {
    public record EmpresaResumen(Long id, String razonSocial) {}
}
