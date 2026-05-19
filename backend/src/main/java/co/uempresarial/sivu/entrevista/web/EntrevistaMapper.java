package co.uempresarial.sivu.entrevista.web;

import co.uempresarial.sivu.entrevista.domain.Entrevista;
import co.uempresarial.sivu.entrevista.web.dto.EntrevistaResponse;
import co.uempresarial.sivu.estudiante.domain.Estudiante;
import co.uempresarial.sivu.postulacion.domain.Postulacion;
import org.springframework.stereotype.Component;

@Component
public class EntrevistaMapper {

    public EntrevistaResponse toResponse(Entrevista e) {
        Postulacion p = e.getPostulacion();
        Estudiante est = p != null ? p.getEstudiante() : null;
        String nombre = est == null ? null : (est.getNombres() + " " + est.getApellidos()).trim();
        String empresa = (p == null || p.getVacante() == null || p.getVacante().getEmpresa() == null)
            ? null : p.getVacante().getEmpresa().getRazonSocial();
        String cargo = (p == null || p.getVacante() == null) ? null : p.getVacante().getTitulo();
        return new EntrevistaResponse(
            e.getId(),
            p == null ? null : p.getId(),
            nombre,
            empresa,
            cargo,
            e.getFechaProgramada(),
            e.getModalidad(),
            e.getLugar(),
            e.getEnlaceVirtual(),
            e.getEntrevistadorNombre(),
            e.getEntrevistadorCargo(),
            e.getObservaciones(),
            e.getResultado(),
            e.getFechaResultado(),
            e.getCreatedAt(),
            e.getUpdatedAt());
    }
}
