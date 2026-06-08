package co.uempresarial.sivu.informefinalpm.web;

import co.uempresarial.sivu.informefinalpm.domain.InformeFinalPm;
import co.uempresarial.sivu.informefinalpm.web.dto.InformeFinalPmResponse;
import org.springframework.stereotype.Component;

@Component
public class InformeFinalPmMapper {

    public InformeFinalPmResponse toResponse(InformeFinalPm i) {
        return new InformeFinalPmResponse(
            i.getId(),
            i.getPlanMejora() != null ? i.getPlanMejora().getId() : null,
            i.getTituloInforme(),
            i.getNivel(),
            i.getCargoTutorEmpresarial(),
            i.getResumenEjecutivo(),
            i.getContextualizacion(),
            i.getPlanteamientoProblema(),
            i.getMarcoTeorico(),
            i.getObjetivoGeneral(),
            i.getObjetivosEspecificos(),
            i.getDiagnostico(),
            i.getMetodologia(),
            i.getPropuestaSolucion(),
            i.getFactibilidad(),
            i.getConclusiones(),
            i.getAnexos(),
            i.getNumeroPaginas(),
            i.getEstado(),
            i.getFechaEntrega(),
            i.getFechaRevision(),
            i.getRevisadoPorNombre(),
            i.getObservacionesRevisor(),
            i.getFirmadoEstudiante(),
            i.getFirmadoTutorAcad(),
            i.getFirmadoTutorEmp(),
            i.getCreatedAt(),
            i.getUpdatedAt());
    }
}
