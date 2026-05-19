package co.uempresarial.sivu.evaluacion.web;

import co.uempresarial.sivu.evaluacion.domain.Evaluacion;
import co.uempresarial.sivu.evaluacion.web.dto.EvaluacionResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface EvaluacionMapper {

    @Mapping(target = "convenioId", source = "convenio.id")
    @Mapping(target = "convenioNumero", source = "convenio.numeroConvenio")
    @Mapping(target = "tutorId", source = "tutor.id")
    @Mapping(target = "tutorNombre",
        expression = "java(entity.getTutor() != null ? (entity.getTutor().getNombres() + \" \""
            + " + entity.getTutor().getApellidos()) : null)")
    EvaluacionResponse toResponse(Evaluacion entity);
}
