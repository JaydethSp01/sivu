package co.uempresarial.sivu.agendamiento.service;

import co.uempresarial.sivu.agendamiento.domain.AgendamientoReunion;
import co.uempresarial.sivu.agendamiento.domain.DisponibilidadDocente;
import co.uempresarial.sivu.agendamiento.domain.EstadoAgendamiento;
import co.uempresarial.sivu.agendamiento.domain.EstadoDisponibilidad;
import co.uempresarial.sivu.agendamiento.domain.Modalidad;
import co.uempresarial.sivu.agendamiento.persistence.AgendamientoReunionRepository;
import co.uempresarial.sivu.agendamiento.persistence.DisponibilidadDocenteRepository;
import co.uempresarial.sivu.agendamiento.web.AgendamientoMapper;
import co.uempresarial.sivu.agendamiento.web.dto.AgendamientoRequest;
import co.uempresarial.sivu.agendamiento.web.dto.AgendamientoResponse;
import co.uempresarial.sivu.agendamiento.web.dto.ContraofertaRequest;
import co.uempresarial.sivu.convenio.persistence.ConvenioRepository;
import co.uempresarial.sivu.estudiante.persistence.EstudianteRepository;
import co.uempresarial.sivu.shared.exception.BusinessException;
import co.uempresarial.sivu.shared.exception.ResourceNotFoundException;
import co.uempresarial.sivu.tutor.persistence.TutorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Set;

/**
 * RF-C02/RF-C03: flujo colaborativo de agendamiento estudiante ↔ docente.
 *
 * Transiciones:
 *   PROPUESTO  --aceptar/confirmar--> CONFIRMADO (reserva la franja como OCUPADA)
 *   PROPUESTO  --rechazar-----------> RECHAZADO
 *   PROPUESTO  --contraoferta-------> CONTRAOFERTA
 *   CONTRAOFERTA --aceptar/confirmar-> CONFIRMADO
 *   CONTRAOFERTA --rechazar---------> RECHAZADO
 *   * (no CANCELADO) --cancelar-----> CANCELADO (libera la franja)
 */
@Service
@RequiredArgsConstructor
@Transactional
public class AgendamientoReunionService {

    private static final Set<EstadoAgendamiento> CONFIRMABLES =
        Set.of(EstadoAgendamiento.PROPUESTO, EstadoAgendamiento.CONTRAOFERTA);

    private final AgendamientoReunionRepository repository;
    private final DisponibilidadDocenteRepository disponibilidadRepository;
    private final ConvenioRepository convenioRepository;
    private final EstudianteRepository estudianteRepository;
    private final TutorRepository tutorRepository;
    private final AgendamientoMapper mapper;

    /** El estudiante propone una reunión; solo válida si cae dentro de una franja ACTIVA del tutor. */
    public AgendamientoResponse proponer(AgendamientoRequest request) {
        if (!convenioRepository.existsById(request.convenioId())) {
            throw new ResourceNotFoundException("Convenio", request.convenioId());
        }
        if (!estudianteRepository.existsById(request.estudianteId())) {
            throw new ResourceNotFoundException("Estudiante", request.estudianteId());
        }
        if (!tutorRepository.existsById(request.tutorId())) {
            throw new ResourceNotFoundException("Tutor", request.tutorId());
        }
        validarRango(request.horaInicio(), request.horaFin());
        validarModalidad(request.modalidad(), request.enlace());

        DisponibilidadDocente franja = buscarFranjaQueContiene(
                request.tutorId(), request.fechaPropuesta(), request.horaInicio(), request.horaFin())
            .orElseThrow(() -> new BusinessException(
                "La fecha/hora propuesta no cae dentro de ninguna franja ACTIVA del tutor"));

        AgendamientoReunion r = AgendamientoReunion.builder()
            .convenioId(request.convenioId())
            .estudianteId(request.estudianteId())
            .tutorId(request.tutorId())
            .disponibilidadId(franja.getId())
            .fechaPropuesta(request.fechaPropuesta())
            .horaInicio(request.horaInicio())
            .horaFin(request.horaFin())
            .modalidad(request.modalidad())
            .enlace(request.enlace())
            .observaciones(request.observaciones())
            .estado(EstadoAgendamiento.PROPUESTO)
            .build();
        return mapper.toResponse(repository.save(r));
    }

    /** Aceptar una propuesta (o una contraoferta) → CONFIRMADO. */
    public AgendamientoResponse aceptar(Long id) {
        AgendamientoReunion r = obtenerEntidad(id);
        exigirEstado(r, CONFIRMABLES, "aceptar");
        confirmarInterno(r);
        return mapper.toResponse(r);
    }

    /** Confirmar la reunión → CONFIRMADO; reserva la franja y prepara el acta. */
    public AgendamientoResponse confirmar(Long id) {
        AgendamientoReunion r = obtenerEntidad(id);
        exigirEstado(r, CONFIRMABLES, "confirmar");
        confirmarInterno(r);
        // TODO: generar borrador de ActaReunion prellenado (fecha, modalidad, enlace, participantes)
        //       cuando se integre con el módulo trimestre (requiere un Trimestre asociado al convenio).
        //       Por ahora actaReunionId queda en null.
        return mapper.toResponse(r);
    }

