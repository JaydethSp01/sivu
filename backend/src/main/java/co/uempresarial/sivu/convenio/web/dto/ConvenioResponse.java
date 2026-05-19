package co.uempresarial.sivu.convenio.web.dto;

import co.uempresarial.sivu.convenio.domain.EstadoConvenio;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public record ConvenioResponse(
    Long id,
    Long postulacionId,
    PostulacionResumen postulacion,
    Long estudianteId,
    EstudianteResumen estudiante,
    Long empresaId,
    EmpresaResumen empresa,
    Long vacanteId,
    VacanteResumen vacante,
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
    public record PostulacionResumen(Long id, String referencia) {}
    public record EstudianteResumen(Long id, String nombreCompleto) {}
    public record EmpresaResumen(Long id, String razonSocial) {}
    public record VacanteResumen(Long id, String titulo) {}
    public record DocumentoResumen(Long id, String nombreOriginal) {}
    public record TutorResumen(Long id, String nombreCompleto, String email) {}
}
