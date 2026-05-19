package co.uempresarial.sivu.catalogo.requisito.web;

import co.uempresarial.sivu.catalogo.requisito.domain.RequisitoModalidad;
import co.uempresarial.sivu.catalogo.requisito.web.dto.RequisitoModalidadResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring",
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface RequisitoModalidadMapper {

    @Mapping(target = "modalidadId", source = "modalidad.id")
    @Mapping(target = "modalidadCodigo", source = "modalidad.codigo")
    @Mapping(target = "modalidadNombre", source = "modalidad.nombre")
    @Mapping(target = "tipoRequisitoId", source = "tipoRequisito.id")
    @Mapping(target = "tipoRequisitoCodigo", source = "tipoRequisito.codigo")
    @Mapping(target = "tipoRequisitoNombre", source = "tipoRequisito.nombre")
    @Mapping(target = "aplicaA", source = "tipoRequisito.aplicaA")
    RequisitoModalidadResponse toResponse(RequisitoModalidad entity);
}
