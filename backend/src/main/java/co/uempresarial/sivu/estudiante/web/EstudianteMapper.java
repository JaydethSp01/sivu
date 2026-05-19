package co.uempresarial.sivu.estudiante.web;

import co.uempresarial.sivu.estudiante.domain.Estudiante;
import co.uempresarial.sivu.estudiante.web.dto.EstudianteRequest;
import co.uempresarial.sivu.estudiante.web.dto.EstudianteResponse;
import org.mapstruct.*;

@Mapper(componentModel = "spring",
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface EstudianteMapper {

    EstudianteResponse toResponse(Estudiante entity);

    @Mapping(target = "id", ignore = true)
    Estudiante toEntity(EstudianteRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    void updateEntity(EstudianteRequest request, @MappingTarget Estudiante entity);
}
