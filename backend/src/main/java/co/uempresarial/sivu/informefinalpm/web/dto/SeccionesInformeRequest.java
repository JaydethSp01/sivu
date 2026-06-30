package co.uempresarial.sivu.informefinalpm.web.dto;

/**
 * GAP 3 / RF-A04 #1: cuerpo del editor estructurado de las 12 secciones del Informe Final
 * (GTC-FM-16). Todas las secciones son texto libre y opcionales (se guardan tal cual).
 */
public record SeccionesInformeRequest(
    String resumenEjecutivo,
    String contextualizacionEmpresa,
    String planteamientoProblema,
    String marcoTeorico,
    String objetivos,
    String diagnostico,
    String metodologia,
    String justificacion,
    String factibilidad,
    String resultados,
    String conclusiones,
    String referenciasApa,
    // Fidelidad estructural GTC-FM-16 — Sección 6.1 Diagnóstico Externo (Tabla 1 PESTEL)
    String pestelPolitico,
    String pestelEconomico,
    String pestelSocial,
    String pestelTecnologico,
    // Sección 6.1.1 Ventaja Competitiva
    String ventajaCompetitiva,
    // Sección 6.2 Diagnóstico Interno (Tabla 2)
    String internoCapacidadDirectiva,
    String internoCapacidadTecnologica,
    String internoCapacidadTecnica,
    String internoTalentoHumano,
    // Sección 7 Metodología (Tabla 3 — 5W)
    String metodologiaQue,
    String metodologiaComo,
    String metodologiaCuando,
    String metodologiaDonde,
    String metodologiaConQuien
) {}
