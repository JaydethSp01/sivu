package co.uempresarial.sivu.empresa.web;

import co.uempresarial.sivu.empresa.domain.Empresa;
import co.uempresarial.sivu.empresa.web.dto.EmpresaRequest;
import co.uempresarial.sivu.empresa.web.dto.EmpresaResponse;
import org.mapstruct.*;

@Mapper(componentModel = "spring",
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface EmpresaMapper {

    EmpresaResponse toResponse(Empresa entity);

    @Mapping(target = "id", ignore = true)
    Empresa toEntity(EmpresaRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    void updateEntity(EmpresaRequest request, @MappingTarget Empresa entity);
}
