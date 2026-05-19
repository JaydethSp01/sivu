package co.uempresarial.sivu.estudiante.persistence;

import co.uempresarial.sivu.estudiante.domain.EstadoEstudiante;
import co.uempresarial.sivu.estudiante.domain.Estudiante;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface EstudianteRepository extends JpaRepository<Estudiante, Long> {

    Optional<Estudiante> findByNumeroDocumento(String numeroDocumento);

    Optional<Estudiante> findByEmailIgnoreCase(String email);

    boolean existsByNumeroDocumento(String numeroDocumento);

    boolean existsByEmailIgnoreCase(String email);

    /**
     * Listado de estudiantes. Si se pasa {@code empresaId}, solo devuelve estudiantes
     * que tengan al menos una postulación a una vacante de esa empresa (auto-scope
     * para usuarios EMPRESA: solo ven sus practicantes/candidatos).
     */
    @Query("""
        SELECT DISTINCT e FROM Estudiante e
        WHERE (:q IS NULL OR :q = ''
               OR LOWER(e.nombres) LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(e.apellidos) LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(e.email) LIKE LOWER(CONCAT('%', :q, '%'))
               OR e.numeroDocumento LIKE CONCAT('%', :q, '%'))
          AND (:estado IS NULL OR e.estado = :estado)
          AND (:empresaId IS NULL OR e.id IN (
                SELECT p.estudiante.id FROM Postulacion p
                WHERE p.vacante.empresa.id = :empresaId))
        """)
    Page<Estudiante> buscar(@Param("q") String q,
                            @Param("estado") EstadoEstudiante estado,
                            @Param("empresaId") Long empresaId,
                            Pageable pageable);
}
