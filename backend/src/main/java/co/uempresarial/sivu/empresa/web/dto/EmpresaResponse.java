package co.uempresarial.sivu.empresa.web.dto;

import co.uempresarial.sivu.empresa.domain.EstadoEmpresa;

import java.time.OffsetDateTime;

public record EmpresaResponse(
    Long id,
    String nit,
    String razonSocial,
    String nombreComercial,
    String sector,
    String ciudad,
    String direccion,
    String emailContacto,
    String telefonoContacto,
    String contactoNombre,
    String contactoCargo,
    EstadoEmpresa estado,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {}
