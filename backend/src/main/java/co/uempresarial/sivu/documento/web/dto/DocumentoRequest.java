package co.uempresarial.sivu.documento.web.dto;

import co.uempresarial.sivu.documento.domain.TipoDocumentoSoporte;
import jakarta.validation.constraints.*;

import java.time.LocalDate;

public record DocumentoRequest(
    Long estudianteId,
    Long postulacionId,
    @NotNull TipoDocumentoSoporte tipo,
    @NotBlank @Size(max = 255) String nombreOriginal,
    @NotBlank @Size(max = 500) String rutaAlmacenamiento,
    @NotBlank @Size(max = 120) String mimeType,
    @NotNull @Min(0) Long tamanoBytes,
    LocalDate fechaVigenciaInicio,
    LocalDate fechaVigenciaFin
) {}
