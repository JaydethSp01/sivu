package co.uempresarial.sivu.informefinalpm.web;

import co.uempresarial.sivu.informefinalpm.domain.InformeFinalPm;
import co.uempresarial.sivu.informefinalpm.service.InformeFinalPmService;
import co.uempresarial.sivu.informefinalpm.web.dto.InformeFinalPmResponse;
import org.springframework.stereotype.Component;

@Component
public class InformeFinalPmMapper {

    public InformeFinalPmResponse toResponse(InformeFinalPm i) {
        Boolean cumpleNotaMinima = i.getNotaPromedio() == null
            ? null
            : i.getNotaPromedio().compareTo(InformeFinalPmService.NOTA_MINIMA_APROBACION) >= 0;
        return new InformeFinalPmResponse(
            i.getId(),
            i.getPlanMejora() != null ? i.getPlanMejora().getId() : null,
            i.getTituloInforme(),
            i.getNivel(),
            i.getCargoTutorEmpresarial(),
            i.getNotaTutor(),
            i.getNotaProfesor(),
            i.getNotaPromedio(),
            i.getAltoImpacto(),
            cumpleNotaMinima,
            InformeFinalPmService.PAGINAS_MAX,
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
            i.getContextualizacionEmpresa(),
            i.getObjetivos(),
            i.getJustificacion(),
            i.getResultados(),
            i.getReferenciasApa(),
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
