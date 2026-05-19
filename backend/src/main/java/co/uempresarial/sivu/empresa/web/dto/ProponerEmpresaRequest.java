package co.uempresarial.sivu.empresa.web.dto;

import jakarta.validation.constraints.*;

/**
 * Petición de un estudiante para proponer una empresa nueva (que aún no tiene
 * convenio con la universidad). Se crea con estado EN_REVISION; coordinación debe
 * aprobarla o rechazarla luego de validar los documentos legales de la empresa.
 */
public record ProponerEmpresaRequest(
    @NotNull Long estudianteId,
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
    @Size(max = 2000) String justificacion
) {}
