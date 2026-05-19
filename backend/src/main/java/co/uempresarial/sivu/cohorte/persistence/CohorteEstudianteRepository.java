package co.uempresarial.sivu.cohorte.persistence;

import co.uempresarial.sivu.cohorte.domain.CohorteEstudiante;
import co.uempresarial.sivu.cohorte.domain.EstadoCohorteEstudiante;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CohorteEstudianteRepository extends JpaRepository<CohorteEstudiante, Long> {

    @EntityGraph(attributePaths = {"cohorte", "estudiante"})
    @Query("""
        SELECT ce FROM CohorteEstudiante ce
        WHERE ce.cohorte.id = :cohorteId
          AND (:estado IS NULL OR ce.estado = :estado)
        ORDER BY ce.estudiante.apellidos ASC, ce.estudiante.nombres ASC
        """)
    List<CohorteEstudiante> listarPorCohorte(@Param("cohorteId") Long cohorteId,
                                             @Param("estado") EstadoCohorteEstudiante estado);

    @EntityGraph(attributePaths = {"cohorte", "estudiante"})
    List<CohorteEstudiante> findByEstudianteIdOrderByCreatedAtDesc(Long estudianteId);

    Optional<CohorteEstudiante> findByCohorteIdAndEstudianteId(Long cohorteId, Long estudianteId);

    boolean existsByCohorteIdAndEstudianteId(Long cohorteId, Long estudianteId);

    long countByCohorteIdAndEstado(Long cohorteId, EstadoCohorteEstudiante estado);
}
