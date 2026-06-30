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
    String referenciasApa
) {}