    public AgendamientoResponse rechazar(Long id, String observaciones) {
        AgendamientoReunion r = obtenerEntidad(id);
        exigirEstado(r, CONFIRMABLES, "rechazar");
        r.setEstado(EstadoAgendamiento.RECHAZADO);
        anexarObservacion(r, "[Rechazo] ", observaciones);
        liberarFranja(r);
        return mapper.toResponse(r);
    }

    /** El docente propone una nueva fecha/hora → CONTRAOFERTA. */
    public AgendamientoResponse contraoferta(Long id, ContraofertaRequest request) {
        AgendamientoReunion r = obtenerEntidad(id);
        exigirEstado(r, Set.of(EstadoAgendamiento.PROPUESTO), "contraofertar");
        validarRango(request.horaInicio(), request.horaFin());

        Modalidad modalidad = request.modalidad() != null ? request.modalidad() : r.getModalidad();
        String enlace = request.enlace() != null ? request.enlace() : r.getEnlace();
        validarModalidad(modalidad, enlace);

        r.setFechaPropuesta(request.fechaPropuesta());
        r.setHoraInicio(request.horaInicio());
        r.setHoraFin(request.horaFin());
        r.setModalidad(modalidad);
        r.setEnlace(enlace);
        r.setEstado(EstadoAgendamiento.CONTRAOFERTA);
        anexarObservacion(r, "[Contraoferta] ", request.observaciones());
        return mapper.toResponse(r);
    }

    public AgendamientoResponse cancelar(Long id, String observaciones) {
        AgendamientoReunion r = obtenerEntidad(id);
        if (r.getEstado() == EstadoAgendamiento.CANCELADO) {
            throw new BusinessException("La reunión ya está CANCELADA");
        }
        r.setEstado(EstadoAgendamiento.CANCELADO);
        anexarObservacion(r, "[Cancelación] ", observaciones);
        liberarFranja(r);
        return mapper.toResponse(r);
    }

    @Transactional(readOnly = true)
    public AgendamientoResponse obtener(Long id) {
        return mapper.toResponse(obtenerEntidad(id));
    }

    @Transactional(readOnly = true)
    public List<AgendamientoResponse> listarPorEstudiante(Long estudianteId) {
        return repository.findByEstudianteIdOrderByFechaPropuestaDesc(estudianteId)
            .stream().map(mapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<AgendamientoResponse> listarPorTutor(Long tutorId) {
        return repository.findByTutorIdOrderByFechaPropuestaDesc(tutorId)
            .stream().map(mapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<AgendamientoResponse> listarPorConvenio(Long convenioId) {
        return repository.findByConvenioIdOrderByFechaPropuestaDesc(convenioId)
            .stream().map(mapper::toResponse).toList();
    }

    // ---------- helpers ----------

    private void confirmarInterno(AgendamientoReunion r) {
        validarModalidad(r.getModalidad(), r.getEnlace());
        r.setEstado(EstadoAgendamiento.CONFIRMADO);
        if (r.getDisponibilidadId() != null) {
            disponibilidadRepository.findById(r.getDisponibilidadId())
                .ifPresent(f -> f.setEstado(EstadoDisponibilidad.OCUPADA));
        }
    }

    /** Al rechazar/cancelar, devuelve la franja a ACTIVA si no quedó OCUPADA por otra reunión. */
    private void liberarFranja(AgendamientoReunion r) {
        if (r.getDisponibilidadId() == null) {
            return;
        }
        disponibilidadRepository.findById(r.getDisponibilidadId()).ifPresent(f -> {
            if (f.getEstado() == EstadoDisponibilidad.OCUPADA) {
                f.setEstado(EstadoDisponibilidad.ACTIVA);
            }
        });
    }

    private java.util.Optional<DisponibilidadDocente> buscarFranjaQueContiene(
            Long tutorId, LocalDate fecha, LocalTime inicio, LocalTime fin) {
        return disponibilidadRepository
            .findByTutorIdAndFechaAndEstado(tutorId, fecha, EstadoDisponibilidad.ACTIVA)
            .stream()
            .filter(f -> !inicio.isBefore(f.getHoraInicio()) && !fin.isAfter(f.getHoraFin()))
            .findFirst();
    }

    private AgendamientoReunion obtenerEntidad(Long id) {
        return repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Reunión agendada", id));
    }

    private void exigirEstado(AgendamientoReunion r, Set<EstadoAgendamiento> permitidos, String accion) {
        if (!permitidos.contains(r.getEstado())) {
            throw new BusinessException(
                "No se puede %s una reunión en estado %s".formatted(accion, r.getEstado()));
        }
    }

    private void validarRango(LocalTime inicio, LocalTime fin) {
        if (!inicio.isBefore(fin)) {
            throw new BusinessException("La hora de inicio debe ser anterior a la hora de fin");
        }
    }

    private void validarModalidad(Modalidad modalidad, String enlace) {
        if (modalidad == Modalidad.VIRTUAL && (enlace == null || enlace.isBlank())) {
            throw new BusinessException("La modalidad VIRTUAL requiere un enlace");
        }
    }

    private void anexarObservacion(AgendamientoReunion r, String prefijo, String texto) {
        if (texto == null || texto.isBlank()) {
            return;
        }
        String prev = r.getObservaciones() == null ? "" : r.getObservaciones() + "\n";
        r.setObservaciones(prev + prefijo + texto);
    }
}
