package co.uempresarial.sivu.agendamiento.service;

import co.uempresarial.sivu.agendamiento.domain.DisponibilidadDocente;
import co.uempresarial.sivu.agendamiento.domain.EstadoDisponibilidad;
import co.uempresarial.sivu.agendamiento.persistence.DisponibilidadDocenteRepository;
import co.uempresarial.sivu.agendamiento.web.AgendamientoMapper;
import co.uempresarial.sivu.agendamiento.web.dto.DisponibilidadRequest;
import co.uempresarial.sivu.agendamiento.web.dto.DisponibilidadResponse;
import co.uempresarial.sivu.shared.exception.BusinessException;
import co.uempresarial.sivu.shared.exception.ResourceNotFoundException;
import co.uempresarial.sivu.tutor.persistence.TutorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/**
 * RF-C01: gestión de franjas de disponibilidad del tutor/docente con validación
 * de no solapamiento entre franjas ACTIVAS del mismo tutor en el mismo día.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class DisponibilidadDocenteService {

    private final DisponibilidadDocenteRepository repository;
    private final TutorRepository tutorRepository;
    private final AgendamientoMapper mapper;

    public DisponibilidadResponse crear(DisponibilidadRequest request) {
        validarTutor(request.tutorId());
        validarRango(request.horaInicio(), request.horaFin());
        validarNoSolapamiento(request.tutorId(), request.fecha(),
            request.horaInicio(), request.horaFin(), null);

        DisponibilidadDocente d = DisponibilidadDocente.builder()
            .tutorId(request.tutorId())
            .fecha(request.fecha())
            .horaInicio(request.horaInicio())
            .horaFin(request.horaFin())
            .modalidad(request.modalidad())
            .estado(EstadoDisponibilidad.ACTIVA)
            .build();
        return mapper.toResponse(repository.save(d));
    }

    public DisponibilidadResponse actualizar(Long id, DisponibilidadRequest request) {
        DisponibilidadDocente d = obtenerEntidad(id);
        if (d.getEstado() == EstadoDisponibilidad.OCUPADA) {
            throw new BusinessException("No se puede modificar una franja OCUPADA por una reunión confirmada");
        }
        validarTutor(request.tutorId());
        validarRango(request.horaInicio(), request.horaFin());
        validarNoSolapamiento(request.tutorId(), request.fecha(),
            request.horaInicio(), request.horaFin(), id);

        d.setTutorId(request.tutorId());
        d.setFecha(request.fecha());
        d.setHoraInicio(request.horaInicio());
        d.setHoraFin(request.horaFin());
        d.setModalidad(request.modalidad());
        return mapper.toResponse(d);
    }

    public void eliminar(Long id) {
        DisponibilidadDocente d = obtenerEntidad(id);
        if (d.getEstado() == EstadoDisponibilidad.OCUPADA) {
            throw new BusinessException("No se puede eliminar una franja OCUPADA por una reunión confirmada");
        }
        repository.delete(d);
    }

    @Transactional(readOnly = true)
    public DisponibilidadResponse obtener(Long id) {
        return mapper.toResponse(obtenerEntidad(id));
    }

    @Transactional(readOnly = true)
    public List<DisponibilidadResponse> listar(Long tutorId, LocalDate desde, LocalDate hasta) {
        List<DisponibilidadDocente> resultado;
        if (tutorId != null && desde != null && hasta != null) {
            resultado = repository.findByTutorIdAndFechaBetweenOrderByFechaAscHoraInicioAsc(tutorId, desde, hasta);
        } else if (tutorId != null) {
            resultado = repository.findByTutorIdOrderByFechaAscHoraInicioAsc(tutorId);
        } else if (desde != null && hasta != null) {
            resultado = repository.findByFechaBetweenOrderByFechaAscHoraInicioAsc(desde, hasta);
        } else {
            resultado = repository.findAll();
        }
        return resultado.stream().map(mapper::toResponse).toList();
    }

    private DisponibilidadDocente obtenerEntidad(Long id) {
        return repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Disponibilidad", id));
    }

    private void validarTutor(Long tutorId) {
        if (!tutorRepository.existsById(tutorId)) {
            throw new ResourceNotFoundException("Tutor", tutorId);
        }
    }

    private void validarRango(LocalTime inicio, LocalTime fin) {
        if (!inicio.isBefore(fin)) {
            throw new BusinessException("La hora de inicio debe ser anterior a la hora de fin");
        }
    }

    /** No se permite crear/editar una franja que se cruce con otra ACTIVA del mismo tutor el mismo día. */
    private void validarNoSolapamiento(Long tutorId, LocalDate fecha,
                                       LocalTime inicio, LocalTime fin, Long idExcluir) {
        boolean solapa = repository
            .findByTutorIdAndFechaAndEstado(tutorId, fecha, EstadoDisponibilidad.ACTIVA)
            .stream()
            .filter(f -> idExcluir == null || !f.getId().equals(idExcluir))
            // dos rangos [a,b) y [c,d) se solapan si a < d && c < b
            .anyMatch(f -> inicio.isBefore(f.getHoraFin()) && f.getHoraInicio().isBefore(fin));
        if (solapa) {
            throw new BusinessException(
                "La franja se solapa con otra disponibilidad ACTIVA del tutor en esa fecha");
        }
    }
}
