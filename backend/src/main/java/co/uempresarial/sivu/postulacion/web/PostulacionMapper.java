package co.uempresarial.sivu.postulacion.web;

import co.uempresarial.sivu.postulacion.domain.Postulacion;
import co.uempresarial.sivu.postulacion.domain.PostulacionEvento;
import co.uempresarial.sivu.postulacion.web.dto.PostulacionEventoResponse;
import co.uempresarial.sivu.postulacion.web.dto.PostulacionResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface PostulacionMapper {

    @Mapping(target = "estudianteId", source = "estudiante.id")
    @Mapping(target = "estudianteNombreCompleto",
        expression = "java(entity.getEstudiante().getNombres() + \" \" + entity.getEstudiante().getApellidos())")
    @Mapping(target = "vacanteId", source = "vacante.id")
    @Mapping(target = "vacanteTitulo", source = "vacante.titulo")
    @Mapping(target = "empresaId", source = "vacante.empresa.id")
    @Mapping(target = "empresaRazonSocial", source = "vacante.empresa.razonSocial")
    PostulacionResponse toResponse(Postulacion entity);

    @Mapping(target = "postulacionId", source = "postulacion.id")
    PostulacionEventoResponse toEventoResponse(PostulacionEvento evento);
}
