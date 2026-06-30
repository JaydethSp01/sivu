package co.uempresarial.sivu.convenio.web.dto;

import co.uempresarial.sivu.convenio.domain.EstadoConvenio;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public record ConvenioResponse(
    Long id,
    Long estudianteId,
    EstudianteResumen estudiante,
    Long empresaId,
    EmpresaResumen empresa,
    String numeroConvenio,
    LocalDate fechaInicio,
    LocalDate fechaFin,
    EstadoConvenio estado,
    Long documentoPdfId,
    DocumentoResumen documentoPdf,
    Long tutorAcademicoId,
    TutorResumen tutorAcademico,
    Long tutorEmpresarialId,
    TutorResumen tutorEmpresarial,
    BigDecimal calificacionFinal,
    Long certificadoPdfId,
    DocumentoResumen certificadoPdf,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {
    public record EstudianteResumen(Long id, String nombreCompleto) {}
    public record EmpresaResumen(Long id, String razonSocial) {}
    public record DocumentoResumen(Long id, String nombreOriginal) {}
    public record TutorResumen(Long id, String nombreCompleto, String email) {}
}
