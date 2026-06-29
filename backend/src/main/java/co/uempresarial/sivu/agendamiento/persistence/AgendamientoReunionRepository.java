package co.uempresarial.sivu.agendamiento.persistence;

import co.uempresarial.sivu.agendamiento.domain.AgendamientoReunion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AgendamientoReunionRepository extends JpaRepository<AgendamientoReunion, Long> {

    List<AgendamientoReunion> findByEstudianteIdOrderByFechaPropuestaDesc(Long estudianteId);

    List<AgendamientoReunion> findByTutorIdOrderByFechaPropuestaDesc(Long tutorId);

    List<AgendamientoReunion> findByConvenioIdOrderByFechaPropuestaDesc(Long convenioId);
}
