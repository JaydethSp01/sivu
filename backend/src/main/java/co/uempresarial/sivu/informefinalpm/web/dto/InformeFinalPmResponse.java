package co.uempresarial.sivu.informefinalpm.web.dto;

import co.uempresarial.sivu.informefinalpm.domain.EstadoInformeFinalPm;

import java.time.OffsetDateTime;

public record InformeFinalPmResponse(
    Long id,
    Long planMejoraId,
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
