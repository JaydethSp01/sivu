package co.uempresarial.sivu.expediente.web.dto;

import java.math.BigDecimal;

/**
 * BI-16 / RF-B01 — Fila de listado de expedientes de una cohorte (vista de Coformación).
 *
 * <p>Resumen liviano por estudiante: estado general del proceso y nota final consolidada,
 * sin armar el expediente completo de cada uno.</p>
 */
public record ExpedienteResumenCohorte(
    Long estudianteId,
    String nombres,
    String apellidos,
    String numeroDocumento,
    String programaAcademico,
    Long convenioId,
    String numeroConvenio,
    String estadoConvenio,
    BigDecimal notaFinal,
    String estadoGeneral
) {}
