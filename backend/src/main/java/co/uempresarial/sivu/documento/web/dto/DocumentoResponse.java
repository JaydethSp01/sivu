package co.uempresarial.sivu.documento.web.dto;

import co.uempresarial.sivu.catalogo.requisito.domain.AplicaA;
import co.uempresarial.sivu.documento.domain.EstadoDocumento;
import co.uempresarial.sivu.documento.domain.TipoDocumentoSoporte;

import java.time.OffsetDateTime;

public record DocumentoResponse(
    Long id,
    Long estudianteId,
    EstudianteResumen estudiante,
    Long postulacionId,
    PostulacionResumen postulacion,
    Long empresaId,
    EmpresaResumen empresa,
    TipoDocumentoSoporte tipo,
    Long tipoRequisitoId,
    TipoRequisitoResumen tipoRequisito,
    String nombreOriginal,
    String rutaAlmacenamiento,
    String mimeType,
    Long tamanoBytes,
    EstadoDocumento estado,
    String observacionesValidacion,
    OffsetDateTime fechaValidacion,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {
    public record EstudianteResumen(Long id, String nombreCompleto) {}
    public record PostulacionResumen(Long id, String referencia) {}
    public record EmpresaResumen(Long id, String razonSocial) {}
    public record TipoRequisitoResumen(Long id, String codigo, String nombre, AplicaA aplicaA) {}
}
