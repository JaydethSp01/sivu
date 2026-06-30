package co.uempresarial.sivu.convenio.web.dto;

import co.uempresarial.sivu.convenio.domain.EstadoConvenio;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/**
 * Datos para que la Oficina de Coformación cree/edite una práctica directamente:
 * estudiante, empresa y tutores (académico/empresarial), sin vacante ni postulación.
 */
public record ConvenioRequest(
    @NotNull Long estudianteId,
    @NotNull Long empresaId,
    Long tutorAcademicoId,
    Long tutorEmpresarialId,
    @Size(max = 40) String numeroConvenio,
    @NotNull LocalDate fechaInicio,
    @NotNull LocalDate fechaFin,
    EstadoConvenio estado,
    Long documentoPdfId
) {}
