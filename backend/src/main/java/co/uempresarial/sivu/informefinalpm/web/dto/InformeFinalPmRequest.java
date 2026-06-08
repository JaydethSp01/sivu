package co.uempresarial.sivu.informefinalpm.web.dto;

public record InformeFinalPmRequest(
    String tituloInforme,
    Short nivel,
    String cargoTutorEmpresarial,
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
    Short numeroPaginas
) {}
