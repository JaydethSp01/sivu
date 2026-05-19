package co.uempresarial.sivu.hojavida.web.dto;

import co.uempresarial.sivu.hojavida.domain.CategoriaHabilidad;
import co.uempresarial.sivu.hojavida.domain.NivelIdioma;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;

/**
 * Payload de creación/actualización completa de la Hoja de Vida. El service hace
 * "replace all" sobre las sub-listas (más simple que diff individual).
 */
public record HojaVidaRequest(
    @Size(max = 200) String direccion,
    @Size(max = 30)  String telefonoContacto,
    @Size(max = 80)  String ciudad,
    @Size(max = 500) String fotoPath,

    @Size(max = 2000) String perfilSaber,
    @Size(max = 2000) String perfilHacer,
    @Size(max = 2000) String perfilSer,

    @Valid List<HabilidadDto>           habilidades,
    @Valid List<IdiomaDto>              idiomas,
    @Valid List<EducacionDto>           educacion,
    @Valid List<ExperienciaFaseDto>     experienciaFase,
    @Valid List<ExperienciaLaboralDto>  experienciaLaboral
) {
    public record HabilidadDto(
        @NotNull CategoriaHabilidad categoria,
        @NotBlank @Size(max = 160) String descripcion,
        Short orden
    ) {}

    public record IdiomaDto(
        @NotBlank @Size(max = 40) String idioma,
        @NotNull NivelIdioma nivel,
        Short orden
    ) {}

    public record EducacionDto(
        @NotBlank @Size(max = 180) String programa,
        @NotBlank @Size(max = 180) String institucion,
        LocalDate fechaInicio,
        LocalDate fechaFin,
        Boolean enCurso,
        @Size(max = 1000) String observaciones,
        Short orden
    ) {}

    public record ExperienciaFaseDto(
        @NotBlank @Size(max = 180) String empresa,
        @Size(max = 160) String cargo,
        LocalDate fechaInicio,
        LocalDate fechaFin,
        Boolean enCurso,
        @Size(max = 2000) String descripcion,
        Short orden
    ) {}

    public record ExperienciaLaboralDto(
        @NotBlank @Size(max = 180) String empresa,
        @NotBlank @Size(max = 160) String cargo,
        LocalDate fechaInicio,
        LocalDate fechaFin,
        Boolean enCurso,
        @Size(max = 2000) String descripcion,
        Short orden
    ) {}
}
