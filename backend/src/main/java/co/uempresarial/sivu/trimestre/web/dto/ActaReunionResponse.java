package co.uempresarial.sivu.trimestre.web.dto;

import co.uempresarial.sivu.agendamiento.domain.Modalidad;
import co.uempresarial.sivu.trimestre.domain.TipoReunion;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

public record ActaReunionResponse(
    Long id,
    Long trimestreId,
    Short numero,
    LocalDate fecha,
    String hora,
    String lugar,
    String asunto,
    TipoReunion tipoReunion,
    Modalidad modalidad,
    List<Asistente> asistentes,
    String observaciones,
    boolean firmadoEstudiante,
    boolean firmadoTutor,
    boolean firmadoProfesor,
    Long documentoPdfId,
    List<Tema> temas,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {
    public record Asistente(String nombre, String rol, String correo) {}
    public record Tema(Long id, String tema, String observaciones, Short orden) {}
}
