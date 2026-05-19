package co.uempresarial.sivu.convenio.web;

import co.uempresarial.sivu.convenio.domain.Convenio;
import co.uempresarial.sivu.convenio.web.dto.ConvenioRequest;
import co.uempresarial.sivu.convenio.web.dto.ConvenioResponse;
import co.uempresarial.sivu.documento.domain.Documento;
import co.uempresarial.sivu.empresa.domain.Empresa;
import co.uempresarial.sivu.estudiante.domain.Estudiante;
import co.uempresarial.sivu.postulacion.domain.Postulacion;
import co.uempresarial.sivu.tutor.domain.Tutor;
import co.uempresarial.sivu.vacante.domain.Vacante;
import org.mapstruct.*;

@Mapper(componentModel = "spring",
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface ConvenioMapper {

    @Mapping(target = "postulacionId", source = "postulacion.id")
    @Mapping(target = "postulacion", source = "postulacion", qualifiedByName = "toPostulacionResumen")
    @Mapping(target = "estudianteId", source = "estudiante.id")
    @Mapping(target = "estudiante", source = "estudiante", qualifiedByName = "toEstudianteResumen")
    @Mapping(target = "empresaId", source = "empresa.id")
    @Mapping(target = "empresa", source = "empresa", qualifiedByName = "toEmpresaResumen")
    @Mapping(target = "vacanteId", source = "vacante.id")
    @Mapping(target = "vacante", source = "vacante", qualifiedByName = "toVacanteResumen")
    @Mapping(target = "documentoPdfId", source = "documentoPdf.id")
    @Mapping(target = "documentoPdf", source = "documentoPdf", qualifiedByName = "toDocumentoResumen")
    @Mapping(target = "tutorAcademicoId", source = "tutorAcademico.id")
    @Mapping(target = "tutorAcademico", source = "tutorAcademico", qualifiedByName = "toTutorResumen")
    @Mapping(target = "tutorEmpresarialId", source = "tutorEmpresarial.id")
    @Mapping(target = "tutorEmpresarial", source = "tutorEmpresarial", qualifiedByName = "toTutorResumen")
    @Mapping(target = "certificadoPdfId", source = "certificadoPdf.id")
    @Mapping(target = "certificadoPdf", source = "certificadoPdf", qualifiedByName = "toDocumentoResumen")
    ConvenioResponse toResponse(Convenio entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "postulacion", ignore = true)
    @Mapping(target = "estudiante", ignore = true)
    @Mapping(target = "empresa", ignore = true)
    @Mapping(target = "vacante", ignore = true)
    @Mapping(target = "documentoPdf", ignore = true)
    @Mapping(target = "numeroConvenio", ignore = true)
    @Mapping(target = "tutorAcademico", ignore = true)
    @Mapping(target = "tutorEmpresarial", ignore = true)
    @Mapping(target = "certificadoPdf", ignore = true)
    @Mapping(target = "calificacionFinal", ignore = true)
    Convenio toEntity(ConvenioRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "postulacion", ignore = true)
    @Mapping(target = "estudiante", ignore = true)
    @Mapping(target = "empresa", ignore = true)
    @Mapping(target = "vacante", ignore = true)
    @Mapping(target = "documentoPdf", ignore = true)
    @Mapping(target = "numeroConvenio", ignore = true)
    @Mapping(target = "tutorAcademico", ignore = true)
    @Mapping(target = "tutorEmpresarial", ignore = true)
    @Mapping(target = "certificadoPdf", ignore = true)
    @Mapping(target = "calificacionFinal", ignore = true)
    void updateEntity(ConvenioRequest request, @MappingTarget Convenio entity);

    @Named("toPostulacionResumen")
    default ConvenioResponse.PostulacionResumen toPostulacionResumen(Postulacion postulacion) {
        if (postulacion == null) return null;
        return new ConvenioResponse.PostulacionResumen(postulacion.getId(),
            "Postulación #" + postulacion.getId());
    }

    @Named("toEstudianteResumen")
    default ConvenioResponse.EstudianteResumen toEstudianteResumen(Estudiante estudiante) {
        if (estudiante == null) return null;
        String nombreCompleto = (estudiante.getNombres() + " " + estudiante.getApellidos()).trim();
        return new ConvenioResponse.EstudianteResumen(estudiante.getId(), nombreCompleto);
    }

    @Named("toEmpresaResumen")
    default ConvenioResponse.EmpresaResumen toEmpresaResumen(Empresa empresa) {
        if (empresa == null) return null;
        return new ConvenioResponse.EmpresaResumen(empresa.getId(), empresa.getRazonSocial());
    }

    @Named("toVacanteResumen")
    default ConvenioResponse.VacanteResumen toVacanteResumen(Vacante vacante) {
        if (vacante == null) return null;
        return new ConvenioResponse.VacanteResumen(vacante.getId(), vacante.getTitulo());
    }

    @Named("toDocumentoResumen")
    default ConvenioResponse.DocumentoResumen toDocumentoResumen(Documento documento) {
        if (documento == null) return null;
        return new ConvenioResponse.DocumentoResumen(documento.getId(), documento.getNombreOriginal());
    }

    @Named("toTutorResumen")
    default ConvenioResponse.TutorResumen toTutorResumen(Tutor tutor) {
        if (tutor == null) return null;
        return new ConvenioResponse.TutorResumen(
            tutor.getId(),
            (tutor.getNombres() + " " + tutor.getApellidos()).trim(),
            tutor.getEmail());
    }
}
