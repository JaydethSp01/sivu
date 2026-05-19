package co.uempresarial.sivu.convenio.web.dto;

import co.uempresarial.sivu.convenio.domain.EstadoConvenio;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record ConvenioRequest(
    @NotNull Long postulacionId,
    @NotNull Long estudianteId,
    @NotNull Long empresaId,
    @NotNull Long vacanteId,
    @Size(max = 40) String numeroConvenio,
    @NotNull LocalDate fechaInicio,
    @NotNull LocalDate fechaFin,
    EstadoConvenio estado,
    Long documentoPdfId
) {}
