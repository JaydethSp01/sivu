package co.uempresarial.sivu.plantilla.persistence;

import co.uempresarial.sivu.plantilla.domain.EstadoRespuesta;
import co.uempresarial.sivu.plantilla.domain.RespuestaFormulario;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RespuestaFormularioRepository extends JpaRepository<RespuestaFormulario, Long> {

    @EntityGraph(attributePaths = {"plantilla", "estudiante"})
    List<RespuestaFormulario> findByAsignadoAMongoIdOrderByFechaAsignacionDesc(String mongoId);

    List<RespuestaFormulario> findByEstadoOrderByFechaAsignacionAsc(EstadoRespuesta estado);

    @EntityGraph(attributePaths = {"plantilla", "respuestas", "estudiante", "convenio", "trimestre"})
    Optional<RespuestaFormulario> findWithDetailsById(Long id);
}
