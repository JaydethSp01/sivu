package co.uempresarial.sivu.plantilla.persistence;

import co.uempresarial.sivu.plantilla.domain.EstadoRespuesta;
import co.uempresarial.sivu.plantilla.domain.RespuestaFormulario;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface RespuestaFormularioRepository extends JpaRepository<RespuestaFormulario, Long> {

    @EntityGraph(attributePaths = {"plantilla", "estudiante"})
    List<RespuestaFormulario> findByAsignadoAMongoIdOrderByFechaAsignacionDesc(String mongoId);

    List<RespuestaFormulario> findByEstadoOrderByFechaAsignacionAsc(EstadoRespuesta estado);

    @EntityGraph(attributePaths = {"plantilla", "respuestas", "estudiante", "convenio", "trimestre"})
    Optional<RespuestaFormulario> findWithDetailsById(Long id);

    /**
     * Formularios cuya fecha límite cae dentro del rango y siguen abiertos
     * (PENDIENTE / EN_PROGRESO). Usado por el job de alertas de plazos.
     */
    @EntityGraph(attributePaths = {"plantilla", "estudiante"})
    @Query("""
        SELECT r FROM RespuestaFormulario r
        WHERE r.fechaLimite IS NOT NULL
          AND r.fechaLimite BETWEEN :desde AND :hasta
          AND r.estado IN :estados
        """)
    List<RespuestaFormulario> findProximosAVencer(
        @Param("desde") LocalDate desde,
        @Param("hasta") LocalDate hasta,
        @Param("estados") Collection<EstadoRespuesta> estados);
}
