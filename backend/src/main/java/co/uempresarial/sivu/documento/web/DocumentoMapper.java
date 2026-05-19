package co.uempresarial.sivu.documento.web;

import co.uempresarial.sivu.catalogo.requisito.domain.TipoRequisitoDocumental;
import co.uempresarial.sivu.documento.domain.Documento;
import co.uempresarial.sivu.documento.web.dto.DocumentoRequest;
import co.uempresarial.sivu.documento.web.dto.DocumentoResponse;
import co.uempresarial.sivu.empresa.domain.Empresa;
import co.uempresarial.sivu.estudiante.domain.Estudiante;
import co.uempresarial.sivu.postulacion.domain.Postulacion;
import org.mapstruct.*;

@Mapper(componentModel = "spring",
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface DocumentoMapper {

    @Mapping(target = "estudianteId", source = "estudiante.id")
    @Mapping(target = "estudiante", source = "estudiante", qualifiedByName = "toEstudianteResumen")
    @Mapping(target = "postulacionId", source = "postulacion.id")
    @Mapping(target = "postulacion", source = "postulacion", qualifiedByName = "toPostulacionResumen")
    @Mapping(target = "empresaId", source = "empresa.id")
    @Mapping(target = "empresa", source = "empresa", qualifiedByName = "toEmpresaResumen")
    @Mapping(target = "tipoRequisitoId", source = "tipoRequisito.id")
    @Mapping(target = "tipoRequisito", source = "tipoRequisito", qualifiedByName = "toTipoRequisitoResumen")
    DocumentoResponse toResponse(Documento entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "estudiante", ignore = true)
    @Mapping(target = "postulacion", ignore = true)
    @Mapping(target = "empresa", ignore = true)
    @Mapping(target = "tipoRequisito", ignore = true)
    @Mapping(target = "estado", ignore = true)
    @Mapping(target = "observacionesValidacion", ignore = true)
    @Mapping(target = "fechaValidacion", ignore = true)
    Documento toEntity(DocumentoRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "estudiante", ignore = true)
    @Mapping(target = "postulacion", ignore = true)
    @Mapping(target = "empresa", ignore = true)
    @Mapping(target = "tipoRequisito", ignore = true)
    @Mapping(target = "estado", ignore = true)
    @Mapping(target = "observacionesValidacion", ignore = true)
    @Mapping(target = "fechaValidacion", ignore = true)
    void updateEntity(DocumentoRequest request, @MappingTarget Documento entity);

    @Named("toEstudianteResumen")
    default DocumentoResponse.EstudianteResumen toEstudianteResumen(Estudiante estudiante) {
        if (estudiante == null) return null;
        String nombreCompleto = (estudiante.getNombres() + " " + estudiante.getApellidos()).trim();
        return new DocumentoResponse.EstudianteResumen(estudiante.getId(), nombreCompleto);
    }

    @Named("toPostulacionResumen")
    default DocumentoResponse.PostulacionResumen toPostulacionResumen(Postulacion postulacion) {
        if (postulacion == null) return null;
        return new DocumentoResponse.PostulacionResumen(postulacion.getId(),
            "Postulación #" + postulacion.getId());
    }

    @Named("toEmpresaResumen")
    default DocumentoResponse.EmpresaResumen toEmpresaResumen(Empresa empresa) {
        if (empresa == null) return null;
        return new DocumentoResponse.EmpresaResumen(empresa.getId(), empresa.getRazonSocial());
    }

    @Named("toTipoRequisitoResumen")
    default DocumentoResponse.TipoRequisitoResumen toTipoRequisitoResumen(TipoRequisitoDocumental t) {
        if (t == null) return null;
        return new DocumentoResponse.TipoRequisitoResumen(t.getId(), t.getCodigo(), t.getNombre(), t.getAplicaA());
    }
}
