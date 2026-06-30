package co.uempresarial.sivu.agendamiento.persistence;

import co.uempresarial.sivu.agendamiento.domain.AgendamientoReunion;
import co.uempresarial.sivu.agendamiento.domain.EstadoAgendamiento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface AgendamientoReunionRepository extends JpaRepository<AgendamientoReunion, Long> {

    List<AgendamientoReunion> findByEstudianteIdOrderByFechaPropuestaDesc(Long estudianteId);

    List<AgendamientoReunion> findByTutorIdOrderByFechaPropuestaDesc(Long tutorId);

    List<AgendamientoReunion> findByConvenioIdOrderByFechaPropuestaDesc(Long convenioId);

    /**
     * BI-11 / RF-D01: reuniones candidatas a recordatorio — en el estado dado, sin
     * recordatorio aún enviado y con fecha propuesta dentro del rango [desde, hasta].
     * El filtro fino por hora (ventana exacta de 24h) lo aplica el scheduler.
     */
    List<AgendamientoReunion> findByEstadoAndRecordatorioEnviadoFalseAndFechaPropuestaBetween(
        EstadoAgendamiento estado, LocalDate desde, LocalDate hasta);
}
