package co.uempresarial.sivu.catalogo.requisito.web.dto;

import co.uempresarial.sivu.catalogo.requisito.domain.AplicaA;

public record RequisitoModalidadResponse(
    Long id,
    Long modalidadId,
    String modalidadCodigo,
    String modalidadNombre,
    Long tipoRequisitoId,
    String tipoRequisitoCodigo,
    String tipoRequisitoNombre,
    AplicaA aplicaA,
    Boolean obligatorio,
    Short orden,
    String instrucciones
) {}
