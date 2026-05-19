package co.uempresarial.sivu.tutor.web;

import co.uempresarial.sivu.tutor.domain.Tutor;
import co.uempresarial.sivu.tutor.web.dto.TutorRequest;
import co.uempresarial.sivu.tutor.web.dto.TutorResponse;
import org.mapstruct.*;

@Mapper(componentModel = "spring",
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface TutorMapper {

    @Mapping(target = "empresaId", source = "empresa.id")
    @Mapping(target = "empresaRazonSocial", source = "empresa.razonSocial")
    TutorResponse toResponse(Tutor entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "empresa", ignore = true)
    Tutor toEntity(TutorRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "empresa", ignore = true)
    void updateEntity(TutorRequest request, @MappingTarget Tutor entity);
}
