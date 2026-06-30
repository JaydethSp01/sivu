package co.uempresarial.sivu.informefinalpm.web.dto;

import co.uempresarial.sivu.informefinalpm.domain.EstadoInformeFinalPm;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record InformeFinalPmResponse(
    Long id,
    Long planMejoraId,
    String tituloInforme,
    Short nivel,
    String cargoTutorEmpresarial,
    BigDecimal notaTutor,
    BigDecimal notaProfesor,
    BigDecimal notaPromedio,
    Boolean altoImpacto,
    /** Derivado: notaPromedio ≥ 3.0. {@code null} si aún no hay ambas notas. */
    Boolean cumpleNotaMinima,
    /** Límite institucional de páginas (informativo, GTC-FM-16). */
    Integer maxPaginas,
    String resumenEjecutivo,
    String contextualizacion,
    String planteamientoProblema,
    String marcoTeorico,
    String objetivoGeneral,
    String objetivosEspecificos,
    String diagnostico,
    String metodologia,
    String propuestaSolucion,
    String factibilidad,
    String conclusiones,
    String anexos,
    // GAP 3 / RF-A04 #1: las 12 secciones del editor estructurado
    String contextualizacionEmpresa,
    String objetivos,
    String justificacion,
    String resultados,
    String referenciasApa,
    // Fidelidad estructural GTC-FM-16 — tablas de las secciones 6 y 7
    String pestelPolitico,
    String pestelEconomico,
    String pestelSocial,
    String pestelTecnologico,
    String ventajaCompetitiva,
    String internoCapacidadDirectiva,
    String internoCapacidadTecnologica,
    String internoCapacidadTecnica,
    String internoTalentoHumano,
    String metodologiaQue,
    String metodologiaComo,
    String metodologiaCuando,
    String metodologiaDonde,
    String metodologiaConQuien,
    Short numeroPaginas,
    EstadoInformeFinalPm estado,
    OffsetDateTime fechaEntrega,
    OffsetDateTime fechaRevision,
    String revisadoPorNombre,
    String observacionesRevisor,
    Boolean firmadoEstudiante,
    Boolean firmadoTutorAcad,
    Boolean firmadoTutorEmp,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {}
