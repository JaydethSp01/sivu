package co.uempresarial.sivu.catalogo.requisito.web;

import co.uempresarial.sivu.catalogo.requisito.domain.TipoRequisitoDocumental;
import co.uempresarial.sivu.catalogo.requisito.web.dto.TipoRequisitoRequest;
import co.uempresarial.sivu.catalogo.requisito.web.dto.TipoRequisitoResponse;
import org.mapstruct.*;

@Mapper(componentModel = "spring",
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface TipoRequisitoMapper {

    TipoRequisitoResponse toResponse(TipoRequisitoDocumental entity);

    @Mapping(target = "id", ignore = true)
    TipoRequisitoDocumental toEntity(TipoRequisitoRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    void updateEntity(TipoRequisitoRequest request, @MappingTarget TipoRequisitoDocumental entity);
}
