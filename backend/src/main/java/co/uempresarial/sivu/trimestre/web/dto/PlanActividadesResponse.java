package co.uempresarial.sivu.trimestre.web.dto;

import co.uempresarial.sivu.trimestre.domain.EstadoPlanActividades;

import java.time.OffsetDateTime;
import java.util.List;

public record PlanActividadesResponse(
    Long id,
    Long trimestreId,
    String escenarioCoformacion,
    String pemDescripcionEscenario,
    String pemObjetivoGeneral,
    EstadoPlanActividades estado,
    boolean firmadoEstudiante,
    boolean firmadoTutor,
    boolean firmadoProfesor,
    OffsetDateTime fechaFirmaEstudiante,
    OffsetDateTime fechaFirmaTutor,
    OffsetDateTime fechaFirmaProfesor,
    Long documentoPdfId,
    List<ObjetivoResponse> objetivos,
    List<MesResponse> meses,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {
    public record ObjetivoResponse(
        Long id, String escenario, String descripcion, boolean seleccionado, Short orden
    ) {}
    public record MesResponse(
        Long id, Short mes, String areaRotacion, String actividades, String tutorNombre
    ) {}
}
