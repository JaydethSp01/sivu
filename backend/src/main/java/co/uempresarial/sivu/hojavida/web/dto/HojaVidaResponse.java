package co.uempresarial.sivu.hojavida.web.dto;

import co.uempresarial.sivu.hojavida.domain.CategoriaHabilidad;
import co.uempresarial.sivu.hojavida.domain.EstadoHojaVida;
import co.uempresarial.sivu.hojavida.domain.NivelIdioma;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

public record HojaVidaResponse(
    Long id,
    Long estudianteId,
    String estudianteNombreCompleto,
    String estudianteEmail,
    String programaAcademico,
    Short semestre,
    String direccion,
    String telefonoContacto,
    String ciudad,
    String fotoPath,
    String perfilSaber,
    String perfilHacer,
    String perfilSer,
    boolean completa,
    EstadoHojaVida estado,
    String observacionesCoformacion,
    OffsetDateTime enviadaAt,
    OffsetDateTime aprobadaAt,
    String aprobadaPorCoordNombre,
    OffsetDateTime ultimaActualizacion,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt,
    List<HabilidadResponse>          habilidades,
    List<IdiomaResponse>             idiomas,
    List<EducacionResponse>          educacion,
    List<ExperienciaFaseResponse>    experienciaFase,
    List<ExperienciaLaboralResponse> experienciaLaboral
) {
    public record HabilidadResponse(Long id, CategoriaHabilidad categoria, String descripcion, Short orden) {}
    public record IdiomaResponse(Long id, String idioma, NivelIdioma nivel, Short orden) {}
    public record EducacionResponse(Long id, String programa, String institucion,
                                    LocalDate fechaInicio, LocalDate fechaFin, Boolean enCurso,
                                    String observaciones, Short orden) {}
    public record ExperienciaFaseResponse(Long id, String empresa, String cargo,
                                          LocalDate fechaInicio, LocalDate fechaFin, Boolean enCurso,
                                          String descripcion, Short orden) {}
    public record ExperienciaLaboralResponse(Long id, String empresa, String cargo,
                                             LocalDate fechaInicio, LocalDate fechaFin, Boolean enCurso,
                                             String descripcion, Short orden) {}
}
