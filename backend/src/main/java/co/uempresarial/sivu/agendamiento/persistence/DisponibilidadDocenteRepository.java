package co.uempresarial.sivu.agendamiento.persistence;

import co.uempresarial.sivu.agendamiento.domain.DisponibilidadDocente;
import co.uempresarial.sivu.agendamiento.domain.EstadoDisponibilidad;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface DisponibilidadDocenteRepository extends JpaRepository<DisponibilidadDocente, Long> {

    List<DisponibilidadDocente> findByTutorIdOrderByFechaAscHoraInicioAsc(Long tutorId);

    List<DisponibilidadDocente> findByTutorIdAndFechaBetweenOrderByFechaAscHoraInicioAsc(
        Long tutorId, LocalDate desde, LocalDate hasta);

    List<DisponibilidadDocente> findByFechaBetweenOrderByFechaAscHoraInicioAsc(
        LocalDate desde, LocalDate hasta);

    /** Franjas en un estado dado del tutor en una fecha concreta (para validar solapamiento y propuestas). */
    List<DisponibilidadDocente> findByTutorIdAndFechaAndEstado(
        Long tutorId, LocalDate fecha, EstadoDisponibilidad estado);
}
