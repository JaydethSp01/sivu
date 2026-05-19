package co.uempresarial.sivu.empresa.web.dto;

import co.uempresarial.sivu.empresa.domain.EstadoEmpresa;
import jakarta.validation.constraints.*;

public record EmpresaRequest(
    @NotBlank @Size(max = 20) String nit,
    @NotBlank @Size(max = 180) String razonSocial,
    @Size(max = 180) String nombreComercial,
    @NotBlank @Size(max = 80) String sector,
    @NotBlank @Size(max = 80) String ciudad,
    @Size(max = 200) String direccion,
    @NotBlank @Email @Size(max = 180) String emailContacto,
    @Size(max = 30) String telefonoContacto,
    @NotBlank @Size(max = 160) String contactoNombre,
    @Size(max = 120) String contactoCargo,
    EstadoEmpresa estado
) {}
