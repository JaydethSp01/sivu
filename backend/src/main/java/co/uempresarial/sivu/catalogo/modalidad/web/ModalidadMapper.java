package co.uempresarial.sivu.catalogo.modalidad.web;

import co.uempresarial.sivu.catalogo.modalidad.domain.ModalidadVinculacion;
import co.uempresarial.sivu.catalogo.modalidad.web.dto.ModalidadRequest;
import co.uempresarial.sivu.catalogo.modalidad.web.dto.ModalidadResponse;
import org.mapstruct.*;

@Mapper(componentModel = "spring",
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface ModalidadMapper {

    ModalidadResponse toResponse(ModalidadVinculacion entity);

    @Mapping(target = "id", ignore = true)
    ModalidadVinculacion toEntity(ModalidadRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    void updateEntity(ModalidadRequest request, @MappingTarget ModalidadVinculacion entity);
}
