package co.uempresarial.sivu.agendamiento.web;

import co.uempresarial.sivu.agendamiento.domain.AgendamientoReunion;
import co.uempresarial.sivu.agendamiento.domain.DisponibilidadDocente;
import co.uempresarial.sivu.agendamiento.web.dto.AgendamientoResponse;
import co.uempresarial.sivu.agendamiento.web.dto.DisponibilidadResponse;
import org.springframework.stereotype.Component;

@Component
public class AgendamientoMapper {

    public DisponibilidadResponse toResponse(DisponibilidadDocente d) {
        return new DisponibilidadResponse(
            d.getId(),
            d.getTutorId(),
            d.getFecha(),
            d.getHoraInicio(),
            d.getHoraFin(),
            d.getModalidad(),
            d.getEstado(),
            d.getCreatedAt(),
            d.getUpdatedAt());
    }

    public AgendamientoResponse toResponse(AgendamientoReunion r) {
        return new AgendamientoResponse(
            r.getId(),
            r.getConvenioId(),
            r.getEstudianteId(),
            r.getTutorId(),
            r.getDisponibilidadId(),
            r.getFechaPropuesta(),
            r.getHoraInicio(),
            r.getHoraFin(),
            r.getModalidad(),
            r.getEnlace(),
            r.getEstado(),
            r.getObservaciones(),
            r.getActaReunionId(),
            r.getCreatedAt(),
            r.getUpdatedAt());
    }
}
