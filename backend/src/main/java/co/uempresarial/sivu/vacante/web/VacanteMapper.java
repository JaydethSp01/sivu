package co.uempresarial.sivu.vacante.web;

import co.uempresarial.sivu.empresa.domain.Empresa;
import co.uempresarial.sivu.vacante.domain.Vacante;
import co.uempresarial.sivu.vacante.web.dto.VacanteRequest;
import co.uempresarial.sivu.vacante.web.dto.VacanteResponse;
import org.mapstruct.*;

import java.util.Arrays;
import java.util.List;

@Mapper(componentModel = "spring",
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface VacanteMapper {

    @Mapping(target = "empresaId", source = "empresa.id")
    @Mapping(target = "empresa", source = "empresa", qualifiedByName = "toEmpresaResumen")
    @Mapping(target = "requisitosKeywords", source = "requisitosKeywords", qualifiedByName = "csvToList")
    @Mapping(target = "programasDirigidos", source = "programasDirigidos", qualifiedByName = "csvToList")
    VacanteResponse toResponse(Vacante entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "empresa", ignore = true)
    @Mapping(target = "requisitosKeywords", source = "requisitosKeywords", qualifiedByName = "listToCsv")
    @Mapping(target = "programasDirigidos", source = "programasDirigidos", qualifiedByName = "listToCsv")
    Vacante toEntity(VacanteRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "empresa", ignore = true)
    @Mapping(target = "requisitosKeywords", source = "requisitosKeywords", qualifiedByName = "listToCsv")
    @Mapping(target = "programasDirigidos", source = "programasDirigidos", qualifiedByName = "listToCsv")
    void updateEntity(VacanteRequest request, @MappingTarget Vacante entity);

    @Named("toEmpresaResumen")
    default VacanteResponse.EmpresaResumen toEmpresaResumen(Empresa empresa) {
        if (empresa == null) return null;
        return new VacanteResponse.EmpresaResumen(empresa.getId(), empresa.getRazonSocial());
    }

    @Named("csvToList")
    default List<String> csvToList(String csv) {
        if (csv == null || csv.isBlank()) return List.of();
        return Arrays.stream(csv.split(","))
            .map(String::trim)
            .filter(s -> !s.isEmpty())
            .toList();
    }

    @Named("listToCsv")
    default String listToCsv(List<String> values) {
        if (values == null || values.isEmpty()) return "";
        return values.stream()
            .map(String::trim)
            .filter(s -> !s.isEmpty())
            .reduce((a, b) -> a + "," + b)
            .orElse("");
    }
}
